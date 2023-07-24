import { info } from '@actions/core'
import type { GithubClient, Repo } from './types'
import moment from 'moment';

function formatDate(date: string) {
  return moment(date).format('YYYY-MM-DD dddd')
}

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
    }
  `
  const variables = {
    "login": username,
    "after": after
  }
  const data = await github.graphql(query, variables)
  const starred = data.user.starredRepositories
  starred.edges.map(edges => {
    const repo = {
      name: edges.node.nameWithOwner,
      description: edges.node.description || ``,
      starredAt: formatDate(edges.starredAt),
    }
    collection.push(repo)
  })

  info(`fetch repos count: ${collection.length}/${starred.totalCount}`)

  if (starred.pageInfo?.hasNextPage) {
    await fetchRepos(github, collection, username, starred.pageInfo.endCursor)
  }
}
