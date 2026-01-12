import { validateInputs } from '../src/index';

describe('index', () => {
  describe('validateInputs', () => {
    it('should not throw for valid inputs', () => {
      const validParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: 'ghp_testtoken1234567890123456789012345678901234567890',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(validParams)).not.toThrow();
    });

    it('should throw for missing username', () => {
      const invalidParams = {
        username: '',
        repository: 'test/repo',
        token: 'ghp_testtoken1234567890123456789012345678901234567890',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Missing required parameter: username');
    });

    it('should throw for missing repository', () => {
      const invalidParams = {
        username: 'testuser',
        repository: '',
        token: 'ghp_testtoken1234567890123456789012345678901234567890',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Missing required parameter: repository');
    });

    it('should throw for missing token', () => {
      const invalidParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: '',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Missing required parameter: token');
    });

    it('should throw for missing target_dir', () => {
      const invalidParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: 'ghp_testtoken1234567890123456789012345678901234567890',
        target_dir: ''
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Missing required parameter: target_dir');
    });

    it('should throw for whitespace-only username', () => {
      const invalidParams = {
        username: '   ',
        repository: 'test/repo',
        token: 'ghp_testtoken1234567890123456789012345678901234567890',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Missing required parameter: username');
    });

    it('should throw for invalid token format', () => {
      const invalidParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: 'invalid-token',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Invalid GitHub token format');
    });

    it('should throw for token that is too short', () => {
      const invalidParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: 'ghp_short',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(invalidParams)).toThrow('Invalid GitHub token format');
    });

    it('should accept valid GitHub token formats', () => {
      const validTokenFormats = [
        'ghp_testtoken1234567890123456789012345678901234567890',
        'gho_testtoken1234567890123456789012345678901234567890',
        'ghu_testtoken1234567890123456789012345678901234567890',
        'ghs_testtoken1234567890123456789012345678901234567890',
        'ghr_testtoken1234567890123456789012345678901234567890',
        'ghe_testtoken1234567890123456789012345678901234567890',
        'github_pat_testtoken1234567890123456789012345678901234567890'
      ];

      validTokenFormats.forEach(token => {
        const params = {
          username: 'testuser',
          repository: 'test/repo',
          token: token,
          target_dir: '/tmp/test'
        };
        
        expect(() => validateInputs(params)).not.toThrow();
      });
    });

    it('should handle tokens with underscores and dashes', () => {
      const validParams = {
        username: 'testuser',
        repository: 'test/repo',
        token: 'ghp_test-token_123-456_78901234567890123456789012345678901234567890',
        target_dir: '/tmp/test'
      };
      
      expect(() => validateInputs(validParams)).not.toThrow();
    });
  });
});