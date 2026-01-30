/**
 * Provider Types and Interfaces for API Fallback System
 * Requirements: 1.3, 2.1-2.6, 5.1
 */

import {StylePreset} from '@/types';

/**
 * Available provider names
 */
export type ProviderName = 'huggingface' | 'cloudflare';

/**
 * Error codes for provider failures
 */
export type ProviderErrorCode =
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_REQUIRED'
  | 'UNKNOWN';

/**
 * Provider error structure with fallback classification
 */
export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  retryAfter?: number;
  shouldFallback: boolean;
}

/**
 * Result from a provider generation attempt
 */
export interface ProviderResult {
  success: boolean;
  image?: string; // base64 data URL
  error?: ProviderError;
}

/**
 * Options for image generation
 */
export interface GenerationOptions {
  style: StylePreset;
  negativePrompt?: string;
  timeout?: number;
}

/**
 * Interface that all image providers must implement
 */
export interface ImageProvider {
  name: ProviderName;
  generate(prompt: string, options: GenerationOptions): Promise<ProviderResult>;
}

/**
 * HTTP status codes that should trigger fallback
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * Added 402 (Payment Required) and 403 (Forbidden) for credit/quota exhaustion
 */
export const FALLBACK_HTTP_STATUSES = [402, 403, 429, 500, 503] as const;

/**
 * HTTP status codes that should NOT trigger fallback
 * Requirements: 2.5, 2.6
 */
export const NON_FALLBACK_HTTP_STATUSES = [400, 401] as const;

/**
 * Classifies an HTTP status code to determine if fallback should be triggered
 * Requirements: 2.1-2.6
 *
 * @param status - HTTP status code
 * @returns true if fallback should be triggered, false otherwise
 */
export function shouldTriggerFallback(status: number): boolean {
  // Rate limit, server error, service unavailable - should fallback
  if ((FALLBACK_HTTP_STATUSES as readonly number[]).includes(status)) {
    return true;
  }
  // Unauthorized, validation error - should NOT fallback
  if ((NON_FALLBACK_HTTP_STATUSES as readonly number[]).includes(status)) {
    return false;
  }
  // 5xx errors should trigger fallback
  if (status >= 500 && status < 600) {
    return true;
  }
  // Default: don't fallback for unknown client errors
  return false;
}

/**
 * Classifies an error code to determine if fallback should be triggered
 *
 * @param code - Provider error code
 * @returns true if fallback should be triggered, false otherwise
 */
export function shouldFallbackForErrorCode(code: ProviderErrorCode): boolean {
  switch (code) {
    // Recoverable errors - should fallback
    case 'RATE_LIMIT':
    case 'TIMEOUT':
    case 'SERVICE_UNAVAILABLE':
    case 'SERVER_ERROR':
    case 'PAYMENT_REQUIRED':
      return true;
    // Non-recoverable errors - should NOT fallback
    case 'UNAUTHORIZED':
    case 'VALIDATION_ERROR':
      return false;
    // Unknown errors - don't fallback by default
    case 'UNKNOWN':
    default:
      return false;
  }
}

/**
 * Maps HTTP status code to ProviderErrorCode
 *
 * @param status - HTTP status code
 * @returns Corresponding ProviderErrorCode
 */
export function httpStatusToErrorCode(status: number): ProviderErrorCode {
  switch (status) {
    case 402:
    case 403:
      return 'PAYMENT_REQUIRED';
    case 429:
      return 'RATE_LIMIT';
    case 408:
      return 'TIMEOUT';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 500:
      return 'SERVER_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 400:
      return 'VALIDATION_ERROR';
    default:
      if (status >= 500 && status < 600) {
        return 'SERVER_ERROR';
      }
      return 'UNKNOWN';
  }
}

/**
 * Creates a ProviderError from HTTP status code
 *
 * @param status - HTTP status code
 * @param message - Optional custom error message
 * @param retryAfter - Optional retry after seconds
 * @returns ProviderError with appropriate shouldFallback flag
 */
export function createProviderError(
  status: number,
  message?: string,
  retryAfter?: number,
): ProviderError {
  const code = httpStatusToErrorCode(status);
  const shouldFallback = shouldTriggerFallback(status);

  const defaultMessages: Record<ProviderErrorCode, string> = {
    RATE_LIMIT: 'Too many requests. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVICE_UNAVAILABLE:
      'Service is currently unavailable. Please try again later.',
    SERVER_ERROR: 'A server error occurred. Please try again.',
    UNAUTHORIZED: 'Authentication error occurred. Please refresh the page.',
    VALIDATION_ERROR: 'Invalid request. Please check your input.',
    PAYMENT_REQUIRED: 'Service quota exhausted. Switching to backup provider.',
    UNKNOWN: 'An unexpected error occurred.',
  };

  return {
    code,
    message: message || defaultMessages[code],
    retryAfter: code === 'RATE_LIMIT' ? (retryAfter ?? 60) : retryAfter,
    shouldFallback,
  };
}

/**
 * Creates a ProviderError for timeout scenarios
 * Requirements: 2.4
 */
export function createTimeoutError(): ProviderError {
  return {
    code: 'TIMEOUT',
    message: 'Request timed out. Please try again.',
    shouldFallback: true,
  };
}
