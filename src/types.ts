export interface Repo {
  name: string;
  description: string;
  starredAt: string;
}

export interface GqlResponse {
  user: {
    starredRepositories: {
      edges: {
        starredAt: string;
        node: {
          nameWithOwner: string;
          description: string;
        };
      }[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      totalCount: number;
    };
  };
  rateLimit: {
    remaining: number;
    resetAt: string;
  };
}

export interface GithubClient {
  graphql(query: string, variables: Record<string, any>): Promise<GqlResponse>;
}
