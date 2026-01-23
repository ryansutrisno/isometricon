'use client';

/**
 * useGenerator Hook
 * State management for icon generation with rate limiter and history integration
 * Requirements: 4.1, 4.7
 */

import {useCallback, useRef, useState} from 'react';

import {generateFilename} from '@/lib/filename-generator';
import {isValidPrompt, sanitizeInput} from '@/lib/input-utils';
import {createRateLimiter} from '@/lib/rate-limiter';
import type {GenerationError, GeneratorState, StylePreset} from '@/types';

export interface UseGeneratorOptions {
  onSuccess?: (imageData: string) => void;
  onError?: (error: GenerationError) => void;
}

export interface UseGeneratorReturn {
  state: GeneratorState;
  setPrompt: (prompt: string) => void;
  setStyle: (style: StylePreset) => void;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
  download: () => void;
  reset: () => void;
}

const initialState: GeneratorState = {
  prompt: '',
  style: 'default',
  isGenerating: false,
  generatedImage: null,
  error: null,
  progress: 0,
};

export function useGenerator(
  options?: UseGeneratorOptions,
): UseGeneratorReturn {
  const [state, setState] = useState<GeneratorState>(initialState);
  const rateLimiter = useRef(createRateLimiter());

  // Store last successful generation params for regenerate
  const lastGenerationRef = useRef<{prompt: string; style: StylePreset} | null>(
    null,
  );

  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({...prev, prompt, error: null}));
  }, []);

  const setStyle = useCallback((style: StylePreset) => {
    setState((prev) => ({...prev, style}));
  }, []);

  const generateImage = useCallback(
    async (prompt: string, style: StylePreset) => {
      // Validate input
      const sanitized = sanitizeInput(prompt);
      if (!isValidPrompt(sanitized)) {
        const error: GenerationError = {
          code: 'VALIDATION_ERROR',
          message: 'Please enter a valid prompt',
        };
        setState((prev) => ({...prev, error, isGenerating: false}));
        options?.onError?.(error);
        return;
      }

      // Check rate limit
      if (!rateLimiter.current.canMakeRequest()) {
        const retryAfter = rateLimiter.current.getTimeUntilReset();
        const error: GenerationError = {
          code: 'RATE_LIMIT',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        };
        setState((prev) => ({...prev, error, isGenerating: false}));
        options?.onError?.(error);
        return;
      }

      // Start generation
      setState((prev) => ({
        ...prev,
        isGenerating: true,
        error: null,
        progress: 10,
      }));

      try {
        // Record the request
        rateLimiter.current.recordRequest();

        // Update progress
        setState((prev) => ({...prev, progress: 30}));

        // Make API request
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({prompt: sanitized, style}),
        });

        setState((prev) => ({...prev, progress: 70}));

        const data = await response.json();

        if (!response.ok || !data.success) {
          const error: GenerationError = data.error || {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred',
          };
          setState((prev) => ({
            ...prev,
            error,
            isGenerating: false,
            progress: 0,
          }));
          options?.onError?.(error);
          return;
        }

        // Store successful generation params
        lastGenerationRef.current = {prompt: sanitized, style};

        setState((prev) => ({
          ...prev,
          generatedImage: data.image,
          isGenerating: false,
          progress: 100,
          error: null,
        }));

        options?.onSuccess?.(data.image);
      } catch (err) {
        const error: GenerationError = {
          code: 'SERVER_ERROR',
          message:
            err instanceof Error ? err.message : 'Network error occurred',
        };
        setState((prev) => ({
          ...prev,
          error,
          isGenerating: false,
          progress: 0,
        }));
        options?.onError?.(error);
      }
    },
    [options],
  );

  const generate = useCallback(async () => {
    await generateImage(state.prompt, state.style);
  }, [generateImage, state.prompt, state.style]);

  const regenerate = useCallback(async () => {
    // Use last successful generation params if available
    const params = lastGenerationRef.current || {
      prompt: state.prompt,
      style: state.style,
    };
    await generateImage(params.prompt, params.style);
  }, [generateImage, state.prompt, state.style]);

  const download = useCallback(() => {
    if (!state.generatedImage) return;

    const filename = generateFilename(
      lastGenerationRef.current?.prompt || state.prompt,
    );

    // Create download link
    const link = document.createElement('a');
    link.href = state.generatedImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.generatedImage, state.prompt]);

  const reset = useCallback(() => {
    setState(initialState);
    lastGenerationRef.current = null;
  }, []);

  return {
    state,
    setPrompt,
    setStyle,
    generate,
    regenerate,
    download,
    reset,
  };
}

// Export for testing
export {initialState};
