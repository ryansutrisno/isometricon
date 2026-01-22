/**
 * Feature: ai-isometric-icon-generator
 * Property 7: Filename Generation from Prompt
 * Validates: Requirements 6.3
 *
 * For any prompt string, the generated filename SHALL be derived from the prompt by:
 * converting to lowercase, replacing spaces with hyphens, removing special characters,
 * and appending ".png", such that the filename is valid for all operating systems.
 */

import {generateFilename, isValidFilename} from '@/lib/filename-generator';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 7: Filename Generation from Prompt', () => {
  it('should always produce valid filenames for any input', () => {
    fc.assert(
      fc.property(fc.string(), (prompt) => {
        const filename = generateFilename(prompt);

        // Should always end with .png
        expect(filename.endsWith('.png')).toBe(true);

        // Should be a valid filename
        expect(isValidFilename(filename)).toBe(true);

        // Should have at least the extension (minimum "x.png" = 5 chars, or "icon.png" = 8 for empty)
        expect(filename.length).toBeGreaterThanOrEqual(5);
      }),
      {numRuns: 100},
    );
  });

  it('should convert to lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (prompt) => {
        const filename = generateFilename(prompt);
        const nameWithoutExt = filename.replace('.png', '');

        // Should be all lowercase
        expect(nameWithoutExt).toBe(nameWithoutExt.toLowerCase());
      }),
      {numRuns: 100},
    );
  });

  it('should replace spaces with hyphens', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
            {minLength: 1},
          ),
          {
            minLength: 2,
            maxLength: 5,
          },
        ),
        (words) => {
          const prompt = words.join(' ');
          const filename = generateFilename(prompt);

          // Should not contain spaces
          expect(filename).not.toContain(' ');

          // If original had spaces between words, result should have hyphens
          if (words.length > 1) {
            expect(filename).toContain('-');
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should remove special characters', () => {
    fc.assert(
      fc.property(fc.string(), (prompt) => {
        const filename = generateFilename(prompt);
        const nameWithoutExt = filename.replace('.png', '');

        // Should only contain alphanumeric and hyphens
        expect(nameWithoutExt).toMatch(/^[a-z0-9-]*$/);
      }),
      {numRuns: 100},
    );
  });

  it('should not contain reserved filesystem characters', () => {
    const reservedChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];

    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.constantFrom(...reservedChars), fc.string()),
        ([before, reserved, after]) => {
          const prompt = before + reserved + after;
          const filename = generateFilename(prompt);

          // Should not contain any reserved characters
          for (const char of reservedChars) {
            expect(filename).not.toContain(char);
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle empty and whitespace-only prompts', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '')),
        (whitespace) => {
          const filename = generateFilename(whitespace);

          // Should fallback to 'icon.png'
          expect(filename).toBe('icon.png');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should limit filename length', () => {
    fc.assert(
      fc.property(fc.string({minLength: 100}), (longPrompt) => {
        const filename = generateFilename(longPrompt);

        // Should not exceed reasonable length (50 chars + .png = 54)
        expect(filename.length).toBeLessThanOrEqual(54);
      }),
      {numRuns: 100},
    );
  });

  it('should not have leading or trailing hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (prompt) => {
        const filename = generateFilename(prompt);
        const nameWithoutExt = filename.replace('.png', '');

        // Should not start or end with hyphen
        expect(nameWithoutExt).not.toMatch(/^-/);
        expect(nameWithoutExt).not.toMatch(/-$/);
      }),
      {numRuns: 100},
    );
  });

  it('should not have consecutive hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (prompt) => {
        const filename = generateFilename(prompt);

        // Should not have multiple consecutive hyphens
        expect(filename).not.toMatch(/--+/);
      }),
      {numRuns: 100},
    );
  });
});
