/**
 * Feature: cloudflare-fallback-provider
 * Property 1: Response Transformation Produces Valid ProviderResult
 * Property 2: Data URL Format Consistency
 * Property 3: Fallback Provider Error Invariant
 * Property 4: 5xx Status Code Classification
 *
 * Validates: Requirements 1.3, 4.1, 4.2, 4.3, 4.4, 5.3, 6.4
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {
  classifyCloudflareError,
  transformCloudflareResponse,
} from '@/lib/providers/cloudflare-provider';
import {httpStatusToErrorCode} from '@/lib/providers/types';

// Arbitrary for valid base64 strings (alphanumeric + /+=)
const base64Arb = fc
  .array(fc.integer({min: 0, max: 255}), {minLength: 1, maxLength: 100})
  .map((bytes) => Buffer.from(bytes).toString('base64'));

// Arbitrary for error messages
const errorMessageArb = fc.string({minLength: 1, maxLength: 200});

// Arbitrary for error codes (positive integers)
const errorCodeArb = fc.integer({min: 1000, max: 9999});

// Arbitrary for successful Cloudflare response
const successResponseArb = base64Arb.map((image) => ({
  success: true as const,
  result: {image},
}));

// Arbitrary for error Cloudflare response
const errorResponseArb = fc
  .record({
    code: errorCodeArb,
    message: errorMessageArb,
  })
  .map((error) => ({
    success: false as const,
    errors: [error],
  }));

// Arbitrary for Cloudflare response (success or error)
const cloudflareResponseArb = fc.oneof(successResponseArb, errorResponseArb);

// Arbitrary for 5xx status codes
const status5xxArb = fc.integer({min: 500, max: 599});

// Arbitrary for retry-after values
const retryAfterArb = fc.option(fc.integer({min: 1, max: 3600}), {
  nil: undefined,
});

describe('Property 1: Response Transformation Produces Valid ProviderResult', () => {
  /**
   * Validates: Requirements 1.3, 4.1, 4.2, 4.3
   *
   * For any valid Cloudflare API response (success or error),
   * transforming it through transformCloudflareResponse SHALL produce
   * a ProviderResult with:
   * - success as a boolean
   * - image as a string (data URL format) when success is true
   * - error as a ProviderError object when success is false
   */
  it('should always produce a valid ProviderResult structure', () => {
    fc.assert(
      fc.property(cloudflareResponseArb, (response) => {
        const result = transformCloudflareResponse(response);

        // Property: result must have success as boolean
        expect(typeof result.success).toBe('boolean');

        // Property: result structure depends on success
        if (result.success) {
          expect(typeof result.image).toBe('string');
          expect(result.error).toBeUndefined();
        } else {
          expect(result.error).toBeDefined();
          expect(typeof result.error?.code).toBe('string');
          expect(typeof result.error?.message).toBe('string');
          expect(typeof result.error?.shouldFallback).toBe('boolean');
        }
      }),
      {numRuns: 100},
    );
  });

  it('should transform successful response with image to success=true', () => {
    fc.assert(
      fc.property(successResponseArb, (response) => {
        const result = transformCloudflareResponse(response);

        // Property: successful response with image should produce success=true
        expect(result.success).toBe(true);
        expect(result.image).toBeDefined();
        expect(result.error).toBeUndefined();
      }),
      {numRuns: 100},
    );
  });

  it('should transform error response to success=false with error object', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        const result = transformCloudflareResponse(response);

        // Property: error response should produce success=false with error
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('SERVER_ERROR');
        expect(result.error?.message).toBe(response.errors?.[0]?.message);
      }),
      {numRuns: 100},
    );
  });
});

describe('Property 2: Data URL Format Consistency', () => {
  /**
   * Validates: Requirements 4.2
   *
   * For any base64 image string returned by Cloudflare,
   * the transformed output SHALL be a valid data URL matching
   * the pattern data:image/png;base64,{base64_data}
   */
  it('should format base64 image as valid data URL', () => {
    fc.assert(
      fc.property(base64Arb, (base64Image) => {
        const response = {
          success: true as const,
          result: {image: base64Image},
        };

        const result = transformCloudflareResponse(response);

        // Property: image should be formatted as data URL
        expect(result.success).toBe(true);
        expect(result.image).toBe(`data:image/png;base64,${base64Image}`);
      }),
      {numRuns: 100},
    );
  });

  it('should preserve original base64 data in data URL', () => {
    fc.assert(
      fc.property(base64Arb, (base64Image) => {
        const response = {
          success: true as const,
          result: {image: base64Image},
        };

        const result = transformCloudflareResponse(response);

        // Property: data URL should contain the original base64 data
        const expectedPrefix = 'data:image/png;base64,';
        expect(result.image?.startsWith(expectedPrefix)).toBe(true);

        const extractedBase64 = result.image?.slice(expectedPrefix.length);
        expect(extractedBase64).toBe(base64Image);
      }),
      {numRuns: 100},
    );
  });

  it('should produce data URL matching regex pattern', () => {
    fc.assert(
      fc.property(base64Arb, (base64Image) => {
        const response = {
          success: true as const,
          result: {image: base64Image},
        };

        const result = transformCloudflareResponse(response);

        // Property: data URL should match expected pattern
        const dataUrlPattern = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;
        expect(result.image).toMatch(dataUrlPattern);
      }),
      {numRuns: 100},
    );
  });
});

describe('Property 3: Fallback Provider Error Invariant', () => {
  /**
   * Validates: Requirements 4.4, 6.4
   *
   * For any error returned by CloudflareProvider,
   * the shouldFallback property SHALL always be false,
   * since Cloudflare is the fallback provider and there is
   * no further fallback available.
   */
  it('should always set shouldFallback=false for error responses', () => {
    fc.assert(
      fc.property(errorResponseArb, (response) => {
        const result = transformCloudflareResponse(response);

        // Property: shouldFallback must always be false for Cloudflare errors
        expect(result.success).toBe(false);
        expect(result.error?.shouldFallback).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('should always set shouldFallback=false for classified HTTP errors', () => {
    fc.assert(
      fc.property(
        fc.integer({min: 400, max: 599}),
        errorMessageArb,
        retryAfterArb,
        (status, message, retryAfter) => {
          const error = classifyCloudflareError(status, message, retryAfter);

          // Property: shouldFallback must always be false for Cloudflare
          expect(error.shouldFallback).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should set shouldFallback=false for missing image in success response', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const response = {
          success: true as const,
          result: {},
        };

        const result = transformCloudflareResponse(response);

        // Property: missing image should result in error with shouldFallback=false
        expect(result.success).toBe(false);
        expect(result.error?.shouldFallback).toBe(false);
      }),
      {numRuns: 100},
    );
  });
});

describe('Property 4: 5xx Status Code Classification', () => {
  /**
   * Validates: Requirements 5.3
   *
   * For any HTTP status code in the range 500-599,
   * the error classification SHALL return SERVER_ERROR as the error code.
   */
  it('should classify all 5xx status codes as SERVER_ERROR', () => {
    fc.assert(
      fc.property(status5xxArb, (status) => {
        const errorCode = httpStatusToErrorCode(status);

        // Property: all 5xx codes should map to SERVER_ERROR (except 503)
        if (status === 503) {
          expect(errorCode).toBe('SERVICE_UNAVAILABLE');
        } else {
          expect(errorCode).toBe('SERVER_ERROR');
        }
      }),
      {numRuns: 100},
    );
  });

  it('should classify 5xx errors with shouldFallback=false for Cloudflare', () => {
    fc.assert(
      fc.property(status5xxArb, errorMessageArb, (status, message) => {
        const error = classifyCloudflareError(status, message);

        // Property: Cloudflare 5xx errors should have shouldFallback=false
        expect(error.shouldFallback).toBe(false);
      }),
      {numRuns: 100},
    );
  });

  it('should not include retryAfter for 5xx errors', () => {
    fc.assert(
      fc.property(
        status5xxArb,
        errorMessageArb,
        fc.integer({min: 1, max: 3600}),
        (status, message, retryAfter) => {
          const error = classifyCloudflareError(status, message, retryAfter);

          // Property: 5xx errors should not have retryAfter (only RATE_LIMIT does)
          expect(error.retryAfter).toBeUndefined();
        },
      ),
      {numRuns: 100},
    );
  });
});
