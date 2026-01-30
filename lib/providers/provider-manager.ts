/**
 * Provider Manager Implementation
 * Requirements: 1.1, 1.2, 3.1, 4.1, 4.2, 4.3
 *
 * Manages provider selection and implements sequential fallback logic.
 * Tries primary provider first, falls back on recoverable errors.
 */

import {createCloudflareProvider} from './cloudflare-provider';
import {createHuggingFaceProvider} from './huggingface-provider';
import {
  GenerationOptions,
  ImageProvider,
  ProviderError,
  ProviderName,
} from './types';

/**
 * Extended error for dual provider failures
 * Requirements: 4.1, 4.2
 */
export interface DualProviderError {
  code: 'DUAL_PROVIDER_FAILURE';
  message: string;
  primaryError: string;
  fallbackError: string;
  retryAfter?: number;
  shouldFallback: false;
}

/**
 * Generation result from Provider Manager
 * Requirements: 1.3, 5.1
 */
export interface GenerationResult {
  success: boolean;
  image?: string;
  provider?: ProviderName;
  error?: ProviderError | DualProviderError;
  fallbackAttempted?: boolean;
}

/**
 * Provider Manager configuration
 */
export interface ProviderManagerConfig {
  primaryProvider: ImageProvider;
  fallbackProvider: ImageProvider;
}

/**
 * Provider Manager class
 * Implements sequential fallback logic for image generation
 */
export class ProviderManager {
  private primaryProvider: ImageProvider;
  private fallbackProvider: ImageProvider;

  constructor(config: ProviderManagerConfig) {
    this.primaryProvider = config.primaryProvider;
    this.fallbackProvider = config.fallbackProvider;
  }

  /**
   * Generate an image with automatic fallback
   * Requirements: 1.1, 1.2, 3.1, 4.1, 4.2, 4.3
   *
   * @param prompt - The user's prompt for image generation
   * @param options - Generation options including style and timeout
   * @returns GenerationResult with image or error details
   */
  async generate(
    prompt: string,
    options: GenerationOptions,
  ): Promise<GenerationResult> {
    // Requirement 1.1: Always attempt primary provider first
    const primaryResult = await this.primaryProvider.generate(prompt, options);

    // Requirement 1.2: Return immediately on primary success
    if (primaryResult.success) {
      return {
        success: true,
        image: primaryResult.image,
        provider: this.primaryProvider.name,
        fallbackAttempted: false,
      };
    }

    // Check if we should fallback
    const primaryError = primaryResult.error;
    if (!primaryError?.shouldFallback) {
      // Non-recoverable error - return without fallback
      return {
        success: false,
        error: primaryError,
        provider: this.primaryProvider.name,
        fallbackAttempted: false,
      };
    }

    // Requirement 3.1: Fallback with same prompt and parameters
    const fallbackResult = await this.fallbackProvider.generate(
      prompt,
      options,
    );

    // Fallback succeeded
    if (fallbackResult.success) {
      return {
        success: true,
        image: fallbackResult.image,
        provider: this.fallbackProvider.name,
        fallbackAttempted: true,
      };
    }

    // Requirements 4.1, 4.2, 4.3: Both providers failed
    const fallbackError = fallbackResult.error;
    const dualError = this.createDualProviderError(primaryError, fallbackError);

    return {
      success: false,
      error: dualError,
      fallbackAttempted: true,
    };
  }

  /**
   * Create a combined error for dual provider failure
   * Requirements: 4.1, 4.2, 4.3
   */
  private createDualProviderError(
    primaryError: ProviderError,
    fallbackError?: ProviderError,
  ): DualProviderError {
    // Requirement 4.3: Calculate minimum retry time for dual rate limits
    const retryAfter = this.calculateMinRetryTime(primaryError, fallbackError);

    return {
      code: 'DUAL_PROVIDER_FAILURE',
      message: 'Both image generation services are currently unavailable.',
      primaryError: primaryError.message,
      fallbackError: fallbackError?.message || 'Unknown fallback error',
      retryAfter,
      shouldFallback: false,
    };
  }

  /**
   * Calculate minimum retry time from both providers
   * Requirements: 4.3
   *
   * @param primaryError - Error from primary provider
   * @param fallbackError - Error from fallback provider
   * @returns Minimum retry time in seconds, or undefined if neither has retry time
   */
  private calculateMinRetryTime(
    primaryError: ProviderError,
    fallbackError?: ProviderError,
  ): number | undefined {
    const primaryRetry = primaryError.retryAfter;
    const fallbackRetry = fallbackError?.retryAfter;

    // Both have retry times - return minimum
    if (primaryRetry !== undefined && fallbackRetry !== undefined) {
      return Math.min(primaryRetry, fallbackRetry);
    }

    // Only one has retry time - return that one
    if (primaryRetry !== undefined) {
      return primaryRetry;
    }

    if (fallbackRetry !== undefined) {
      return fallbackRetry;
    }

    // Neither has retry time
    return undefined;
  }
}

/**
 * Create default Provider Manager with HuggingFace as primary and Cloudflare as fallback
 * Requirements: 7.1, 7.2
 */
export function createProviderManager(): ProviderManager {
  return new ProviderManager({
    primaryProvider: createHuggingFaceProvider(),
    fallbackProvider: createCloudflareProvider(),
  });
}

/**
 * Create Provider Manager with custom providers (useful for testing)
 */
export function createProviderManagerWithProviders(
  primaryProvider: ImageProvider,
  fallbackProvider: ImageProvider,
): ProviderManager {
  return new ProviderManager({
    primaryProvider,
    fallbackProvider,
  });
}
