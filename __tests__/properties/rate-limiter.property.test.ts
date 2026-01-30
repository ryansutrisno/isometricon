/**
 * Feature: ai-isometric-icon-generator
 * Property 9: Rate Limit Enforcement
 * Validates: Requirements 8.1, 8.2
 *
 * For any sequence of N generation requests within a 60-second window,
 * the Rate_Limiter SHALL allow the first 10 requests and block all subsequent
 * requests until the window resets, returning a RATE_LIMIT error for blocked requests.
 */

import {MAX_REQUESTS, WINDOW_MS, createRateLimiter} from '@/lib/rate-limiter';
import fc from 'fast-check';
import {beforeEach, describe, expect, it} from 'vitest';

// Mock localStorage for testing
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('Property 9: Rate Limit Enforcement', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('should allow first 10 requests and block subsequent ones', () => {
    fc.assert(
      fc.property(fc.integer({min: 1, max: 30}), (requestCount) => {
        mockStorage.clear();
        const limiter = createRateLimiter(mockStorage);
        const results: boolean[] = [];

        for (let i = 0; i < requestCount; i++) {
          const canRequest = limiter.canMakeRequest();
          results.push(canRequest);
          if (canRequest) {
            limiter.recordRequest();
          }
        }

        const allowedCount = results.filter(Boolean).length;

        // Should allow at most MAX_REQUESTS
        expect(allowedCount).toBeLessThanOrEqual(MAX_REQUESTS);

        // If we made more than MAX_REQUESTS attempts, exactly MAX_REQUESTS should be allowed
        if (requestCount >= MAX_REQUESTS) {
          expect(allowedCount).toBe(MAX_REQUESTS);
        }

        // All requests after MAX_REQUESTS should be blocked
        if (requestCount > MAX_REQUESTS) {
          const blockedResults = results.slice(MAX_REQUESTS);
          expect(blockedResults.every((r) => !r)).toBe(true);
        }
      }),
      {numRuns: 100},
    );
  });

  it('should reset after window expires', () => {
    let currentTime = 0;
    const getCurrentTime = () => currentTime;

    mockStorage.clear();
    const limiter = createRateLimiter(mockStorage, getCurrentTime);

    // Make MAX_REQUESTS requests
    for (let i = 0; i < MAX_REQUESTS; i++) {
      expect(limiter.canMakeRequest()).toBe(true);
      limiter.recordRequest();
    }

    // Should be blocked now
    expect(limiter.canMakeRequest()).toBe(false);

    // Advance time past the window
    currentTime = WINDOW_MS + 1;

    // Should be able to make requests again
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('should track remaining requests correctly', () => {
    fc.assert(
      fc.property(fc.integer({min: 0, max: MAX_REQUESTS}), (requestsMade) => {
        mockStorage.clear();
        const limiter = createRateLimiter(mockStorage);

        for (let i = 0; i < requestsMade; i++) {
          limiter.recordRequest();
        }

        const remaining = limiter.getRemainingRequests();
        expect(remaining).toBe(MAX_REQUESTS - requestsMade);
      }),
      {numRuns: 100},
    );
  });

  it('should return positive time until reset when rate limited', () => {
    let currentTime = 0;
    const getCurrentTime = () => currentTime;

    mockStorage.clear();
    const limiter = createRateLimiter(mockStorage, getCurrentTime);

    // Make MAX_REQUESTS requests
    for (let i = 0; i < MAX_REQUESTS; i++) {
      limiter.recordRequest();
    }

    // Time until reset should be positive
    const timeUntilReset = limiter.getTimeUntilReset();
    expect(timeUntilReset).toBeGreaterThan(0);
    // WINDOW_MS is 24 hours (86400 seconds)
    expect(timeUntilReset).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });

  it('should handle concurrent request patterns', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), {minLength: 1, maxLength: 20}),
        (requestPattern) => {
          mockStorage.clear();
          const limiter = createRateLimiter(mockStorage);
          let successCount = 0;

          for (const shouldRequest of requestPattern) {
            if (shouldRequest && limiter.canMakeRequest()) {
              limiter.recordRequest();
              successCount++;
            }
          }

          // Should never exceed MAX_REQUESTS
          expect(successCount).toBeLessThanOrEqual(MAX_REQUESTS);
        },
      ),
      {numRuns: 100},
    );
  });
});
