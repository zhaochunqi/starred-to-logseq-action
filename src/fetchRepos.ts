import { info, warning, error as logError } from "@actions/core";
import type { GithubClient, Repo } from "./types";
import moment from "moment";

function formatDate(date: string) {
  return moment(date).format("YYYY-MM-DD dddd");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const exponentialBackoff = (retryCount: number) => {
  const baseDelay = 60000; // 1 minute
  return Math.min(baseDelay * Math.pow(2, retryCount), 600000); // Max 10 minutes
};

export const fetchRepos = async (
  github: GithubClient,
  username: string,
  after = ``,
  retryCount = 0,
  collection: Repo[] = []
): Promise<Repo[]> => {
  const query = `
    query($login: String!, $after: String!) {
      user(login: $login) {
        starredRepositories(
          orderBy: {field: STARRED_AT, direction: DESC},
          first: 100, 
          after: $after
        ) {
          edges {
            starredAt
            node {
              nameWithOwner
              description
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
        }
      }
      rateLimit {
        remaining
        resetAt
      }
    }
  `;
  const variables = {
    login: username,
    after: after,
  };

  try {
    const data = await github.graphql(query, variables);
    const starred = data.user.starredRepositories;
    const newRepos = starred.edges.map((edge) => ({
      name: edge.node.nameWithOwner,
      description: edge.node.description || ``,
      starredAt: formatDate(edge.starredAt),
    }));

    const updatedCollection = [...collection, ...newRepos];

    info(
      `fetch repos count: ${updatedCollection.length}/${starred.totalCount}`
    );

    // 检查剩余的 API 请求次数
    const remainingRequests = data.rateLimit.remaining;
    if (remainingRequests < 10) {
      const resetTime = new Date(data.rateLimit.resetAt);
      warning(
        `API rate limit is close to exceeding. ${remainingRequests} requests remaining. Limit will reset at ${resetTime}`
      );
    }

    if (starred.pageInfo?.hasNextPage) {
      // 添加延迟以避免频繁请求
      await delay(5000); // Increased delay to 5 seconds
      return fetchRepos(
        github,
        username,
        starred.pageInfo.endCursor,
        0, // Reset retry count on successful request
        updatedCollection
      );
    }

    return updatedCollection;
  } catch (error: any) {
    if (error.status === 403) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("rate limit exceeded") ||
        errorMessage.includes("secondary rate limit")
      ) {
        const waitTime = exponentialBackoff(retryCount);
        warning(
          `Rate limit hit (${errorMessage}). Waiting for ${
            waitTime / 1000
          } seconds before retrying... (Attempt ${retryCount + 1})`
        );
        await delay(waitTime);
        // Retry the request
        return fetchRepos(github, username, after, retryCount + 1, collection);
      }
    }

    // If we've reached this point, it's an unhandled error
    logError(`Unhandled error: ${error.message}`);
    throw error;
  }
};
