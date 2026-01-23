/**
 * Prompt Builder
 * Builds full prompts by combining user input with style configuration
 * Requirements: 3.4
 */

import {STYLE_CONFIGS, StylePreset} from '@/types';

/**
 * Builds the full prompt by combining user prompt with style suffix
 * Requirements: 3.4
 */
export function buildPrompt(userPrompt: string, style: StylePreset): string {
  const styleConfig = STYLE_CONFIGS[style];
  const basePrompt = `isometric 3D icon of ${userPrompt}`;
  return `${basePrompt}, ${styleConfig.promptSuffix}, clean background, minimalist design, high quality`;
}
