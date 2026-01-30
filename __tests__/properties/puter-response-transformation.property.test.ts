/**
 * @deprecated This test file is deprecated along with the Puter provider.
 * Puter Provider has been replaced by Cloudflare Provider as the fallback provider.
 * See __tests__/properties/cloudflare-response-transformation.property.test.ts for the new tests.
 *
 * Feature: api-fallback-provider
 * Property 10: Puter Response Transformation
 * Validates: Requirements 6.2
 *
 * For any Puter API response format, the transformation to GenerationResult
 * should preserve the image data and correctly set provider metadata.
 */

import {describe, it} from 'vitest';

// All tests are skipped because Puter provider is deprecated
// See cloudflare-response-transformation.property.test.ts for active tests

describe.skip('Property 10: Puter Response Transformation (DEPRECATED)', () => {
  it('should transform successful base64 response to ProviderResult with image', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should preserve base64 data in transformation', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should handle data URL prefix correctly', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should transform URL response to ProviderResult', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should transform error response to ProviderResult with error', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should handle empty/invalid responses gracefully', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should always return valid ProviderResult structure', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should set shouldFallback=false for all Puter errors (Puter is fallback provider)', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });
});

describe.skip('Puter Response Edge Cases (DEPRECATED)', () => {
  it('should prefer base64 over URL when both are present', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });

  it('should handle response with success=false explicitly', () => {
    // Deprecated - see cloudflare-response-transformation.property.test.ts
  });
});
