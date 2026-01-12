import { describe, it, expect } from 'vitest';
import { formatDate, delay, exponentialBackoff, CONSTANTS, ApiError } from './utils';

describe('utils.ts', () => {
  describe('formatDate', () => {
    it('should format valid date correctly', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/2024-01-15/);
    });

    it('should include day of week', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    });

    it('should throw error for invalid date', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date');
    });

    it('should handle ISO 8601 format', () => {
      const result = formatDate('2023-12-25T08:00:00.000Z');
      expect(result).toContain('2023-12-25');
    });
  });

  describe('delay', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(200);
    });

    it('should handle zero delay', async () => {
      await delay(0);
      expect(true).toBe(true);
    });
  });

  describe('exponentialBackoff', () => {
    it('should return base delay for first retry', () => {
      const result = exponentialBackoff(0);
      expect(result).toBe(60000);
    });

    it('should double delay for each retry', () => {
      expect(exponentialBackoff(0)).toBe(60000);
      expect(exponentialBackoff(1)).toBe(120000);
      expect(exponentialBackoff(2)).toBe(240000);
    });

    it('should cap at maximum 10 minutes', () => {
      const result = exponentialBackoff(10);
      expect(result).toBe(600000);
    });

    it('should cap at retry count 4', () => {
      expect(exponentialBackoff(3)).toBe(480000);
      expect(exponentialBackoff(4)).toBe(600000);
    });
  });

  describe('CONSTANTS', () => {
    it('should have correct MAX_RETRY_COUNT', () => {
      expect(CONSTANTS.MAX_RETRY_COUNT).toBe(5);
    });

    it('should have correct DELAY_BETWEEN_REQUESTS', () => {
      expect(CONSTANTS.DELAY_BETWEEN_REQUESTS).toBe(5000);
    });

    it('should have correct LOW_RATE_LIMIT_THRESHOLD', () => {
      expect(CONSTANTS.LOW_RATE_LIMIT_THRESHOLD).toBe(10);
    });
  });

  describe('ApiError', () => {
    it('should create error with message and status', () => {
      const error = new ApiError('Not Found', 404);
      expect(error.message).toBe('Not Found');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should be instance of Error', () => {
      const error = new ApiError('Error', 500);
      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of ApiError', () => {
      const error = new ApiError('Error', 500);
      expect(error instanceof ApiError).toBe(true);
    });
  });
});
