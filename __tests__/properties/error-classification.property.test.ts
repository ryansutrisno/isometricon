/**
 * Feature: api-fallback-provider
 * Property 4: Fallback Triggered on Recoverable Errors
 * Property 5: No Fallback on Non-Recoverable Errors
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * For any Primary Provider error with HTTP status 429, 500, 503, or timeout,
 * the Provider Manager should trigger fallback to the Fallback Provider.
 *
 * For any Primary Provider error with HTTP status 401 or 400,
 * the Provider Manager should NOT trigger fallback and should return the error immediately.
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {
  createProviderError,
  createTimeoutError,
  FALLBACK_HTTP_STATUSES,
  httpStatusToErrorCode,
  NON_FALLBACK_HTTP_STATUSES,
  ProviderErrorCode,
  shouldFallbackForErrorCode,
  shouldTriggerFallback,
} from '@/lib/providers/types';

// Recoverable error codes that should trigger fallback
const RECOVERABLE_ERROR_CODES: ProviderErrorCode[] = [
  'RATE_LIMIT',
  'TIMEOUT',
  'SERVICE_UNAVAILABLE',
  'SERVER_ERROR',
];

// Non-recoverable error codes that should NOT trigger fallback
const NON_RECOVERABLE_ERROR_CODES: ProviderErrorCode[] = [
  'UNAUTHORIZED',
  'VALIDATION_ERROR',
];

// HTTP statuses that should trigger fallback (429, 500, 503)
const fallbackHttpStatusArb = fc.constantFrom(...FALLBACK_HTTP_STATUSES);

// HTTP statuses that should NOT trigger fallback (400, 401)
const nonFallbackHttpStatusArb = fc.constantFrom(...NON_FALLBACK_HTTP_STATUSES);

// Any 5xx status code (server errors)
const serverErrorStatusArb = fc.integer({min: 500, max: 599});

// Recoverable error codes arbitrary
const recoverableErrorCodeArb = fc.constantFrom(...RECOVERABLE_ERROR_CODES);

// Non-recoverable error codes arbitrary
const nonRecoverableErrorCodeArb = fc.constantFrom(
  ...NON_RECOVERABLE_ERROR_CODES,
);

describe('Property 4: Fallback Triggered on Recoverable Errors', () => {
  it('should trigger fallback for HTTP 429 (rate limit)', () => {
    fc.assert(
      fc.property(fc.constant(429), (status: number) => {
        // Property: HTTP 429 should always trigger fallback
        expect(shouldTriggerFallback(status)).toBe(true);
        expect(httpStatusToErrorCode(status)).toBe('RATE_LIMIT');
      }),
      {numRuns: 100},
    );
  });

  it('should trigger fallback for HTTP 500 (server error)', () => {
    fc.assert(
      fc.property(fc.constant(500), (status: number) => {
        // Property: HTTP 500 should always trigger fallback
        expect(shouldTriggerFallback(status)).toBe(true);
        expect(httpStatusToErrorCode(status)).toBe('SERVER_ERROR');
      }),
      {numRuns: 100},
    );
  });

  it('should trigger fallback for HTTP 503 (service unavailable)', () => {
    fc.assert(
      fc.property(fc.constant(503), (status: number) => {
        // Property: HTTP 503 should always trigger fallback
        expect(shouldTriggerFallback(status)).toBe(true);
        expect(httpStatusToErrorCode(status)).toBe('SERVICE_UNAVAILABLE');
      }),
      {numRuns: 100},
    );
  });

  it('should trigger fallback for any 5xx server error status', () => {
    fc.assert(
      fc.property(serverErrorStatusArb, (status: number) => {
        // Property: Any 5xx status should trigger fallback
        expect(shouldTriggerFallback(status)).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should trigger fallback for timeout errors', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Property: Timeout errors should always trigger fallback
        const timeoutError = createTimeoutError();
        expect(timeoutError.shouldFallback).toBe(true);
        expect(timeoutError.code).toBe('TIMEOUT');
      }),
      {numRuns: 100},
    );
  });

  it('should trigger fallback for all recoverable error codes', () => {
    fc.assert(
      fc.property(recoverableErrorCodeArb, (code: ProviderErrorCode) => {
        // Property: All recoverable error codes should trigger fallback
        expect(shouldFallbackForErrorCode(code)).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should set shouldFallback=true when creating error from fallback HTTP statuses', () => {
    fc.assert(
      fc.property(
        fallbackHttpStatusArb,
        fc.option(fc.string({minLength: 1, maxLength: 100}), {nil: undefined}),
        fc.option(fc.integer({min: 1, max: 300}), {nil: undefined}),
        (
          status: number,
          message: string | undefined,
          retryAfter: number | undefined,
        ) => {
          // Property: ProviderError created from fallback statuses should have shouldFallback=true
          const error = createProviderError(status, message, retryAfter);
          expect(error.shouldFallback).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 5: No Fallback on Non-Recoverable Errors', () => {
  it('should NOT trigger fallback for HTTP 401 (unauthorized)', () => {
    fc.assert(
      fc.property(fc.constant(401), (status: number) => {
        // Property: HTTP 401 should never trigger fallback
        expect(shouldTriggerFallback(status)).toBe(false);
        expect(httpStatusToErrorCode(status)).toBe('UNAUTHORIZED');
      }),
      {numRuns: 100},
    );
  });

  it('should NOT trigger fallback for HTTP 400 (validation error)', () => {
    fc.assert(
      fc.property(fc.constant(400), (status: number) => {
        // Property: HTTP 400 should never trigger fallback
        expect(shouldTriggerFallback(status)).toBe(false);
        expect(httpStatusToErrorCode(status)).toBe('VALIDATION_ERROR');
      }),
      {numRuns: 100},
    );
  });

  it('should NOT trigger fallback for non-recoverable error codes', () => {
    fc.assert(
      fc.property(nonRecoverableErrorCodeArb, (code: ProviderErrorCode) => {
        // Property: Non-recoverable error codes should NOT trigger fallback
        expect(shouldFallbackForErrorCode(code)).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('should set shouldFallback=false when creating error from non-fallback HTTP statuses', () => {
    fc.assert(
      fc.property(
        nonFallbackHttpStatusArb,
        fc.option(fc.string({minLength: 1, maxLength: 100}), {nil: undefined}),
        (status: number, message: string | undefined) => {
          // Property: ProviderError created from non-fallback statuses should have shouldFallback=false
          const error = createProviderError(status, message);
          expect(error.shouldFallback).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should NOT trigger fallback for UNKNOWN error code', () => {
    fc.assert(
      fc.property(
        fc.constant('UNKNOWN' as ProviderErrorCode),
        (code: ProviderErrorCode) => {
          // Property: UNKNOWN errors should NOT trigger fallback (fail safely)
          expect(shouldFallbackForErrorCode(code)).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Error Classification Consistency', () => {
  it('should have consistent classification between HTTP status and error code', () => {
    fc.assert(
      fc.property(fallbackHttpStatusArb, (status: number) => {
        // Property: HTTP status classification should match error code classification
        const code = httpStatusToErrorCode(status);
        const statusShouldFallback = shouldTriggerFallback(status);
        const codeShouldFallback = shouldFallbackForErrorCode(code);

        expect(statusShouldFallback).toBe(codeShouldFallback);
      }),
      {numRuns: 100},
    );
  });

  it('should have consistent classification for non-fallback statuses', () => {
    fc.assert(
      fc.property(nonFallbackHttpStatusArb, (status: number) => {
        // Property: Non-fallback HTTP status classification should match error code classification
        const code = httpStatusToErrorCode(status);
        const statusShouldFallback = shouldTriggerFallback(status);
        const codeShouldFallback = shouldFallbackForErrorCode(code);

        expect(statusShouldFallback).toBe(codeShouldFallback);
        expect(statusShouldFallback).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('should create ProviderError with correct structure for any HTTP status', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 400, max: 599}),
        fc.option(fc.string({minLength: 1, maxLength: 100}), {nil: undefined}),
        fc.option(fc.integer({min: 1, max: 300}), {nil: undefined}),
        (
          status: number,
          message: string | undefined,
          retryAfter: number | undefined,
        ) => {
          const error = createProviderError(status, message, retryAfter);

          // Property: ProviderError should always have required fields
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('shouldFallback');
          expect(typeof error.code).toBe('string');
          expect(typeof error.message).toBe('string');
          expect(typeof error.shouldFallback).toBe('boolean');

          // Property: shouldFallback should match status classification
          expect(error.shouldFallback).toBe(shouldTriggerFallback(status));
        },
      ),
      {numRuns: 100},
    );
  });
});
