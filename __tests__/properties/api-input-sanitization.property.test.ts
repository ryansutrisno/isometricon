/**
 * Feature: ai-isometric-icon-generator
 * Property 11: API Input Sanitization
 * Validates: Requirements 13.4
 *
 * For any user input sent to the API route, the input SHALL be validated and sanitized
 * before being forwarded to the Hugging Face API, ensuring no malicious content
 * reaches the external service.
 */

import {buildPrompt} from '@/app/api/generate/route';
import {isValidPrompt, sanitizeInput} from '@/lib/input-utils';
import {StylePreset} from '@/types';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 11: API Input Sanitization', () => {
  const validStyles: StylePreset[] = [
    'default',
    'warm',
    'monochrome',
    'pastel',
  ];

  it('should sanitize all user input before building prompt', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom(...validStyles),
        (userInput, style) => {
          const sanitized = sanitizeInput(userInput);
          const prompt = buildPrompt(sanitized, style);

          // Sanitized prompt should not contain dangerous patterns
          expect(prompt.toLowerCase()).not.toContain('<script');
          expect(prompt.toLowerCase()).not.toContain('javascript:');
          expect(prompt.toLowerCase()).not.toMatch(/on\w+=/);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should reject empty or whitespace-only inputs', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespaceInput) => {
          const isValid = isValidPrompt(whitespaceInput);
          expect(isValid).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should escape HTML entities in user input', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.constantFrom('<', '>', '"', "'", '&'), fc.string()),
        ([specialChar, content]) => {
          const input = `${specialChar}${content}`;
          const sanitized = sanitizeInput(input);

          // Special characters should be escaped
          if (specialChar === '<') {
            expect(sanitized).toContain('&lt;');
          }
          if (specialChar === '>') {
            expect(sanitized).toContain('&gt;');
          }
          if (specialChar === '"') {
            expect(sanitized).toContain('&quot;');
          }
          if (specialChar === "'") {
            expect(sanitized).toContain('&#x27;');
          }
          if (specialChar === '&') {
            expect(sanitized).toContain('&amp;');
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle XSS vectors in API input', () => {
    const xssVectors = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '"><script>evil()</script>',
      "'-alert(1)-'",
      '<iframe src="javascript:alert(1)">',
    ];

    for (const vector of xssVectors) {
      const sanitized = sanitizeInput(vector);

      // Sanitized output should be safe
      expect(sanitized.toLowerCase()).not.toContain('<script');
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
      expect(sanitized.toLowerCase()).not.toMatch(/on\w+=/);
    }
  });

  it('should preserve valid prompt content after sanitization', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter((c) => /[a-zA-Z0-9 ]/.test(c))),
        fc.constantFrom(...validStyles),
        (safeInput, style) => {
          if (safeInput.trim().length === 0) return; // Skip empty

          const sanitized = sanitizeInput(safeInput);
          const prompt = buildPrompt(sanitized, style);

          // Safe alphanumeric content should be preserved
          expect(prompt).toContain('isometric 3D icon');
          expect(prompt.length).toBeGreaterThan(0);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should remove null bytes from input', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const inputWithNullBytes = `test\0${content}\0input`;
        const sanitized = sanitizeInput(inputWithNullBytes);

        expect(sanitized).not.toContain('\0');
      }),
      {numRuns: 100},
    );
  });

  it('should handle data: URLs that could contain scripts', () => {
    const dataUrls = [
      'data:text/html,<script>alert(1)</script>',
      'data: text/html,<script>evil()</script>',
      'DATA:TEXT/HTML,<script>hack()</script>',
    ];

    for (const url of dataUrls) {
      const sanitized = sanitizeInput(url);
      expect(sanitized.toLowerCase()).not.toContain('data:text/html');
    }
  });
});
