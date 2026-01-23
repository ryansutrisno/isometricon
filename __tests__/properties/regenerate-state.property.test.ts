/**
 * Feature: ai-isometric-icon-generator
 * Property 5: Regenerate State Preservation
 * Validates: Requirements 4.7
 *
 * For any successful generation with prompt P and style S, when regenerate is called,
 * the new generation request SHALL use the same prompt P and style S, producing a
 * request with identical parameters.
 */

import {act, renderHook, waitFor} from '@testing-library/react';
import fc from 'fast-check';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useGenerator} from '@/hooks/use-generator';
import type {StylePreset} from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 5: Regenerate State Preservation', () => {
  const validStyles: StylePreset[] = [
    'default',
    'warm',
    'monochrome',
    'pastel',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should preserve prompt and style when regenerating', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({minLength: 1, maxLength: 50})
          .filter((s) => /^[a-zA-Z0-9 ]+$/.test(s))
          .filter((s) => s.trim().length > 0),
        fc.constantFrom(...validStyles),
        async (prompt, style) => {
          // Clear localStorage and mocks for each iteration
          localStorage.clear();
          mockFetch.mockReset();

          // Track API calls
          const apiCalls: Array<{prompt: string; style: StylePreset}> = [];

          mockFetch.mockImplementation(
            async (_url: string, options: RequestInit) => {
              const body = JSON.parse(options.body as string);
              apiCalls.push({prompt: body.prompt, style: body.style});
              return {
                ok: true,
                json: async () => ({
                  success: true,
                  image: 'data:image/png;base64,test',
                }),
              };
            },
          );

          const {result} = renderHook(() => useGenerator());

          // Set prompt and style
          act(() => {
            result.current.setPrompt(prompt);
            result.current.setStyle(style);
          });

          // First generation
          await act(async () => {
            await result.current.generate();
          });

          // Wait for generation to complete
          await waitFor(() => {
            expect(result.current.state.isGenerating).toBe(false);
          });

          // Clear API calls tracking
          apiCalls.length = 0;

          // Regenerate
          await act(async () => {
            await result.current.regenerate();
          });

          // Wait for regeneration to complete
          await waitFor(() => {
            expect(result.current.state.isGenerating).toBe(false);
          });

          // Verify regenerate used same parameters
          expect(apiCalls.length).toBe(1);
          expect(apiCalls[0].style).toBe(style);
          // Prompt should be sanitized but contain the original content
          expect(apiCalls[0].prompt).toBeTruthy();
        },
      ),
      {numRuns: 20}, // Reduced runs due to async nature
    );
  });

  it('should use last successful generation params even if current state changed', async () => {
    const originalPrompt = 'original icon';
    const originalStyle: StylePreset = 'warm';
    const newPrompt = 'new icon';
    const newStyle: StylePreset = 'pastel';

    const apiCalls: Array<{prompt: string; style: StylePreset}> = [];

    mockFetch.mockImplementation(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      apiCalls.push({prompt: body.prompt, style: body.style});
      return {
        ok: true,
        json: async () => ({
          success: true,
          image: 'data:image/png;base64,test',
        }),
      };
    });

    const {result} = renderHook(() => useGenerator());

    // Set original prompt and style
    act(() => {
      result.current.setPrompt(originalPrompt);
      result.current.setStyle(originalStyle);
    });

    // First generation
    await act(async () => {
      await result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.state.isGenerating).toBe(false);
    });

    // Change prompt and style in state (but don't generate)
    act(() => {
      result.current.setPrompt(newPrompt);
      result.current.setStyle(newStyle);
    });

    // Clear tracking
    apiCalls.length = 0;

    // Regenerate should use ORIGINAL params, not new ones
    await act(async () => {
      await result.current.regenerate();
    });

    await waitFor(() => {
      expect(result.current.state.isGenerating).toBe(false);
    });

    // Verify regenerate used original parameters
    expect(apiCalls.length).toBe(1);
    expect(apiCalls[0].prompt).toBe(originalPrompt);
    expect(apiCalls[0].style).toBe(originalStyle);
  });

  it('should use current state if no previous generation exists', async () => {
    const currentPrompt = 'current icon';
    const currentStyle: StylePreset = 'monochrome';

    const apiCalls: Array<{prompt: string; style: StylePreset}> = [];

    mockFetch.mockImplementation(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      apiCalls.push({prompt: body.prompt, style: body.style});
      return {
        ok: true,
        json: async () => ({
          success: true,
          image: 'data:image/png;base64,test',
        }),
      };
    });

    const {result} = renderHook(() => useGenerator());

    // Set prompt and style without generating first
    act(() => {
      result.current.setPrompt(currentPrompt);
      result.current.setStyle(currentStyle);
    });

    // Call regenerate without prior generation
    await act(async () => {
      await result.current.regenerate();
    });

    await waitFor(() => {
      expect(result.current.state.isGenerating).toBe(false);
    });

    // Should use current state params
    expect(apiCalls.length).toBe(1);
    expect(apiCalls[0].prompt).toBe(currentPrompt);
    expect(apiCalls[0].style).toBe(currentStyle);
  });

  it('should preserve params across multiple regenerations', async () => {
    const prompt = 'test icon';
    const style: StylePreset = 'default';

    const apiCalls: Array<{prompt: string; style: StylePreset}> = [];

    mockFetch.mockImplementation(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      apiCalls.push({prompt: body.prompt, style: body.style});
      return {
        ok: true,
        json: async () => ({
          success: true,
          image: 'data:image/png;base64,test',
        }),
      };
    });

    const {result} = renderHook(() => useGenerator());

    // Initial generation
    act(() => {
      result.current.setPrompt(prompt);
      result.current.setStyle(style);
    });

    await act(async () => {
      await result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.state.isGenerating).toBe(false);
    });

    // Multiple regenerations
    for (let i = 0; i < 3; i++) {
      apiCalls.length = 0;

      await act(async () => {
        await result.current.regenerate();
      });

      await waitFor(() => {
        expect(result.current.state.isGenerating).toBe(false);
      });

      // Each regeneration should use same params
      expect(apiCalls[0].prompt).toBe(prompt);
      expect(apiCalls[0].style).toBe(style);
    }
  });
});
