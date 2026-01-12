import { formatDate, delay, exponentialBackoff, CONSTANTS, ApiError } from '../src/utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('should format valid date string correctly', () => {
      const result = formatDate('2023-01-15T10:30:00Z');
      expect(result).toBe('2023-01-15 Sunday');
    });

    it('should throw error for invalid date string', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date: "invalid-date"');
    });

    it('should handle different date formats', () => {
      expect(formatDate('2023-12-25T00:00:00Z')).toBe('2023-12-25 Monday');
      expect(formatDate('2023-02-14T23:59:59Z')).toBe('2023-02-14 Tuesday');
    });
  });

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      const elapsed = end - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(150); // Allow some margin
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await delay(0);
      const end = Date.now();
      const elapsed = end - start;
      
      expect(elapsed).toBeLessThan(10); // Should be very fast
    });
  });

  describe('exponentialBackoff', () => {
    it('should return correct backoff times', () => {
      expect(exponentialBackoff(0)).toBe(60000); // 1 minute
      expect(exponentialBackoff(1)).toBe(120000); // 2 minutes
      expect(exponentialBackoff(2)).toBe(240000); // 4 minutes
      expect(exponentialBackoff(3)).toBe(480000); // 8 minutes
    });

    it('should cap at maximum value', () => {
      expect(exponentialBackoff(4)).toBe(600000); // 10 minutes (max)
      expect(exponentialBackoff(5)).toBe(600000); // 10 minutes (max)
      expect(exponentialBackoff(10)).toBe(600000); // 10 minutes (max)
    });
  });

  describe('CONSTANTS', () => {
    it('should have correct constant values', () => {
      expect(CONSTANTS.MAX_RETRY_COUNT).toBe(5);
      expect(CONSTANTS.DELAY_BETWEEN_REQUESTS).toBe(5000);
      expect(CONSTANTS.LOW_RATE_LIMIT_THRESHOLD).toBe(10);
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Test error', 404);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should handle zero status', () => {
      const error = new ApiError('Another error', 0);
      expect(error.status).toBe(0);
    });
  });
});