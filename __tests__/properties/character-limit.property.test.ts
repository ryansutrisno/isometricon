/**
 * Feature: ai-isometric-icon-generator
 * Property 1: Character Limit Enforcement
 * Validates: Requirements 2.2, 2.3
 *
 * For any input string of length N, the enforceCharacterLimit function SHALL
 * either truncate the string to 200 characters or return it unchanged if <= 200,
 * AND calculateRemaining SHALL display (200 - min(N, 200)) as remaining characters.
 */

import {
  MAX_PROMPT_LENGTH,
  calculateRemaining,
  enforceCharacterLimit,
} from '@/lib/input-utils';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 1: Character Limit Enforcement', () => {
  it('should enforce 200 character limit for all inputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = enforceCharacterLimit(input, MAX_PROMPT_LENGTH);

        // Result should never exceed the limit
        expect(result.length).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);

        // If input was within limit, result should be unchanged
        if (input.length <= MAX_PROMPT_LENGTH) {
          expect(result).toBe(input);
        }

        // If input exceeded limit, result should be truncated to exactly limit
        if (input.length > MAX_PROMPT_LENGTH) {
          expect(result.length).toBe(MAX_PROMPT_LENGTH);
          expect(result).toBe(input.slice(0, MAX_PROMPT_LENGTH));
        }
      }),
      {numRuns: 100},
    );
  });

  it('should calculate remaining characters correctly for all inputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const limited = enforceCharacterLimit(input, MAX_PROMPT_LENGTH);
        const remaining = calculateRemaining(limited, MAX_PROMPT_LENGTH);

        // Remaining should be (limit - actual length)
        expect(remaining).toBe(MAX_PROMPT_LENGTH - limited.length);

        // Remaining should never be negative
        expect(remaining).toBeGreaterThanOrEqual(0);

        // Remaining should never exceed the limit
        expect(remaining).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
      }),
      {numRuns: 100},
    );
  });

  it('should preserve content prefix when truncating', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: MAX_PROMPT_LENGTH + 1}),
        (longInput) => {
          const result = enforceCharacterLimit(longInput, MAX_PROMPT_LENGTH);

          // The result should be the first 200 characters of input
          expect(longInput.startsWith(result)).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });
});
