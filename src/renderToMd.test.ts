import { describe, it, expect } from 'vitest';
import { renderToMd } from './renderToMd';
import type { Repo } from './types';

describe('renderToMd.ts', () => {
  const createMockRepo = (overrides: Partial<Repo> = {}): Repo => ({
    name: 'owner/repo',
    description: 'Test description',
    starredAt: '2024-01-15 Monday',
    ...overrides,
  });

  describe('renderToMd', () => {
    it('should generate markdown with page header', () => {
      const repos: Repo[] = [];
      const result = renderToMd('owner/test-repo', repos);

      expect(result).toContain('icon:: ⭐');
      expect(result).toContain('tags:: 自动更新');
      expect(result).toContain('public:: false');
      expect(result).toContain('description::');
      expect(result).toContain('GitHub Action');
    });

    it('should include updateTime', () => {
      const repos: Repo[] = [];
      const result = renderToMd('owner/test-repo', repos);

      expect(result).toContain('updateTime::');
    });

    it('should format title from repository name', () => {
      const repos: Repo[] = [];
      const result = renderToMd('owner/my-cool-repo', repos);

      expect(result).toContain('icon:: ⭐');
    });

    it('should handle empty repository list', () => {
      const repos: Repo[] = [];
      const result = renderToMd('owner/empty-repo', repos);

      expect(result.indexOf('- ##')).toBe(-1);
    });

    it('should group repositories by starred date', () => {
      const repos: Repo[] = [
        createMockRepo({ name: 'owner/repo1', starredAt: '2024-01-15 Monday' }),
        createMockRepo({ name: 'owner/repo2', starredAt: '2024-01-15 Monday' }),
        createMockRepo({ name: 'owner/repo3', starredAt: '2024-01-16 Tuesday' }),
      ];

      const result = renderToMd('owner/test', repos);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('2024-01-16');
    });

    it('should sort dates in descending order', () => {
      const repos: Repo[] = [
        createMockRepo({ name: 'owner/repo1', starredAt: '2024-01-10 Wednesday' }),
        createMockRepo({ name: 'owner/repo2', starredAt: '2024-01-20 Saturday' }),
        createMockRepo({ name: 'owner/repo3', starredAt: '2024-01-15 Monday' }),
      ];

      const result = renderToMd('owner/test', repos);

      const jan20Pos = result.indexOf('2024-01-20');
      const jan15Pos = result.indexOf('2024-01-15');
      const jan10Pos = result.indexOf('2024-01-10');

      expect(jan20Pos).toBeLessThan(jan15Pos);
      expect(jan15Pos).toBeLessThan(jan10Pos);
    });

    it('should render repository links correctly', () => {
      const repos: Repo[] = [
        createMockRepo({ name: 'facebook/react', description: 'A UI library' }),
      ];

      const result = renderToMd('owner/test', repos);

      expect(result).toContain('[[github.com/facebook/react]]');
    });

    it('should handle repositories without description', () => {
      const repos: Repo[] = [
        createMockRepo({ name: 'owner/no-desc', description: '' }),
      ];

      const result = renderToMd('owner/test', repos);

      expect(result).toContain('No Description Yet.');
    });

    it('should sanitize special characters from description', () => {
      const repos: Repo[] = [
        createMockRepo({
          name: 'owner/test',
          description: 'This has [[wiki]] links and #tags',
        }),
      ];

      const result = renderToMd('owner/test', repos);

      expect(result).not.toContain('[[wiki]]');
      expect(result).not.toContain('#tags');
    });

    it('should sort repositories alphabetically within same date', () => {
      const repos: Repo[] = [
        createMockRepo({ name: 'owner/zebra', starredAt: '2024-01-15 Monday' }),
        createMockRepo({ name: 'owner/apple', starredAt: '2024-01-15 Monday' }),
        createMockRepo({ name: 'owner/banana', starredAt: '2024-01-15 Monday' }),
      ];

      const result = renderToMd('owner/test', repos);

      const applePos = result.indexOf('owner/apple');
      const bananaPos = result.indexOf('owner/banana');
      const zebraPos = result.indexOf('owner/zebra');

      expect(applePos).toBeLessThan(bananaPos);
      expect(bananaPos).toBeLessThan(zebraPos);
    });

    it('should generate valid logseq format', () => {
      const repos: Repo[] = [
        createMockRepo({
          name: 'owner/test-repo',
          description: 'Test',
          starredAt: '2024-01-15 Monday',
        }),
      ];

      const result = renderToMd('owner/my-repo', repos);

      expect(result).toMatch(/^- ## \[\[/m);
      expect(result).toMatch(/\t- \[\[github\.com\//m);
    });

    it('should handle large number of repositories', () => {
      const repos: Repo[] = Array.from({ length: 100 }, (_: unknown, i: number) =>
        createMockRepo({
          name: `owner/repo${i}`,
          description: `Description ${i}`,
          starredAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')} Monday`,
        })
      );

      const result = renderToMd('owner/test', repos);

      expect(result).toContain('updateTime::');
      const splitResult = result.split('[[github.com/owner/repo');
      expect(splitResult.length).toBe(101);
    });

    it('should trim trailing whitespace', () => {
      const repos: Repo[] = [createMockRepo()];
      const result = renderToMd('owner/test', repos);

      expect(result).toBe(result.trimEnd());
    });
  });
});
