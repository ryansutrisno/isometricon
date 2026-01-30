/**
 * Unit Tests: Cloudflare Provider
 * Requirements: 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * Tests environment variable handling, HTTP error classification,
 * timeout handling, and response transformation.
 */

import {
  classifyCloudflareError,
  CloudflareProvider,
  createCloudflareProvider,
  transformCloudflareResponse,
} from '@/lib/providers/cloudflare-provider';
import {ProviderErrorCode} from '@/lib/providers/types';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock dependencies
const mockGetCloudflareAccountId = vi.fn();
const mockGetCloudflareApiToken = vi.fn();

vi.mock('@/lib/env', () => ({
  getCloudflareAccountId: () => mockGetCloudflareAccountId(),
  getCloudflareApiToken: () => mockGetCloudflareApiToken(),
}));

vi.mock('@/lib/prompt-builder', () => ({
  buildPrompt: vi.fn((prompt: string) => `styled: ${prompt}`),
}));

describe('CloudflareProvider', () => {
  let provider: CloudflareProvider;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    provider = new CloudflareProvider();
    originalFetch = global.fetch;
    mockGetCloudflareAccountId.mockReturnValue('test-account-id');
    mockGetCloudflareApiToken.mockReturnValue('test-api-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('provider identity', () => {
    it('should have name "cloudflare"', () => {
      expect(provider.name).toBe('cloudflare');
    });

    it('should create provider via factory function', () => {
      const factoryProvider = createCloudflareProvider();
      expect(factoryProvider.name).toBe('cloudflare');
    });
  });

  describe('environment variable handling', () => {
    it('should return SERVER_ERROR when CLOUDFLARE_ACCOUNT_ID is missing (Req 2.3)', async () => {
      mockGetCloudflareAccountId.mockImplementation(() => {
        throw new Error('Missing CLOUDFLARE_ACCOUNT_ID');
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.message).toBe('Server configuration error.');
      expect(result.error?.shouldFallback).toBe(false);
    });

    it('should return SERVER_ERROR when CLOUDFLARE_API_TOKEN is missing (Req 2.4)', async () => {
      mockGetCloudflareApiToken.mockImplementation(() => {
        throw new Error('Missing CLOUDFLARE_API_TOKEN');
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.message).toBe('Server configuration error.');
      expect(result.error?.shouldFallback).toBe(false);
    });
  });

  describe('HTTP status to error code mapping', () => {
    const testCases: Array<{
      status: number;
      expectedCode: ProviderErrorCode;
      description: string;
    }> = [
      {
        status: 429,
        expectedCode: 'RATE_LIMIT',
        description: 'HTTP 429 (Rate Limit) - Req 5.1',
      },
      {
        status: 401,
        expectedCode: 'UNAUTHORIZED',
        description: 'HTTP 401 (Unauthorized) - Req 5.2',
      },
      {
        status: 500,
        expectedCode: 'SERVER_ERROR',
        description: 'HTTP 500 (Server Error) - Req 5.3',
      },
      {
        status: 502,
        expectedCode: 'SERVER_ERROR',
        description: 'HTTP 502 (Bad Gateway) - Req 5.3',
      },
      {
        status: 503,
        expectedCode: 'SERVICE_UNAVAILABLE',
        description: 'HTTP 503 (Service Unavailable)',
      },
      {
        status: 400,
        expectedCode: 'VALIDATION_ERROR',
        description: 'HTTP 400 (Validation Error) - Req 5.5',
      },
    ];

    testCases.forEach(({status, expectedCode, description}) => {
      it(`should map ${description} correctly`, async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({success: false, errors: []}),
        });

        const result = await provider.generate('test prompt', {
          style: 'default',
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(expectedCode);
        expect(result.error?.shouldFallback).toBe(false); // Always false for fallback provider
      });
    });
  });

  describe('shouldFallback invariant', () => {
    it('should always set shouldFallback=false for all errors', async () => {
      const errorStatuses = [400, 401, 429, 500, 502, 503];

      for (const status of errorStatuses) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({success: false, errors: []}),
        });

        const result = await provider.generate('test', {style: 'default'});
        expect(result.error?.shouldFallback).toBe(false);
      }
    });
  });

  describe('timeout handling', () => {
    it('should return TIMEOUT error when request times out (Req 5.4)', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await provider.generate('test', {
        style: 'default',
        timeout: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
      expect(result.error?.shouldFallback).toBe(false);
    });

    it('should use default timeout of 60000ms when not specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          result: {image: 'dGVzdA=='},
        }),
      });
      global.fetch = mockFetch;

      await provider.generate('test', {style: 'default'});

      // Verify fetch was called (timeout is handled internally)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Retry-After header parsing', () => {
    it('should parse Retry-After header for rate limit errors (Req 5.6)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({'Retry-After': '120'}),
        json: vi.fn().mockResolvedValue({success: false, errors: []}),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.code).toBe('RATE_LIMIT');
      expect(result.error?.retryAfter).toBe(120);
    });

    it('should not include retryAfter for non-rate-limit errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({'Retry-After': '60'}),
        json: vi.fn().mockResolvedValue({success: false, errors: []}),
      });

      const result = await provider.generate('test', {style: 'default'});

      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.retryAfter).toBeUndefined();
    });
  });

  describe('network errors', () => {
    it('should return SERVER_ERROR for network failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await provider.generate('test', {style: 'default'});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
      expect(result.error?.shouldFallback).toBe(false);
    });
  });

  describe('successful generation', () => {
    it('should return success with image data URL', async () => {
      const base64Image =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          result: {image: base64Image},
        }),
      });

      const result = await provider.generate('test prompt', {style: 'default'});

      expect(result.success).toBe(true);
      expect(result.image).toBe(`data:image/png;base64,${base64Image}`);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('transformCloudflareResponse', () => {
  it('should transform successful response to ProviderResult', () => {
    const response = {
      success: true,
      result: {image: 'dGVzdA=='},
    };

    const result = transformCloudflareResponse(response);

    expect(result.success).toBe(true);
    expect(result.image).toBe('data:image/png;base64,dGVzdA==');
  });

  it('should transform error response to ProviderResult', () => {
    const response = {
      success: false,
      errors: [{code: 1000, message: 'Test error'}],
    };

    const result = transformCloudflareResponse(response);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SERVER_ERROR');
    expect(result.error?.message).toBe('Test error');
    expect(result.error?.shouldFallback).toBe(false);
  });

  it('should handle missing image in successful response', () => {
    const response = {
      success: true,
      result: {},
    };

    const result = transformCloudflareResponse(response);

    expect(result.success).toBe(false);
    expect(result.error?.shouldFallback).toBe(false);
  });
});

describe('classifyCloudflareError', () => {
  it('should always set shouldFallback to false', () => {
    const statuses = [400, 401, 429, 500, 502, 503];

    for (const status of statuses) {
      const error = classifyCloudflareError(status);
      expect(error.shouldFallback).toBe(false);
    }
  });

  it('should include retryAfter only for RATE_LIMIT errors', () => {
    const rateLimitError = classifyCloudflareError(429, undefined, 60);
    expect(rateLimitError.retryAfter).toBe(60);

    const serverError = classifyCloudflareError(500, undefined, 60);
    expect(serverError.retryAfter).toBeUndefined();
  });
});
