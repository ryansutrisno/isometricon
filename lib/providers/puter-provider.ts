/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Puter Provider has been replaced by Cloudflare Provider as the fallback provider.
 * See lib/providers/cloudflare-provider.ts for the new implementation.
 *
 * Reason for deprecation:
 * - Puter only works client-side with a "User-Pays" model
 * - Not suitable for server-side operations
 * - Cloudflare Workers AI provides server-side image generation
 *
 * Migration: Use createCloudflareProvider() from './cloudflare-provider' instead.
 */

// All code below is deprecated and commented out for reference only.
// DO NOT USE - This provider is no longer functional.

/*
import {buildPrompt} from '@/lib/prompt-builder';
import {
  createProviderError,
  createTimeoutError,
  GenerationOptions,
  ImageProvider,
  ProviderName,
  ProviderResult,
} from './types';

const PUTER_API_URL = 'https://api.puter.com/drivers/call';
const DEFAULT_TIMEOUT_MS = 60000;
const PUTER_MODEL = 'flux-schnell';

export interface PuterImageResponse {
  success?: boolean;
  result?: {
    image?: {
      base64?: string;
      url?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
}

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

function getPuterApiToken(): string | undefined {
  return process.env.PUTER_API_TOKEN;
}

export function transformPuterResponse(
  response: PuterImageResponse,
): ProviderResult {
  if (response.error) {
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: response.error.message || 'Puter API error occurred.',
        shouldFallback: false,
      },
    };
  }

  if (response.success !== false && response.result?.image) {
    const image = response.result.image;

    if (image.base64) {
      const base64Data = image.base64.startsWith('data:')
        ? image.base64
        : `data:image/png;base64,${image.base64}`;

      return {
        success: true,
        image: base64Data,
      };
    }

    if (image.url) {
      return {
        success: true,
        image: image.url,
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'No image data in Puter response.',
      shouldFallback: false,
    },
  };
}

export class PuterProvider implements ImageProvider {
  readonly name: ProviderName = 'puter';

  async generate(
    prompt: string,
    options: GenerationOptions,
  ): Promise<ProviderResult> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const fullPrompt = buildPrompt(prompt, options.style);
    const apiToken = getPuterApiToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        PUTER_API_URL,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            interface: 'puter-image-generation',
            driver: 'ai-image',
            method: 'generate',
            args: {
              prompt: fullPrompt,
              model: PUTER_MODEL,
            },
          }),
        },
        timeout,
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: createTimeoutError(),
        };
      }

      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Network error occurred.',
          shouldFallback: false,
        },
      };
    }

    if (!response.ok) {
      const retryAfter = this.parseRetryAfter(response);
      const errorMessage = await this.getErrorMessage(response);

      const error = createProviderError(
        response.status,
        errorMessage,
        retryAfter,
      );
      error.shouldFallback = false;

      return {
        success: false,
        error,
      };
    }

    try {
      const data: PuterImageResponse = await response.json();
      return transformPuterResponse(data);
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to parse Puter response.',
          shouldFallback: false,
        },
      };
    }
  }

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

  private async getErrorMessage(
    response: Response,
  ): Promise<string | undefined> {
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          return json.error?.message || json.message || text;
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

export function createPuterProvider(): PuterProvider {
  return new PuterProvider();
}
*/

// Export nothing - this file is deprecated
export {};
