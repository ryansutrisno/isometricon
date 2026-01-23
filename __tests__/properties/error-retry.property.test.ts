/**
 * Feature: ai-isometric-icon-generator
 * Property 8: Error Retry Availability
 * Validates: Requirements 7.5
 *
 * For any GenerationError returned from the API, the Generator SHALL display
 * a retry button that, when clicked, re-attempts the generation with the same parameters.
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {isRetryAvailable, isRetryEnabled} from '@/components/ErrorDisplay';
import type {ErrorCode, GenerationError} from '@/types';

// All valid error codes
const ERROR_CODES: ErrorCode[] = [
  'RATE_LIMIT',
  'SERVICE_UNAVAILABLE',
  'UNAUTHORIZED',
  'SERVER_ERROR',
  'VALIDATION_ERROR',
  'TIMEOUT',
];

// Arbitrary for generating valid error codes
const errorCodeArb = fc.constantFrom(...ERROR_CODES);

// Arbitrary for generating GenerationError objects
const generationErrorArb = fc.record({
  code: errorCodeArb,
  message: fc.string({minLength: 1, maxLength: 200}),
  retryAfter: fc.option(fc.integer({min: 1, max: 60}), {nil: undefined}),
});

describe('Property 8: Error Retry Availability', () => {
  it('should always have retry available for any error type', () => {
    fc.assert(
      fc.property(generationErrorArb, (error: GenerationError) => {
        // Property: All error types should have retry available
        const retryAvailable = isRetryAvailable(error);
        expect(retryAvailable).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should enable retry button when countdown is zero', () => {
    fc.assert(
      fc.property(errorCodeArb, (code: ErrorCode) => {
        // Property: When countdown is 0, retry should be enabled
        const enabled = isRetryEnabled(code, 0);
        expect(enabled).toBe(true);
      }),
      {numRuns: 100},
    );
  });

  it('should disable retry button only for RATE_LIMIT with active countdown', () => {
    fc.assert(
      fc.property(
        errorCodeArb,
        fc.integer({min: 1, max: 60}),
        (code: ErrorCode, countdown: number) => {
          const enabled = isRetryEnabled(code, countdown);

          if (code === 'RATE_LIMIT') {
            // RATE_LIMIT with countdown > 0 should be disabled
            expect(enabled).toBe(false);
          } else {
            // All other error types should be enabled regardless of countdown
            expect(enabled).toBe(true);
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should have consistent retry availability across all error codes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ERROR_CODES),
        fc.string({minLength: 1, maxLength: 100}),
        (code: ErrorCode, message: string) => {
          const error: GenerationError = {code, message};

          // Property: Every error type should have retry available
          expect(isRetryAvailable(error)).toBe(true);

          // Property: Without countdown, retry should be enabled
          expect(isRetryEnabled(code, 0)).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });
});
