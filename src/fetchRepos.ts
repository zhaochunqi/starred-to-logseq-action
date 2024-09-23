import { info, warning } from "@actions/core";
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
  collection: Repo[],
  username: string,
  after = ``,
  retryCount = 0
) => {
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
    starred.edges.map((edges) => {
      const repo = {
        name: edges.node.nameWithOwner,
        description: edges.node.description || ``,
        starredAt: formatDate(edges.starredAt),
      };
      collection.push(repo);
    });

    info(`fetch repos count: ${collection.length}/${starred.totalCount}`);

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
      await fetchRepos(
        github,
        collection,
        username,
        starred.pageInfo.endCursor,
        0 // Reset retry count on successful request
      );
    }
  } catch (error: any) {
    if (error.status === 403) {
      if (error.message.includes("API rate limit exceeded")) {
        // Handle primary rate limit
        const resetTime = new Date(error.headers["x-ratelimit-reset"] * 1000);
        warning(
          `API rate limit exceeded. Waiting until ${resetTime} to continue...`
        );
        await delay(resetTime.getTime() - Date.now());
      } else if (error.message.includes("secondary rate limit")) {
        // Handle secondary rate limit
        const waitTime = exponentialBackoff(retryCount);
        warning(
          `Secondary rate limit hit. Waiting for ${
            waitTime / 1000
          } seconds before retrying...`
        );
        await delay(waitTime);
      } else {
        throw error;
      }
      // Retry the request
      await fetchRepos(github, collection, username, after, retryCount + 1);
    } else {
      throw error;
    }
  }
};
