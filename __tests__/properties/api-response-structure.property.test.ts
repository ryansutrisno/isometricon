/**
 * Feature: api-fallback-provider
 * Property 3: Provider Metadata Always Present
 * Property 9: Backward Compatibility
 * Validates: Requirements 1.3, 5.1, 5.3
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {
  createProviderManagerWithProviders,
  DualProviderError,
  GenerationResult,
} from '@/lib/providers/provider-manager';
import {
  GenerationOptions,
  ImageProvider,
  ProviderName,
  ProviderResult,
} from '@/lib/providers/types';
import {StylePreset} from '@/types';

// Arbitrary for style presets
const styleArb = fc.constantFrom(
  'default',
  'warm',
  'monochrome',
  'pastel',
) as fc.Arbitrary<StylePreset>;

// Arbitrary for prompts
const promptArb = fc.string({minLength: 1, maxLength: 200});

// Arbitrary for generation options
const optionsArb = fc.record({
  style: styleArb,
  negativePrompt: fc.option(fc.string({minLength: 1, maxLength: 100}), {
    nil: undefined,
  }),
  timeout: fc.option(fc.integer({min: 1000, max: 60000}), {nil: undefined}),
}) as fc.Arbitrary<GenerationOptions>;

// Arbitrary for base64 image data
const imageArb = fc.string({minLength: 10, maxLength: 100}).map((s) => {
  return `data:image/png;base64,${Buffer.from(s).toString('base64')}`;
});

// Arbitrary for error messages
const errorMessageArb = fc.string({minLength: 1, maxLength: 100});

// Arbitrary for retry times
const retryAfterArb = fc.integer({min: 1, max: 300});

/**
 * Mock provider that returns configured results
 */
class MockProvider implements ImageProvider {
  name: ProviderName;
  result: ProviderResult;

  constructor(name: ProviderName, result: ProviderResult) {
    this.name = name;
    this.result = result;
  }

  async generate(): Promise<ProviderResult> {
    return this.result;
  }
}

/**
 * Create a successful provider result
 */
function createSuccessResult(image: string): ProviderResult {
  return {success: true, image};
}

/**
 * Create a failed provider result with fallback
 */
function createFallbackError(
  message: string,
  retryAfter?: number,
): ProviderResult {
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message,
      retryAfter,
      shouldFallback: true,
    },
  };
}

/**
 * Simulates the API response transformation from GenerationResult
 * This mirrors the logic in app/api/generate/route.ts
 */
function transformToApiResponse(result: GenerationResult): {
  success: boolean;
  image?: string;
  provider?: ProviderName;
  fallbackUsed?: boolean;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
    primaryError?: string;
    fallbackError?: string;
  };
} {
  if (result.success && result.image) {
    return {
      success: true,
      image: result.image,
      provider: result.provider,
      fallbackUsed: result.fallbackAttempted ?? false,
    };
  }

  if (result.error) {
    if (result.error.code === 'DUAL_PROVIDER_FAILURE') {
      const dualError = result.error as DualProviderError;
      return {
        success: false,
        provider: result.provider,
        fallbackUsed: result.fallbackAttempted ?? false,
        error: {
          code: dualError.code,
          message: dualError.message,
          retryAfter: dualError.retryAfter,
          primaryError: dualError.primaryError,
          fallbackError: dualError.fallbackError,
        },
      };
    }

    return {
      success: false,
      provider: result.provider,
      fallbackUsed: result.fallbackAttempted ?? false,
      error: {
        code: result.error.code,
        message: result.error.message,
        retryAfter: result.error.retryAfter,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  };
}

describe('Property 3: Provider Metadata Always Present', () => {
  /**
   * Validates: Requirements 1.3, 5.1
   * For any successful generation result, the response should always include
   * a provider field with value "huggingface" or "cloudflare".
   */
  it('should include provider field on primary success', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        async (prompt, options, image) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createSuccessResult(image),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: Provider field should be present and valid
          expect(apiResponse.provider).toBeDefined();
          expect(['huggingface', 'cloudflare']).toContain(apiResponse.provider);
          expect(apiResponse.provider).toBe('huggingface');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include provider field on fallback success', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        errorMessageArb,
        async (prompt, options, image, errorMsg) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createFallbackError(errorMsg),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: Provider field should be present and indicate cloudflare
          expect(apiResponse.provider).toBeDefined();
          expect(['huggingface', 'cloudflare']).toContain(apiResponse.provider);
          expect(apiResponse.provider).toBe('cloudflare');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should have provider as huggingface or cloudflare only', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        fc.boolean(),
        async (prompt, options, image, primarySucceeds) => {
          const primaryResult = primarySucceeds
            ? createSuccessResult(image)
            : createFallbackError('error');

          const primaryProvider = new MockProvider(
            'huggingface',
            primaryResult,
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: Provider should only be one of the valid values
          if (apiResponse.success) {
            expect(apiResponse.provider).toMatch(/^(huggingface|cloudflare)$/);
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 9: Backward Compatibility', () => {
  /**
   * Validates: Requirements 5.3
   * For any successful generation response, all existing response fields
   * (success, image, error) should remain present and maintain their original types.
   */
  it('should always include success field as boolean', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        fc.boolean(),
        async (prompt, options, image, primarySucceeds) => {
          const primaryResult = primarySucceeds
            ? createSuccessResult(image)
            : createFallbackError('error');

          const primaryProvider = new MockProvider(
            'huggingface',
            primaryResult,
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: success field should always be present and boolean
          expect(apiResponse).toHaveProperty('success');
          expect(typeof apiResponse.success).toBe('boolean');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include image field as string on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        async (prompt, options, image) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createSuccessResult(image),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: image field should be present and string on success
          expect(apiResponse.success).toBe(true);
          expect(apiResponse).toHaveProperty('image');
          expect(typeof apiResponse.image).toBe('string');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include error field with code and message on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        errorMessageArb,
        async (prompt, options, primaryMsg, fallbackMsg) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createFallbackError(primaryMsg),
          );
          const fallbackProvider = new MockProvider('cloudflare', {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: fallbackMsg,
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: error field should have code and message on failure
          expect(apiResponse.success).toBe(false);
          expect(apiResponse).toHaveProperty('error');
          expect(apiResponse.error).toHaveProperty('code');
          expect(apiResponse.error).toHaveProperty('message');
          expect(typeof apiResponse.error?.code).toBe('string');
          expect(typeof apiResponse.error?.message).toBe('string');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include retryAfter as number when present', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        retryAfterArb,
        async (prompt, options, retryAfter) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: 'RATE_LIMIT',
              message: 'Rate limit exceeded',
              retryAfter,
              shouldFallback: false,
            },
          });
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult('image'),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: retryAfter should be number when present
          if (apiResponse.error?.retryAfter !== undefined) {
            expect(typeof apiResponse.error.retryAfter).toBe('number');
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should maintain original response structure with new fields added', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        async (prompt, options, image) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createSuccessResult(image),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: Original fields should be present
          expect(apiResponse).toHaveProperty('success');
          expect(apiResponse).toHaveProperty('image');

          // Property: New fields should also be present
          expect(apiResponse).toHaveProperty('provider');
          expect(apiResponse).toHaveProperty('fallbackUsed');

          // Property: Types should be correct
          expect(typeof apiResponse.success).toBe('boolean');
          expect(typeof apiResponse.image).toBe('string');
          expect(typeof apiResponse.provider).toBe('string');
          expect(typeof apiResponse.fallbackUsed).toBe('boolean');
        },
      ),
      {numRuns: 100},
    );
  });

  it('should include fallbackUsed field indicating fallback status', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        errorMessageArb,
        fc.boolean(),
        async (prompt, options, image, errorMsg, primarySucceeds) => {
          const primaryResult = primarySucceeds
            ? createSuccessResult(image)
            : createFallbackError(errorMsg);

          const primaryProvider = new MockProvider(
            'huggingface',
            primaryResult,
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: fallbackUsed should be boolean and reflect actual fallback status
          expect(apiResponse).toHaveProperty('fallbackUsed');
          expect(typeof apiResponse.fallbackUsed).toBe('boolean');

          if (primarySucceeds) {
            expect(apiResponse.fallbackUsed).toBe(false);
          } else {
            expect(apiResponse.fallbackUsed).toBe(true);
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('API Response Structure Consistency', () => {
  /**
   * Additional property tests for response structure consistency
   */
  it('should not include image field on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        errorMessageArb,
        async (prompt, options, primaryMsg, fallbackMsg) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createFallbackError(primaryMsg),
          );
          const fallbackProvider = new MockProvider('cloudflare', {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: fallbackMsg,
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: image should not be present on failure
          expect(apiResponse.success).toBe(false);
          expect(apiResponse.image).toBeUndefined();
        },
      ),
      {numRuns: 100},
    );
  });

  it('should not include error field on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        imageArb,
        async (prompt, options, image) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createSuccessResult(image),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);
          const apiResponse = transformToApiResponse(result);

          // Property: error should not be present on success
          expect(apiResponse.success).toBe(true);
          expect(apiResponse.error).toBeUndefined();
        },
      ),
      {numRuns: 100},
    );
  });
});
