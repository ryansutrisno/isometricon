/**
 * Cloudflare Workers AI Provider Implementation
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 3.1-3.4, 4.1-4.4, 5.1-5.6, 6.1-6.4
 *
 * Implements the ImageProvider interface for Cloudflare Workers AI.
 * Uses FLUX.1 schnell model for fast image generation.
 * As the fallback provider, shouldFallback is always false on errors.
 */

import {getCloudflareAccountId, getCloudflareApiToken} from '@/lib/env';
import {buildPrompt} from '@/lib/prompt-builder';
import {
  GenerationOptions,
  ImageProvider,
  ProviderError,
  ProviderErrorCode,
  ProviderName,
  ProviderResult,
  httpStatusToErrorCode,
} from './types';

// API Configuration
const CLOUDFLARE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const DEFAULT_TIMEOUT_MS = 60000;

/**
 * Build Cloudflare API URL with account ID
 */
function buildApiUrl(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`;
}

/**
 * Cloudflare API response structure
 */
interface CloudflareImageResponse {
  success: boolean;
  result?: {
    image?: string; // base64 encoded image
  };
  errors?: Array<{
    code: number;
    message: string;
  }>;
  messages?: string[];
}

/**
 * Transform Cloudflare API response to ProviderResult
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function transformCloudflareResponse(
  response: CloudflareImageResponse,
): ProviderResult {
  if (response.success && response.result?.image) {
    return {
      success: true,
      image: `data:image/png;base64,${response.result.image}`,
    };
  }

  // Handle error response
  const errorMessage =
    response.errors?.[0]?.message || 'Failed to generate image.';

  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: errorMessage,
      shouldFallback: false, // Cloudflare is fallback provider
    },
  };
}

/**
 * Classify HTTP status code to ProviderError for Cloudflare
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export function classifyCloudflareError(
  status: number,
  message?: string,
  retryAfter?: number,
): ProviderError {
  const code = httpStatusToErrorCode(status);

  const defaultMessages: Record<ProviderErrorCode, string> = {
    RATE_LIMIT: 'Too many requests. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVICE_UNAVAILABLE:
      'Service is currently unavailable. Please try again later.',
    SERVER_ERROR: 'A server error occurred. Please try again.',
    UNAUTHORIZED: 'Authentication error occurred.',
    VALIDATION_ERROR: 'Invalid request. Please check your input.',
    PAYMENT_REQUIRED: 'Service quota exhausted.',
    UNKNOWN: 'An unexpected error occurred.',
  };

  return {
    code,
    message: message || defaultMessages[code],
    retryAfter: code === 'RATE_LIMIT' ? retryAfter : undefined,
    shouldFallback: false, // Always false for fallback provider
  };
}

/**
 * Cloudflare Workers AI Provider for image generation
 * Implements ImageProvider interface
 * Requirements: 1.1, 1.4
 */
export class CloudflareProvider implements ImageProvider {
  readonly name: ProviderName = 'cloudflare';

  /**
   * Generate an image using Cloudflare Workers AI
   * Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3
   *
   * @param prompt - The user's prompt for image generation
   * @param options - Generation options including style and timeout
   * @returns ProviderResult with image or error
   */
  async generate(
    prompt: string,
    options: GenerationOptions,
  ): Promise<ProviderResult> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

    // Get credentials from environment
    let accountId: string;
    let apiToken: string;

    try {
      accountId = getCloudflareAccountId();
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server configuration error.',
          shouldFallback: false,
        },
      };
    }

    try {
      apiToken = getCloudflareApiToken();
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server configuration error.',
          shouldFallback: false,
        },
      };
    }

    // Build full prompt with style transformation
    const fullPrompt = buildPrompt(prompt, options.style);

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(buildApiUrl(accountId), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out. Please try again.',
            shouldFallback: false,
          },
        };
      }

      // Network or other fetch errors
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Network error occurred.',
          shouldFallback: false,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle HTTP errors
    if (!response.ok) {
      const retryAfter = this.parseRetryAfter(response);
      const errorMessage = await this.getErrorMessage(response);

      return {
        success: false,
        error: classifyCloudflareError(
          response.status,
          errorMessage,
          retryAfter,
        ),
      };
    }

    // Parse successful response
    try {
      const data: CloudflareImageResponse = await response.json();
      return transformCloudflareResponse(data);
    } catch {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to parse response.',
          shouldFallback: false,
        },
      };
    }
  }

  /**
   * Parse Retry-After header from response
   * Requirements: 5.6
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
      const data: CloudflareImageResponse = await response.json();
      return data.errors?.[0]?.message;
    } catch {
      return undefined;
    }
  }
}

/**
 * Factory function to create CloudflareProvider instance
 */
export function createCloudflareProvider(): CloudflareProvider {
  return new CloudflareProvider();
}
