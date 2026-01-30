/**
 * Unit Tests: Hugging Face Provider Error Mapping
 * Requirements: 2.1-2.6
 *
 * Tests HTTP status to error code mapping and shouldFallback flag for each error type.
 */

import {HuggingFaceProvider} from '@/lib/providers/huggingface-provider';
import {ProviderErrorCode} from '@/lib/providers/types';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock dependencies
vi.mock('@/lib/env', () => ({
  getHuggingFaceApiKey: vi.fn(() => 'test-api-key'),
}));

vi.mock('@/lib/prompt-builder', () => ({
  buildPrompt: vi.fn((prompt: string) => `styled: ${prompt}`),
}));

describe('HuggingFaceProvider', () => {
  let provider: HuggingFaceProvider;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    provider = new HuggingFaceProvider();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('provider identity', () => {
    it('should have name "huggingface"', () => {
      expect(provider.name).toBe('huggingface');
    });
  });

  describe('HTTP status to error code mapping', () => {
    const testCases: Array<{
      status: number;
      expectedCode: ProviderErrorCode;
      expectedShouldFallback: boolean;
      description: string;
    }> = [
      {
        status: 429,
        expectedCode: 'RATE_LIMIT',
        expectedShouldFallback: true,
        description: 'HTTP 429 (Rate Limit)',
      },
      {
        status: 500,
        expectedCode: 'SERVER_ERROR',
        expectedShouldFallback: true,
        description: 'HTTP 500 (Server Error)',
      },
      {
        status: 503,
        expectedCode: 'SERVICE_UNAVAILABLE',
        expectedShouldFallback: true,
        description: 'HTTP 503 (Service Unavailable)',
      },
      {
        status: 401,
        expectedCode: 'UNAUTHORIZED',
        expectedShouldFallback: false,
        description: 'HTTP 401 (Unauthorized)',
      },
      {
        status: 400,
        expectedCode: 'VALIDATION_ERROR',
        expectedShouldFallback: false,
        description: 'HTTP 400 (Validation Error)',
      },
    ];

    testCases.forEach(
      ({status, expectedCode, expectedShouldFallback, description}) => {
        it(`should map ${description} correctly`, async () => {
          global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status,
            headers: new Headers(),
            text: vi.fn().mockResolvedValue(''),
          });

          const result = await provider.generate('test prompt', {
            style: 'default',
          });

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.code).toBe(expectedCode);
          expect(result.error?.shouldFallback).toBe(expectedShouldFallback);
        });
      },
    );
  });

  describe('shouldFallback flag for each error type', () => {
    it('should set shouldFallback=true for rate limit errors (Req 2.1)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({'Retry-After': '60'}),
        text: vi.fn().mockResolvedValue('Rate limit exceeded'),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.shouldFallback).toBe(true);
      expect(result.error?.retryAfter).toBe(60);
    });

    it('should set shouldFallback=true for service unavailable (Req 2.2)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('Service unavailable'),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.shouldFallback).toBe(true);
    });

    it('should set shouldFallback=true for server errors (Req 2.3)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('Internal server error'),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.shouldFallback).toBe(true);
    });

    it('should set shouldFallback=true for timeout errors (Req 2.4)', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await provider.generate('test', {
        style: 'default',
        timeout: 100,
      });

      expect(result.error?.code).toBe('TIMEOUT');
      expect(result.error?.shouldFallback).toBe(true);
    });

    it('should set shouldFallback=false for unauthorized errors (Req 2.5)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('Unauthorized'),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.shouldFallback).toBe(false);
    });

    it('should set shouldFallback=false for validation errors (Req 2.6)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('Bad request'),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.shouldFallback).toBe(false);
    });
  });

  describe('successful generation', () => {
    it('should return success with image data URL', async () => {
      const mockImageData = new Uint8Array([137, 80, 78, 71]); // PNG header
      const mockArrayBuffer = mockImageData.buffer;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue({
          arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
        }),
      });

      const result = await provider.generate('test prompt', {style: 'default'});

      expect(result.success).toBe(true);
      expect(result.image).toMatch(/^data:image\/png;base64,/);
      expect(result.error).toBeUndefined();
    });
  });

  describe('network errors', () => {
    it('should set shouldFallback=true for network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await provider.generate('test', {style: 'default'});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.shouldFallback).toBe(true);
    });
  });

  describe('Retry-After header parsing', () => {
    it('should parse Retry-After header for rate limit errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({'Retry-After': '120'}),
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.retryAfter).toBe(120);
    });

    it('should use default retryAfter when header is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.retryAfter).toBe(60); // default value
    });
  });
});
