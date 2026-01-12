import { renderToMd } from '../src/renderToMd';

describe('renderToMd', () => {
  const testRepos = [
    {
      name: 'owner/repo1',
      description: 'Test repository 1',
      starredAt: '2023-01-15 Sunday'
    },
    {
      name: 'owner/repo2',
      description: 'Test repository 2 with [[brackets]] and #hashtags',
      starredAt: '2023-01-15 Sunday'
    },
    {
      name: 'owner/repo3',
      description: '',
      starredAt: '2023-01-16 Monday'
    },
    {
      name: 'owner/repo4',
      description: 'Another test repo',
      starredAt: '2023-01-14 Saturday'
    }
  ];

  it('should render basic markdown structure', () => {
    const result = renderToMd('test/repo', testRepos);
    
    expect(result).toContain('icon:: ⭐');
    expect(result).toContain('tags:: 自动更新');
    expect(result).toContain('public:: false');
    expect(result).toContain('description:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。');
    expect(result).toContain('updateTime::');
  });

  it('should group repositories by date', () => {
    const result = renderToMd('test/repo', testRepos);
    
    // Should have date sections
    expect(result).toContain('[[2023-01-15 Sunday]]');
    expect(result).toContain('[[2023-01-16 Monday]]');
    expect(result).toContain('[[2023-01-14 Saturday]]');
  });

  it('should sort dates in descending order', () => {
    const result = renderToMd('test/repo', testRepos);
    
    // Check that dates appear in descending order
    const date15Pos = result.indexOf('[[2023-01-15 Sunday]]');
    const date16Pos = result.indexOf('[[2023-01-16 Monday]]');
    const date14Pos = result.indexOf('[[2023-01-14 Saturday]]');
    
    expect(date16Pos).toBeLessThan(date15Pos); // Monday should come before Sunday
    expect(date15Pos).toBeLessThan(date14Pos); // Sunday should come before Saturday
  });

  it('should sort repositories alphabetically within each date', () => {
    const reposSameDate = [
      {
        name: 'owner/z-repo',
        description: 'Z repo',
        starredAt: '2023-01-15 Sunday'
      },
      {
        name: 'owner/a-repo',
        description: 'A repo',
        starredAt: '2023-01-15 Sunday'
      },
      {
        name: 'owner/m-repo',
        description: 'M repo',
        starredAt: '2023-01-15 Sunday'
      }
    ];
    
    const result = renderToMd('test/repo', reposSameDate);
    
    // Check that repos are sorted alphabetically
    const aRepoPos = result.indexOf('[[github.com/owner/a-repo]]');
    const mRepoPos = result.indexOf('[[github.com/owner/m-repo]]');
    const zRepoPos = result.indexOf('[[github.com/owner/z-repo]]');
    
    expect(aRepoPos).toBeLessThan(mRepoPos);
    expect(mRepoPos).toBeLessThan(zRepoPos);
  });

  it('should handle empty descriptions', () => {
    const reposWithEmptyDesc = [
      {
        name: 'owner/repo-empty',
        description: '',
        starredAt: '2023-01-15 Sunday'
      }
    ];
    
    const result = renderToMd('test/repo', reposWithEmptyDesc);
    expect(result).toContain('No Description Yet.');
  });

  it('should sanitize descriptions with special characters', () => {
    const reposWithSpecialChars = [
      {
        name: 'owner/repo-special',
        description: 'Description with [[double brackets]] and #hashtags',
        starredAt: '2023-01-15 Sunday'
      }
    ];
    
    const result = renderToMd('test/repo', reposWithSpecialChars);
    expect(result).toContain('Description with double brackets and hashtags');
    expect(result).not.toContain('[[');
    expect(result).not.toContain(']]');
    expect(result).not.toContain('#');
  });

  it('should handle repository names with special characters', () => {
    const reposWithSpecialNames = [
      {
        name: 'owner/my-repo',
        description: 'Repo with dashes',
        starredAt: '2023-01-15 Sunday'
      },
      {
        name: 'owner/my_repo',
        description: 'Repo with underscores',
        starredAt: '2023-01-15 Sunday'
      }
    ];
    
    const result = renderToMd('test/repo', reposWithSpecialNames);
    expect(result).toContain('[[github.com/owner/my-repo]]');
    expect(result).toContain('[[github.com/owner/my_repo]]');
  });

  it('should handle empty repository array', () => {
    const result = renderToMd('test/repo', []);
    
    // Should still have header but no content sections
    expect(result).toContain('icon:: ⭐');
    expect(result).toContain('updateTime::');
    // Should not have any repository links
    expect(result).not.toContain('[[github.com/');
  });

  it('should handle repository with very long description', () => {
    const longDescription = 'A'.repeat(500); // Very long description
    const reposWithLongDesc = [
      {
        name: 'owner/repo-long',
        description: longDescription,
        starredAt: '2023-01-15 Sunday'
      }
    ];
    
    const result = renderToMd('test/repo', reposWithLongDesc);
    expect(result).toContain(longDescription);
  });
});