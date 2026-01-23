/**
 * Rate Limiter for AI Isometric Icon Generator
 * Limits requests to 10 per 60 seconds per client
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type {StoredRateLimit} from '@/types';

const STORAGE_KEY = 'isometric-generator-rate-limit';
const MAX_REQUESTS = 5; // Match server-side limit
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours (match server)

export interface RateLimiter {
  canMakeRequest(): boolean;
  recordRequest(): void;
  getTimeUntilReset(): number;
  getRemainingRequests(): number;
}

/**
 * Creates a rate limiter with localStorage persistence
 * For testing, accepts optional storage interface
 */
export function createRateLimiter(
  storage?: Storage,
  getCurrentTime?: () => number,
): RateLimiter {
  const getStorage = (): Storage | null => {
    if (storage) return storage;
    if (typeof window !== 'undefined') return window.localStorage;
    return null;
  };

  const now = (): number => {
    return getCurrentTime ? getCurrentTime() : Date.now();
  };

  const getState = (): StoredRateLimit => {
    const store = getStorage();
    if (!store) {
      return {count: 0, windowStart: now()};
    }

    try {
      const stored = store.getItem(STORAGE_KEY);
      if (!stored) {
        return {count: 0, windowStart: now()};
      }

      const parsed: StoredRateLimit = JSON.parse(stored);

      // Check if window has expired
      if (now() - parsed.windowStart >= WINDOW_MS) {
        return {count: 0, windowStart: now()};
      }

      return parsed;
    } catch {
      return {count: 0, windowStart: now()};
    }
  };

  const setState = (state: StoredRateLimit): void => {
    const store = getStorage();
    if (!store) return;

    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage might be full or unavailable
    }
  };

  return {
    canMakeRequest(): boolean {
      const state = getState();
      return state.count < MAX_REQUESTS;
    },

    recordRequest(): void {
      const state = getState();

      // Reset window if expired
      if (now() - state.windowStart >= WINDOW_MS) {
        setState({count: 1, windowStart: now()});
      } else {
        setState({count: state.count + 1, windowStart: state.windowStart});
      }
    },

    getTimeUntilReset(): number {
      const state = getState();
      const elapsed = now() - state.windowStart;
      const remaining = WINDOW_MS - elapsed;
      return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
    },

    getRemainingRequests(): number {
      const state = getState();
      return Math.max(0, MAX_REQUESTS - state.count);
    },
  };
}

export {MAX_REQUESTS, STORAGE_KEY, WINDOW_MS};
