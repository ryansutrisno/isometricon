/**
 * Feature: ai-isometric-icon-generator
 * Property 4: Style Preset to Prompt Mapping
 * Validates: Requirements 3.4
 *
 * For any StylePreset value, when applied to a generation request, the resulting
 * prompt sent to the API SHALL contain the corresponding style suffix from
 * STYLE_CONFIGS, ensuring consistent style application.
 */

import {buildPrompt} from '@/app/api/generate/route';
import {STYLE_CONFIGS, StylePreset} from '@/types';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 4: Style Preset to Prompt Mapping', () => {
  const validStyles: StylePreset[] = [
    'default',
    'warm',
    'monochrome',
    'pastel',
  ];

  it('should include style suffix for all style presets', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 100}),
        fc.constantFrom(...validStyles),
        (userPrompt, style) => {
          const result = buildPrompt(userPrompt, style);
          const expectedSuffix = STYLE_CONFIGS[style].promptSuffix;

          // Result should contain the style suffix
          expect(result).toContain(expectedSuffix);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include isometric 3D icon prefix', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 100}),
        fc.constantFrom(...validStyles),
        (userPrompt, style) => {
          const result = buildPrompt(userPrompt, style);

          // Result should start with isometric prefix
          expect(result).toContain('isometric 3D icon');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include user prompt in the result', () => {
    fc.assert(
      fc.property(
        fc.stringOf(
          fc.char().filter((c) => /[a-zA-Z0-9 ]/.test(c)),
          {minLength: 1, maxLength: 50},
        ),
        fc.constantFrom(...validStyles),
        (userPrompt, style) => {
          const result = buildPrompt(userPrompt, style);

          // Result should contain the user prompt
          expect(result).toContain(userPrompt);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should map each style to correct suffix', () => {
    const testCases: Array<{style: StylePreset; expectedSuffix: string}> = [
      {style: 'default', expectedSuffix: 'blue tones'},
      {style: 'warm', expectedSuffix: 'warm orange and red tones'},
      {style: 'monochrome', expectedSuffix: 'grayscale monochrome'},
      {style: 'pastel', expectedSuffix: 'soft pastel colors'},
    ];

    for (const {style, expectedSuffix} of testCases) {
      const result = buildPrompt('test icon', style);
      expect(result).toContain(expectedSuffix);
    }
  });

  it('should produce consistent output for same input', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 100}),
        fc.constantFrom(...validStyles),
        (userPrompt, style) => {
          const result1 = buildPrompt(userPrompt, style);
          const result2 = buildPrompt(userPrompt, style);

          // Same input should produce same output
          expect(result1).toBe(result2);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include quality modifiers', () => {
    fc.assert(
      fc.property(
        fc.string({minLength: 1, maxLength: 100}),
        fc.constantFrom(...validStyles),
        (userPrompt, style) => {
          const result = buildPrompt(userPrompt, style);

          // Result should include quality modifiers
          expect(result).toContain('clean background');
          expect(result).toContain('minimalist design');
          expect(result).toContain('high quality');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle different styles producing different prompts', () => {
    const userPrompt = 'laptop computer';
    const results = validStyles.map((style) => buildPrompt(userPrompt, style));

    // Each style should produce a unique prompt
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(validStyles.length);
  });
});
