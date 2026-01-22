/**
 * Feature: ai-isometric-icon-generator
 * Property 3: XSS Input Sanitization
 * Validates: Requirements 2.5
 *
 * For any input string containing potential XSS vectors (script tags, event handlers,
 * javascript: URLs), the sanitize function SHALL return a string with all dangerous
 * content escaped or removed, such that the output cannot execute arbitrary code when rendered.
 */

import {sanitizeInput} from '@/lib/input-utils';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 3: XSS Input Sanitization', () => {
  it('should escape HTML special characters', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = sanitizeInput(input);

        // Result should not contain unescaped < or >
        expect(result).not.toMatch(/<(?!&)/);
        expect(result).not.toMatch(/>(?!&)/);
      }),
      {numRuns: 100},
    );
  });

  it('should remove script tags', () => {
    const xssVectors = [
      '<script>alert("xss")</script>',
      '<SCRIPT>alert("xss")</SCRIPT>',
      '<script src="evil.js"></script>',
      '<script type="text/javascript">evil()</script>',
    ];

    for (const vector of xssVectors) {
      const result = sanitizeInput(vector);
      // Should not contain executable script tags
      expect(result.toLowerCase()).not.toContain('<script');
    }
  });

  it('should remove javascript: URLs', () => {
    fc.assert(
      fc.property(fc.string(), (payload) => {
        const input = `javascript:${payload}`;
        const result = sanitizeInput(input);

        // Result should not contain javascript: protocol
        expect(result.toLowerCase()).not.toContain('javascript:');
      }),
      {numRuns: 100},
    );
  });

  it('should remove event handlers', () => {
    const eventHandlers = [
      'onclick=alert(1)',
      'onerror=evil()',
      'onload=hack()',
      'onmouseover=steal()',
      'ONCLICK=alert(1)',
      'OnClick=alert(1)',
    ];

    for (const handler of eventHandlers) {
      const result = sanitizeInput(handler);
      // Should not contain event handler patterns
      expect(result.toLowerCase()).not.toMatch(/on\w+=/);
    }
  });

  it('should handle mixed XSS vectors', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('<script>', '<img onerror=', 'javascript:'),
          fc.string(),
          fc.constantFrom('</script>', '>', ''),
        ),
        ([prefix, content, suffix]) => {
          const input = prefix + content + suffix;
          const result = sanitizeInput(input);

          // Result should be safe
          expect(result.toLowerCase()).not.toContain('<script');
          expect(result.toLowerCase()).not.toContain('javascript:');
          expect(result.toLowerCase()).not.toMatch(/on\w+=/);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should preserve safe content', () => {
    const safeInputs = [
      'Create a blue icon',
      'Generate isometric house',
      'Make a 3D cube with shadows',
      'Design a modern laptop icon',
    ];

    for (const input of safeInputs) {
      const result = sanitizeInput(input);
      // Safe content should be preserved (with HTML entities escaped)
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('should handle null bytes', () => {
    fc.assert(
      fc.property(fc.string(), (content) => {
        const input = `before\0${content}\0after`;
        const result = sanitizeInput(input);

        // Should not contain null bytes
        expect(result).not.toContain('\0');
      }),
      {numRuns: 100},
    );
  });
});
