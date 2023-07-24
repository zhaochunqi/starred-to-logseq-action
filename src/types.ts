export interface Repo {
  name: string
  description: string
  starredAt: string
}

export interface GqlResponse {
  user: {
    starredRepositories: {
      edges: {
        starredAt: string
        node: {
          nameWithOwner: string
          description: string
        }
      }[],
      pageInfo: {
        hasNextPage: boolean,
        endCursor: string
      }
      totalCount: number
    }
  }
}

export interface GithubClient {
  graphql(query: string, variables: Record<string, any>): Promise<GqlResponse>
}
