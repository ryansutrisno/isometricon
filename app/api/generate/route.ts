/**
 * API Route: /api/generate
 * Handles image generation requests with automatic fallback
 * Requirements: 1.3, 4.1, 4.5, 4.6, 5.1, 5.3, 7.1, 7.2, 7.3, 7.4, 13.3, 13.4
 */

import {isValidPrompt, sanitizeInput} from '@/lib/input-utils';
import {
  DualProviderError,
  createProviderManager,
} from '@/lib/providers/provider-manager';
import {ProviderError, ProviderName} from '@/lib/providers/types';
import {canMakeRequest, recordRequest} from '@/lib/server-rate-limiter';
import {formatTime} from '@/lib/time-utils';
import {GenerateRequest, StylePreset} from '@/types';
import {NextRequest, NextResponse} from 'next/server';

/**
 * Extended API response with provider metadata
 * Requirements: 1.3, 5.1, 5.3
 */
export interface ExtendedGenerateResponse {
  success: boolean;
  image?: string;
  provider?: ProviderName;
  fallbackUsed?: boolean;
  error?: ExtendedGenerationError;
}

/**
 * Extended error with dual provider failure details
 * Requirements: 4.2
 */
export interface ExtendedGenerationError {
  code: string;
  message: string;
  retryAfter?: number;
  primaryError?: string;
  fallbackError?: string;
}

/**
 * Validates that the style is a valid StylePreset
 */
function isValidStyle(style: unknown): style is StylePreset {
  return (
    typeof style === 'string' &&
    ['default', 'warm', 'monochrome', 'pastel'].includes(style)
  );
}

/**
 * Maps ProviderError to ExtendedGenerationError
 * Requirements: 5.3 - Backward compatibility
 */
function mapProviderError(
  error: ProviderError | DualProviderError,
): ExtendedGenerationError {
  if (error.code === 'DUAL_PROVIDER_FAILURE') {
    const dualError = error as DualProviderError;
    return {
      code: dualError.code,
      message: dualError.message,
      retryAfter: dualError.retryAfter,
      primaryError: dualError.primaryError,
      fallbackError: dualError.fallbackError,
    };
  }

  const providerError = error as ProviderError;
  return {
    code: providerError.code,
    message: providerError.message,
    retryAfter: providerError.retryAfter,
  };
}

/**
 * Maps error code to HTTP status
 */
function errorCodeToHttpStatus(code: string): number {
  switch (code) {
    case 'RATE_LIMIT':
      return 429;
    case 'SERVICE_UNAVAILABLE':
      return 503;
    case 'UNAUTHORIZED':
      return 401;
    case 'VALIDATION_ERROR':
      return 400;
    case 'TIMEOUT':
      return 408;
    case 'DUAL_PROVIDER_FAILURE':
      return 503;
    case 'PAYMENT_REQUIRED':
      return 402;
    case 'SERVER_ERROR':
    default:
      return 500;
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ExtendedGenerateResponse>> {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Check server-side rate limit
    const rateLimitCheck = canMakeRequest(ip);
    if (!rateLimitCheck.allowed) {
      const timeStr = rateLimitCheck.resetInSeconds
        ? formatTime(rateLimitCheck.resetInSeconds)
        : 'later';
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message:
              rateLimitCheck.reason ||
              `Rate limit exceeded. Please try again in ${timeStr}.`,
            retryAfter: rateLimitCheck.resetInSeconds,
          },
        },
        {status: 429},
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body.',
          },
        },
        {status: 400},
      );
    }

    // Validate request structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body.',
          },
        },
        {status: 400},
      );
    }

    const {prompt, style} = body as GenerateRequest;

    // Validate and sanitize prompt (Requirements: 13.4)
    if (typeof prompt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Prompt must be a string.',
          },
        },
        {status: 400},
      );
    }

    const sanitizedPrompt = sanitizeInput(prompt);

    if (!isValidPrompt(sanitizedPrompt)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input. Please check your prompt.',
          },
        },
        {status: 400},
      );
    }

    // Validate style
    if (!isValidStyle(style)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid style preset.',
          },
        },
        {status: 400},
      );
    }

    // Use Provider Manager for generation with automatic fallback
    // Requirements: 1.1, 1.2, 1.3, 3.1
    const providerManager = createProviderManager();
    const result = await providerManager.generate(sanitizedPrompt, {
      style,
      negativePrompt: 'blurry, low quality, distorted, ugly',
      timeout: 30000,
    });

    // Handle generation result
    if (result.success && result.image) {
      // Record successful request for rate limiting
      recordRequest(ip);

      // Requirements: 1.3, 5.1, 5.3 - Include provider metadata
      return NextResponse.json({
        success: true,
        image: result.image,
        provider: result.provider,
        fallbackUsed: result.fallbackAttempted ?? false,
      });
    }

    // Handle generation failure
    if (result.error) {
      const mappedError = mapProviderError(result.error);
      const httpStatus = errorCodeToHttpStatus(mappedError.code);

      return NextResponse.json(
        {
          success: false,
          provider: result.provider,
          fallbackUsed: result.fallbackAttempted ?? false,
          error: mappedError,
        },
        {status: httpStatus},
      );
    }

    // Fallback for unexpected state
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
      {status: 500},
    );
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'A server error occurred. Please try again.',
        },
      },
      {status: 500},
    );
  }
}
