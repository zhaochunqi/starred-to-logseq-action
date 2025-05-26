/**
 * Repository information interface
 */
export interface Repo {
  /** Repository name (including owner) */
  name: string;
  /** Repository description */
  description: string;
  /** Starred date (formatted) */
  starredAt: string;
}

/**
 * GraphQL error response interface
 */
export interface GqlErrorResponse {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

/**
 * GraphQL query response interface
 */
export interface GqlResponse {
  /** User information */
  user: {
    /** User's starred repositories */
    starredRepositories: {
      /** Repository edge data */
      edges: {
        /** Time when repository was starred */
        starredAt: string;
        /** Repository node data */
        node: {
          /** Repository full name (including owner) */
          nameWithOwner: string;
          /** Repository description */
          description: string;
        };
      }[];
      /** Pagination information */
      pageInfo: {
        /** Whether there is a next page */
        hasNextPage: boolean;
        /** End cursor (null when no subsequent page) */
        endCursor: string | null;
      };
      /** Total count */
      totalCount: number;
    };
  };
  /** API rate limit information */
  rateLimit: {
    /** Remaining requests */
    remaining: number;
    /** Reset time */
    resetAt: string;
  };
}

/**
 * GitHub client interface
 */
export interface GithubClient {
  /**
   * Execute GraphQL query
   * @param query GraphQL query string
   * @param variables Query variables
   * @returns Query response
   */
  graphql(query: string, variables: Record<string, any>): Promise<GqlResponse>;
}
