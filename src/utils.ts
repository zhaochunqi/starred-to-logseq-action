import moment from "moment";

/**
 * Format date to specified format
 * @param date Date string
 * @returns Formatted date string
 */
export function formatDate(date: string): string {
  const m = moment(date);
  if (!m.isValid()) {
    throw new Error(`Invalid date: "${date}"`);
  }
  return m.format("YYYY-MM-DD dddd");
}

/**
 * Delay for specified milliseconds
 * @param ms Milliseconds
 * @returns Promise
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate wait time using exponential backoff strategy
 * @param retryCount Current retry count
 * @returns Wait time (milliseconds)
 */
export const exponentialBackoff = (retryCount: number) => {
  const baseDelay = 60000; // 1 minute
  return Math.min(baseDelay * Math.pow(2, retryCount), 600000); // Max 10 minutes
};

/**
 * Constants definition
 */
export const CONSTANTS = {
  MAX_RETRY_COUNT: 5,
  DELAY_BETWEEN_REQUESTS: 5000, // 5 seconds
  LOW_RATE_LIMIT_THRESHOLD: 10,
};

/**
 * Custom API error class
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
