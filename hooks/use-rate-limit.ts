'use client';

/**
 * useRateLimit Hook
 * React wrapper for rate limiter with auto-updating countdown timer
 * Requirements: 8.1, 8.2, 8.3
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {createRateLimiter, type RateLimiter} from '@/lib/rate-limiter';

export interface UseRateLimitReturn {
  canRequest: boolean;
  remainingRequests: number;
  timeUntilReset: number;
  recordRequest: () => void;
}

export function useRateLimit(): UseRateLimitReturn {
  const rateLimiterRef = useRef<RateLimiter | null>(null);
  const [canRequest, setCanRequest] = useState(true);
  const [remainingRequests, setRemainingRequests] = useState(10);
  const [timeUntilReset, setTimeUntilReset] = useState(0);

  // Initialize rate limiter on mount
  useEffect(() => {
    rateLimiterRef.current = createRateLimiter();
    updateState();
  }, []);

  // Update state from rate limiter
  const updateState = useCallback(() => {
    if (!rateLimiterRef.current) return;

    setCanRequest(rateLimiterRef.current.canMakeRequest());
    setRemainingRequests(rateLimiterRef.current.getRemainingRequests());
    setTimeUntilReset(rateLimiterRef.current.getTimeUntilReset());
  }, []);

  // Auto-update countdown timer when rate limited
  useEffect(() => {
    if (canRequest || timeUntilReset <= 0) return;

    const intervalId = setInterval(() => {
      if (!rateLimiterRef.current) return;

      const newTime = rateLimiterRef.current.getTimeUntilReset();
      setTimeUntilReset(newTime);

      // Check if we can make requests again
      if (rateLimiterRef.current.canMakeRequest()) {
        setCanRequest(true);
        setRemainingRequests(rateLimiterRef.current.getRemainingRequests());
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [canRequest, timeUntilReset]);

  const recordRequest = useCallback(() => {
    if (!rateLimiterRef.current) return;

    rateLimiterRef.current.recordRequest();
    updateState();
  }, [updateState]);

  return {
    canRequest,
    remainingRequests,
    timeUntilReset,
    recordRequest,
  };
}
