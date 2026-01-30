/**
 * Hugging Face Provider Implementation
 * Requirements: 1.1, 1.2, 2.1-2.6
 *
 * Implements the ImageProvider interface for Hugging Face Inference API.
 * Handles error classification and shouldFallback flag for fallback mechanism.
 */

import {getHuggingFaceApiKey} from '@/lib/env';
import {buildPrompt} from '@/lib/prompt-builder';
import {
  createProviderError,
  createTimeoutError,
  GenerationOptions,
  ImageProvider,
  ProviderName,
  ProviderResult,
} from './types';

const HUGGINGFACE_API_URL =
  'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_NEGATIVE_PROMPT = 'blurry, low quality, distorted, ugly';

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Hugging Face Provider for image generation
 * Implements ImageProvider interface with proper error classification
 */
export class HuggingFaceProvider implements ImageProvider {
  readonly name: ProviderName = 'huggingface';

  /**
   * Generate an image using Hugging Face Inference API
   *
   * @param prompt - The user's prompt for image generation
   * @param options - Generation options including style and timeout
   * @returns ProviderResult with image or error with shouldFallback flag
   */
  async generate(
    prompt: string,
    options: GenerationOptions,
  ): Promise<ProviderResult> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const negativePrompt = options.negativePrompt ?? DEFAULT_NEGATIVE_PROMPT;

    // Get API key
    let apiKey: string;
    try {
      apiKey = getHuggingFaceApiKey();
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server configuration error.',
          shouldFallback: false, // Config errors shouldn't trigger fallback
        },
      };
    }

    // Build full prompt with style
    const fullPrompt = buildPrompt(prompt, options.style);

    // Call Hugging Face API
    let response: Response;
    try {
      response = await fetchWithTimeout(
        HUGGINGFACE_API_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              negative_prompt: negativePrompt,
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }),
        },
        timeout,
      );
    } catch (error) {
      // Handle timeout (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: createTimeoutError(),
        };
      }

      // Network or other fetch errors - should trigger fallback
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Network error occurred.',
          shouldFallback: true,
        },
      };
    }

    // Handle API errors with proper classification
    if (!response.ok) {
      const retryAfter = this.parseRetryAfter(response);
      const errorMessage = await this.getErrorMessage(response);

      return {
        success: false,
        error: createProviderError(response.status, errorMessage, retryAfter),
      };
    }

    // Convert response to base64
    try {
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const imageDataUrl = `data:image/png;base64,${base64Image}`;

      return {
        success: true,
        image: imageDataUrl,
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process image response.',
          shouldFallback: true,
        },
      };
    }
  }

  /**
   * Parse Retry-After header from response
   */
  private parseRetryAfter(response: Response): number | undefined {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds;
      }
    }
    return undefined;
  }

  /**
   * Extract error message from response
   */
  private async getErrorMessage(
    response: Response,
  ): Promise<string | undefined> {
    try {
      const text = await response.text();
      if (text) {
        // Try to parse as JSON for structured error
        try {
          const json = JSON.parse(text);
          return json.error || json.message || text;
        } catch {
          return text;
        }
      }
    } catch {
      // Ignore errors reading response body
    }
    return undefined;
  }
}

/**
 * Factory function to create HuggingFaceProvider instance
 */
export function createHuggingFaceProvider(): HuggingFaceProvider {
  return new HuggingFaceProvider();
}
