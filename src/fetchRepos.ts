import { info, warning, error as logError } from "@actions/core";
import type { GithubClient, Repo, GqlResponse } from "./types";
import { formatDate, delay, exponentialBackoff, CONSTANTS, ApiError } from "./utils";

/**
 * Validate input parameters
 * @param username GitHub username
 * @throws {Error} If username is empty
 */
function validateInput(username: string): void {
  if (!username || username.trim() === "") {
    throw new Error("Username cannot be empty");
  }
}

/**
 * Fetch user's starred repositories list
 * @param github GitHub client
 * @param username GitHub username
 * @param after Pagination cursor
 * @param retryCount Retry count
 * @param collection Already collected repositories
 * @returns Promise<Repo[]> Repository list
 */
export const fetchRepos = async (
  github: GithubClient,
  username: string,
  after = "",
  retryCount = 0,
  collection: Repo[] = []
): Promise<Repo[]> => {
  // Validate input parameters
  validateInput(username);
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
  const variables = { login: username, after };

  try {
    const data = (await github.graphql(query, variables)) as GqlResponse;

    if (!data.user) {
      throw new ApiError("User not found in response", 404);
    }
    const starred = data.user.starredRepositories;
    const newRepos = starred.edges.map((edge) => ({
      name: edge.node.nameWithOwner,
      description: edge.node.description || ``,
      starredAt: formatDate(edge.starredAt),
    }));

    const updatedCollection = [...collection, ...newRepos];

    info(`Fetched repos count: ${updatedCollection.length}/${starred.totalCount}`);

    // Check remaining API request count
    const remainingRequests = data.rateLimit.remaining;
    if (remainingRequests < CONSTANTS.LOW_RATE_LIMIT_THRESHOLD) {
      const resetTime = new Date(data.rateLimit.resetAt);
      warning(
        `API rate limit is close to exceeding. ${remainingRequests} requests remaining. Limit will reset at ${resetTime}`
      );
    }

    if (starred.pageInfo?.hasNextPage) {
      // Add delay to avoid frequent requests
      await delay(CONSTANTS.DELAY_BETWEEN_REQUESTS);
      return fetchRepos(
        github,
        username,
        starred.pageInfo.endCursor || "",
        0, // Reset retry count on successful request
        updatedCollection
      );
    }

    return updatedCollection;
  } catch (error) {
    // Handle errors
    const err = error as Error;
    let status = 0;
    let message = err.message;

    // Try to extract status code
    if ("status" in err && typeof (err as any).status === "number") {
      status = (err as any).status;
    }

    // Handle different types of errors
    if (status === 403) {
      const errorMessage = message.toLowerCase();
      if (
        errorMessage.includes("rate limit exceeded") ||
        errorMessage.includes("secondary rate limit")
      ) {
        // Check if maximum retry count is exceeded
        if (retryCount >= CONSTANTS.MAX_RETRY_COUNT) {
          logError(
            `Maximum retry count reached (${CONSTANTS.MAX_RETRY_COUNT}). Abandoning request.`
          );
          throw new ApiError(`Maximum retry count reached: ${message}`, status);
        }

        const waitTime = exponentialBackoff(retryCount);
        warning(
          `Rate limit hit (${errorMessage}). Waiting for ${
            waitTime / 1000
          } seconds before retrying... (Attempt ${retryCount + 1}/${CONSTANTS.MAX_RETRY_COUNT})`
        );
        await delay(waitTime);
        // Retry the request
        return fetchRepos(github, username, after, retryCount + 1, collection);
      }
    } else if (status === 401) {
      logError(`Authentication failed: ${message}`);
      throw new ApiError(`Authentication failed: ${message}`, status);
    } else if (status === 404) {
      logError(`Resource not found: ${message}`);
      throw new ApiError(`Resource not found: ${message}`, status);
    } else if (status >= 500) {
      // Server error, try to retry
      if (retryCount < CONSTANTS.MAX_RETRY_COUNT) {
        const waitTime = exponentialBackoff(retryCount);
        warning(
          `Server error (${status}): ${message}. Waiting ${
            waitTime / 1000
          } seconds before retrying... (Attempt ${retryCount + 1}/${CONSTANTS.MAX_RETRY_COUNT})`
        );
        await delay(waitTime);
        return fetchRepos(github, username, after, retryCount + 1, collection);
      } else {
        logError(`Maximum retry count reached (${CONSTANTS.MAX_RETRY_COUNT}). Abandoning request.`);
        throw new ApiError(`Maximum retry count reached: ${message}`, status);
      }
    }

    // If we've reached this point, it's an unhandled error
    logError(`Unhandled error: ${message}`);
    throw new ApiError(message, status || 0);
  }
};
