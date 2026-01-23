/**
 * API Route: /api/generate
 * Handles image generation requests via Hugging Face Inference API
 * Requirements: 4.1, 4.5, 4.6, 7.1, 7.2, 7.3, 7.4, 13.3, 13.4
 */

import {getHuggingFaceApiKey} from '@/lib/env';
import {isValidPrompt, sanitizeInput} from '@/lib/input-utils';
import {buildPrompt} from '@/lib/prompt-builder';
import {
  GenerateRequest,
  GenerateResponse,
  GenerationError,
  StylePreset,
} from '@/types';
import {NextRequest, NextResponse} from 'next/server';

const HUGGINGFACE_API_URL =
  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
const API_TIMEOUT_MS = 10000; // 10 seconds timeout

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
 * Maps HTTP status codes to GenerationError
 */
function mapErrorResponse(status: number, message?: string): GenerationError {
  switch (status) {
    case 429:
      return {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please try again in a few seconds.',
        retryAfter: 60,
      };
    case 503:
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is currently unavailable. Please try again later.',
      };
    case 401:
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication error occurred. Please refresh the page.',
      };
    case 408:
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
      };
    default:
      return {
        code: 'SERVER_ERROR',
        message: message || 'A server error occurred. Please try again.',
      };
  }
}

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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateResponse>> {
  try {
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

    // Get API key (Requirements: 13.3)
    let apiKey: string;
    try {
      apiKey = getHuggingFaceApiKey();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Server configuration error.',
          },
        },
        {status: 500},
      );
    }

    // Build full prompt with style
    const fullPrompt = buildPrompt(sanitizedPrompt, style);

    // Call Hugging Face API (Requirements: 4.1, 4.6)
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
              negative_prompt: 'blurry, low quality, distorted, ugly',
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }),
        },
        API_TIMEOUT_MS,
      );
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: mapErrorResponse(408),
          },
          {status: 408},
        );
      }
      throw error;
    }

    // Handle API errors (Requirements: 7.1, 7.2, 7.3, 7.4)
    if (!response.ok) {
      const errorResponse = mapErrorResponse(response.status);
      return NextResponse.json(
        {
          success: false,
          error: errorResponse,
        },
        {status: response.status},
      );
    }

    // Convert response to base64
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      image: imageDataUrl,
    });
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
