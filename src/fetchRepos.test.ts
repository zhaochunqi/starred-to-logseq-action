import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRepos } from './fetchRepos';
import type { GithubClient } from './types';

describe('fetchRepos.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateInput', () => {
    it('should throw error for empty username', async () => {
      const mockGithub = createMockGithubClient([]);
      await expect(fetchRepos(mockGithub, '')).rejects.toThrow('Username cannot be empty');
    });

    it('should throw error for whitespace-only username', async () => {
      const mockGithub = createMockGithubClient([]);
      await expect(fetchRepos(mockGithub, '   ')).rejects.toThrow('Username cannot be empty');
    });
  });

  describe('fetchRepos', () => {
    it('should return empty array when user has no starred repos', async () => {
      const mockGithub = createMockGithubClient([]);
      const result = await fetchRepos(mockGithub, 'testuser');
      expect(result).toEqual([]);
    });

    it('should fetch single page of repositories', async () => {
      const mockRepos = [
        { name: 'owner/repo1', description: 'Description 1' },
        { name: 'owner/repo2', description: 'Description 2' },
      ];
      const mockGithub = createMockGithubClient(mockRepos);
      const result = await fetchRepos(mockGithub, 'testuser');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('owner/repo1');
      expect(result[1].name).toBe('owner/repo2');
    });

    it('should handle null description', async () => {
      const mockGithub = createMockGithubClient([{ name: 'owner/repo', description: null }]);
      const result = await fetchRepos(mockGithub, 'testuser');

      expect(result[0].description).toBe('');
    });

    it('should format starredAt date correctly', async () => {
      const mockGithub = createMockGithubClient([{ name: 'owner/repo', description: 'desc' }], '2024-01-15T10:30:00Z');
      const result = await fetchRepos(mockGithub, 'testuser');

      expect(result[0].starredAt).toContain('2024-01-15');
    });

    it('should throw ApiError for non-existent user', async () => {
      const mockGithub = createMockGithubClientForError(404, 'User not found');
      await expect(fetchRepos(mockGithub, 'nonexistent')).rejects.toThrow('User not found');
    });

    it('should throw ApiError for authentication failure', async () => {
      const mockGithub = createMockGithubClientForError(401, 'Bad credentials');
      await expect(fetchRepos(mockGithub, 'testuser')).rejects.toThrow('Authentication failed');
    });
  });
});

function createMockGithubClient(
  repos: Array<{ name: string; description: string | null }>,
  starredAt = '2024-01-15T10:30:00Z'
): GithubClient {
  return {
    graphql: vi.fn().mockResolvedValue({
      user: {
        starredRepositories: {
          edges: repos.map(r => ({
            starredAt,
            node: {
              nameWithOwner: r.name,
              description: r.description,
            },
          })),
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
          totalCount: repos.length,
        },
      },
      rateLimit: {
        remaining: 100,
        resetAt: new Date().toISOString(),
      },
    }),
  } as unknown as GithubClient;
}

function createMockGithubClientForError(status: number, message: string): GithubClient {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return {
    graphql: vi.fn().mockRejectedValue(error),
  } as unknown as GithubClient;
}
