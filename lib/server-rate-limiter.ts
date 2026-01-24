/**
 * Server-side Rate Limiter
 * Limits requests per IP to protect API key from abuse
 * For hackathon/demo purposes
 */

import {formatTime} from '@/lib/time-utils';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_REQUESTS_PER_IP = 5; // 5 requests per IP
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_TOTAL_REQUESTS = 100; // Total requests across all users per day

let totalRequestsToday = 0;
let totalResetTime = Date.now() + WINDOW_MS;

/**
 * Check if IP can make a request
 */
export function canMakeRequest(ip: string): {
  allowed: boolean;
  reason?: string;
  remainingRequests?: number;
  resetInSeconds?: number;
} {
  const now = Date.now();

  // Reset total counter if window expired
  if (now >= totalResetTime) {
    totalRequestsToday = 0;
    totalResetTime = now + WINDOW_MS;
  }

  // Check total limit first
  if (totalRequestsToday >= MAX_TOTAL_REQUESTS) {
    const resetIn = Math.ceil((totalResetTime - now) / 1000);
    return {
      allowed: false,
      reason: `Daily limit reached. Please try again in ${formatTime(resetIn)}.`,
      resetInSeconds: resetIn,
    };
  }

  // Get or create entry for this IP
  let entry = rateLimitStore.get(ip);

  // Reset if window expired
  if (entry && now >= entry.resetTime) {
    entry = undefined;
    rateLimitStore.delete(ip);
  }

  if (!entry) {
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS_PER_IP,
    };
  }

  if (entry.count >= MAX_REQUESTS_PER_IP) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      reason: `You have reached your daily limit of ${MAX_REQUESTS_PER_IP} generations. Please try again in ${formatTime(resetIn)}.`,
      remainingRequests: 0,
      resetInSeconds: resetIn,
    };
  }

  return {
    allowed: true,
    remainingRequests: MAX_REQUESTS_PER_IP - entry.count,
  };
}

/**
 * Record a request for an IP
 */
export function recordRequest(ip: string): void {
  const now = Date.now();

  // Increment total counter
  totalRequestsToday++;

  // Get or create entry
  let entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
  } else {
    entry.count++;
  }

  rateLimitStore.set(ip, entry);
}

/**
 * Get rate limit info for display
 */
export function getRateLimitInfo(): {
  maxPerIp: number;
  maxTotal: number;
  totalUsed: number;
  windowHours: number;
} {
  return {
    maxPerIp: MAX_REQUESTS_PER_IP,
    maxTotal: MAX_TOTAL_REQUESTS,
    totalUsed: totalRequestsToday,
    windowHours: WINDOW_MS / (60 * 60 * 1000),
  };
}
