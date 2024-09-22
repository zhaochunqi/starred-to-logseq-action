import { info, warning } from "@actions/core";
import type { GithubClient, Repo } from "./types";
import moment from "moment";

function formatDate(date: string) {
  return moment(date).format("YYYY-MM-DD dddd");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchRepos = async (
  github: GithubClient,
  collection: Repo[],
  username: string,
  after = ``
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
      await delay(1000);
      await fetchRepos(
        github,
        collection,
        username,
        starred.pageInfo.endCursor
      );
    }
  } catch (error) {
    if (
      (error as any).status === 403 &&
      (error as any).message.includes("API rate limit exceeded")
    ) {
      const resetTime = new Date(
        (error as any).headers["x-ratelimit-reset"] * 1000
      );
      warning(
        `API rate limit exceeded. Waiting until ${resetTime} to continue...`
      );
      await delay(Date.now() - resetTime.getTime());
      await fetchRepos(github, collection, username, after);
    } else {
      throw error;
    }
  }
};
