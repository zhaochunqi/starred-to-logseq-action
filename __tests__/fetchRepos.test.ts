import { fetchRepos } from '../src/fetchRepos';
import { ApiError, delay } from '../src/utils';
import type { GithubClient, Repo } from '../src/types';

// Mock GitHub client and delay function
describe('fetchRepos', () => {
  let mockGithub: GithubClient;

  beforeEach(() => {
    mockGithub = {
      graphql: jest.fn()
    };
    
    // Mock delay to resolve immediately for faster tests
    jest.spyOn(require('../src/utils'), 'delay').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw error for empty username', async () => {
    await expect(fetchRepos(mockGithub, '')).rejects.toThrow('Username cannot be empty');
  });

  it('should throw error for whitespace-only username', async () => {
    await expect(fetchRepos(mockGithub, '   ')).rejects.toThrow('Username cannot be empty');
  });

  it('should handle successful API response with single page', async () => {
    const mockResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: 'Test repo 1'
              }
            },
            {
              starredAt: '2023-01-16T11:45:00Z',
              node: {
                nameWithOwner: 'owner/repo2',
                description: 'Test repo 2'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 2
        }
      },
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchRepos(mockGithub, 'testuser');
    
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('owner/repo1');
    expect(result[0].description).toBe('Test repo 1');
    expect(result[1].name).toBe('owner/repo2');
    expect(result[1].description).toBe('Test repo 2');
  });

  it('should handle pagination with multiple pages', async () => {
    const firstPageResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: 'Test repo 1'
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: 'cursor123'
          },
          totalCount: 3
        }
      },
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    const secondPageResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-16T11:45:00Z',
              node: {
                nameWithOwner: 'owner/repo2',
                description: 'Test repo 2'
              }
            },
            {
              starredAt: '2023-01-17T12:00:00Z',
              node: {
                nameWithOwner: 'owner/repo3',
                description: 'Test repo 3'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 3
        }
      },
      rateLimit: {
        remaining: 49,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock)
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(secondPageResponse);

    const result = await fetchRepos(mockGithub, 'testuser');
    
    expect(result).toHaveLength(3);
    expect(mockGithub.graphql).toHaveBeenCalledTimes(2);
  });

  it('should handle repositories with null descriptions', async () => {
    const mockResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: null
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 1
        }
      },
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchRepos(mockGithub, 'testuser');
    
    expect(result[0].description).toBe('');
  });

  it('should throw ApiError for user not found', async () => {
    const mockResponse = {
      user: null,
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock).mockResolvedValue(mockResponse);

    await expect(fetchRepos(mockGithub, 'nonexistentuser')).rejects.toThrow(ApiError);
    await expect(fetchRepos(mockGithub, 'nonexistentuser')).rejects.toThrow('User not found in response');
  });

  it('should handle rate limit warnings', async () => {
    const mockResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: 'Test repo 1'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 1
        }
      },
      rateLimit: {
        remaining: 5, // Below threshold
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock).mockResolvedValue(mockResponse);

    // This should not throw, but should log a warning
    const result = await fetchRepos(mockGithub, 'testuser');
    expect(result).toHaveLength(1);
  });

  it('should handle rate limit exceeded with retry', async () => {
    const errorResponse = {
      message: 'rate limit exceeded',
      status: 403
    };

    const successResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: 'Test repo 1'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 1
        }
      },
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock)
      .mockRejectedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await fetchRepos(mockGithub, 'testuser');
    expect(result).toHaveLength(1);
  });

  it('should handle authentication errors', async () => {
    const errorResponse = {
      message: 'Bad credentials',
      status: 401
    };

    (mockGithub.graphql as jest.Mock).mockRejectedValue(errorResponse);

    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow(ApiError);
    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow('Authentication failed: Bad credentials');
  });

  it('should handle resource not found errors', async () => {
    const errorResponse = {
      message: 'Not found',
      status: 404
    };

    (mockGithub.graphql as jest.Mock).mockRejectedValue(errorResponse);

    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow(ApiError);
    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow('Resource not found: Not found');
  });

  it('should handle server errors with retry', async () => {
    const errorResponse = {
      message: 'Internal server error',
      status: 500
    };

    const successResponse = {
      user: {
        starredRepositories: {
          edges: [
            {
              starredAt: '2023-01-15T10:30:00Z',
              node: {
                nameWithOwner: 'owner/repo1',
                description: 'Test repo 1'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          },
          totalCount: 1
        }
      },
      rateLimit: {
        remaining: 50,
        resetAt: '2023-01-17T00:00:00Z'
      }
    };

    (mockGithub.graphql as jest.Mock)
      .mockRejectedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await fetchRepos(mockGithub, 'testuser');
    expect(result).toHaveLength(1);
  });

  it('should handle maximum retry count exceeded', async () => {
    const errorResponse = {
      message: 'rate limit exceeded',
      status: 403
    };

    // Mock to always reject
    (mockGithub.graphql as jest.Mock).mockRejectedValue(errorResponse);

    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow(ApiError);
    await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow('Maximum retry count reached');
  });
});