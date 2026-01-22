/**
 * Feature: ai-isometric-icon-generator
 * Property 2: Empty Input Rejection
 * Validates: Requirements 2.4
 *
 * For any string composed entirely of whitespace characters (including empty string),
 * the Generator SHALL reject the input and prevent form submission,
 * returning a validation error.
 */

import {isValidPrompt} from '@/lib/input-utils';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 2: Empty Input Rejection', () => {
  it('should reject empty strings', () => {
    expect(isValidPrompt('')).toBe(false);
  });

  it('should reject whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v')),
        (whitespaceOnly) => {
          // Any string composed entirely of whitespace should be rejected
          expect(isValidPrompt(whitespaceOnly)).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should accept strings with at least one non-whitespace character', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1}).filter((s) => s.trim().length > 0),
        (validInput) => {
          // Any string with at least one non-whitespace character should be valid
          expect(isValidPrompt(validInput)).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle mixed whitespace and content correctly', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
          fc.string({minLength: 1}).filter((s) => s.trim().length > 0),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
        ),
        ([leadingWs, content, trailingWs]) => {
          const input = leadingWs + content + trailingWs;
          // Should be valid because there's actual content
          expect(isValidPrompt(input)).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });
});
