/**
 * Feature: api-fallback-provider
 * Property 1: Primary Provider Always Attempted First
 * Property 2: No Fallback on Primary Success
 * Property 6: Parameter Preservation on Fallback
 * Property 7: Dual Failure Error Structure
 * Property 8: Minimum Retry Time on Dual Rate Limit
 * Validates: Requirements 1.1, 1.2, 3.1, 4.1, 4.2, 4.3
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {
  createProviderManagerWithProviders,
  DualProviderError,
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
  'kawaii',
  'minimalist',
  'retro',
  'neon',
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

// Arbitrary for retry times
const retryAfterArb = fc.integer({min: 1, max: 300});

// Arbitrary for error messages
const errorMessageArb = fc.string({minLength: 1, maxLength: 100});

/**
 * Mock provider that tracks calls and returns configured results
 */
class MockProvider implements ImageProvider {
  name: ProviderName;
  calls: Array<{prompt: string; options: GenerationOptions}> = [];
  result: ProviderResult;

  constructor(name: ProviderName, result: ProviderResult) {
    this.name = name;
    this.result = result;
  }

  async generate(
    prompt: string,
    options: GenerationOptions,
  ): Promise<ProviderResult> {
    this.calls.push({prompt, options});
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
 * Create a failed provider result without fallback
 */
function createNonFallbackError(message: string): ProviderResult {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
      shouldFallback: false,
    },
  };
}

describe('Property 1: Primary Provider Always Attempted First', () => {
  /**
   * Validates: Requirements 1.1
   * For any valid generation request, the Provider Manager should always
   * attempt the Primary Provider (Hugging Face) before considering the Fallback Provider.
   */
  it('should always call primary provider first for any request', async () => {
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

          await manager.generate(prompt, options);

          // Property: Primary provider should always be called
          expect(primaryProvider.calls.length).toBeGreaterThanOrEqual(1);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should call primary provider before fallback provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorMsg, image) => {
          const callOrder: ProviderName[] = [];

          const primaryProvider: ImageProvider = {
            name: 'huggingface',
            async generate() {
              callOrder.push('huggingface');
              return createFallbackError(errorMsg);
            },
          };

          const fallbackProvider: ImageProvider = {
            name: 'cloudflare',
            async generate() {
              callOrder.push('cloudflare');
              return createSuccessResult(image);
            },
          };

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          await manager.generate(prompt, options);

          // Property: Primary provider should be called before fallback
          expect(callOrder[0]).toBe('huggingface');
          if (callOrder.length > 1) {
            expect(callOrder[1]).toBe('cloudflare');
          }
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 2: No Fallback on Primary Success', () => {
  /**
   * Validates: Requirements 1.2
   * For any generation request where the Primary Provider returns a successful response,
   * the Fallback Provider should never be invoked.
   */
  it('should never call fallback when primary succeeds', async () => {
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

          // Property: Fallback should never be called when primary succeeds
          expect(fallbackProvider.calls.length).toBe(0);
          expect(result.success).toBe(true);
          expect(result.provider).toBe('huggingface');
          expect(result.fallbackAttempted).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return primary provider image on success', async () => {
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
            createSuccessResult('different-image'),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Result should contain primary provider's image
          expect(result.image).toBe(image);
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 6: Parameter Preservation on Fallback', () => {
  /**
   * Validates: Requirements 3.1
   * For any fallback scenario, the exact same prompt and generation options
   * sent to the Primary Provider should be sent to the Fallback Provider.
   */
  it('should pass identical prompt to fallback provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorMsg, image) => {
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

          await manager.generate(prompt, options);

          // Property: Fallback should receive identical prompt
          expect(fallbackProvider.calls.length).toBe(1);
          expect(fallbackProvider.calls[0].prompt).toBe(prompt);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should pass identical options to fallback provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorMsg, image) => {
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

          await manager.generate(prompt, options);

          // Property: Fallback should receive identical options
          expect(fallbackProvider.calls.length).toBe(1);
          expect(fallbackProvider.calls[0].options).toEqual(options);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should preserve all option fields on fallback', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        styleArb,
        fc.string({minLength: 1, maxLength: 50}),
        fc.integer({min: 5000, max: 30000}),
        errorMessageArb,
        imageArb,
        async (prompt, style, negativePrompt, timeout, errorMsg, image) => {
          const options: GenerationOptions = {
            style,
            negativePrompt,
            timeout,
          };

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

          await manager.generate(prompt, options);

          // Property: All option fields should be preserved
          const fallbackOptions = fallbackProvider.calls[0].options;
          expect(fallbackOptions.style).toBe(style);
          expect(fallbackOptions.negativePrompt).toBe(negativePrompt);
          expect(fallbackOptions.timeout).toBe(timeout);
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 7: Dual Failure Error Structure', () => {
  /**
   * Validates: Requirements 4.1, 4.2
   * For any scenario where both Primary and Fallback Providers fail,
   * the error response should contain error details from both providers.
   */
  it('should include both error messages on dual failure', async () => {
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

          // Property: Result should contain both error messages
          expect(result.success).toBe(false);
          expect(result.fallbackAttempted).toBe(true);

          const error = result.error as DualProviderError;
          expect(error.code).toBe('DUAL_PROVIDER_FAILURE');
          expect(error.primaryError).toBe(primaryMsg);
          expect(error.fallbackError).toBe(fallbackMsg);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should have correct error structure on dual failure', async () => {
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
              code: 'TIMEOUT',
              message: fallbackMsg,
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Error should have all required fields
          const error = result.error as DualProviderError;
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('primaryError');
          expect(error).toHaveProperty('fallbackError');
          expect(error).toHaveProperty('shouldFallback');
          expect(error.shouldFallback).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });
});

describe('Property 8: Minimum Retry Time on Dual Rate Limit', () => {
  /**
   * Validates: Requirements 4.3
   * For any scenario where both providers fail with rate limit errors,
   * the returned retryAfter value should be the minimum of both providers' retry times.
   */
  it('should return minimum retry time when both have retry times', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        retryAfterArb,
        retryAfterArb,
        async (prompt, options, primaryRetry, fallbackRetry) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createFallbackError('Rate limit', primaryRetry),
          );
          const fallbackProvider = new MockProvider('cloudflare', {
            success: false,
            error: {
              code: 'RATE_LIMIT',
              message: 'Rate limit',
              retryAfter: fallbackRetry,
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: retryAfter should be minimum of both
          const error = result.error as DualProviderError;
          expect(error.retryAfter).toBe(Math.min(primaryRetry, fallbackRetry));
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return primary retry time when only primary has it', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        retryAfterArb,
        async (prompt, options, primaryRetry) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createFallbackError('Rate limit', primaryRetry),
          );
          const fallbackProvider = new MockProvider('cloudflare', {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Server error',
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: retryAfter should be primary's value
          const error = result.error as DualProviderError;
          expect(error.retryAfter).toBe(primaryRetry);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return fallback retry time when only fallback has it', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        retryAfterArb,
        async (prompt, options, fallbackRetry) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Server error',
              shouldFallback: true,
            },
          });
          const fallbackProvider = new MockProvider('cloudflare', {
            success: false,
            error: {
              code: 'RATE_LIMIT',
              message: 'Rate limit',
              retryAfter: fallbackRetry,
              shouldFallback: false,
            },
          });

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: retryAfter should be fallback's value
          const error = result.error as DualProviderError;
          expect(error.retryAfter).toBe(fallbackRetry);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return undefined when neither has retry time', async () => {
    await fc.assert(
      fc.asyncProperty(promptArb, optionsArb, async (prompt, options) => {
        const primaryProvider = new MockProvider('huggingface', {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Server error',
            shouldFallback: true,
          },
        });
        const fallbackProvider = new MockProvider('cloudflare', {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Server error',
            shouldFallback: false,
          },
        });

        const manager = createProviderManagerWithProviders(
          primaryProvider,
          fallbackProvider,
        );

        const result = await manager.generate(prompt, options);

        // Property: retryAfter should be undefined
        const error = result.error as DualProviderError;
        expect(error.retryAfter).toBeUndefined();
      }),
      {numRuns: 100},
    );
  });
});

describe('No Fallback on Non-Recoverable Primary Errors', () => {
  /**
   * Additional property: When primary fails with non-recoverable error,
   * fallback should not be attempted.
   */
  it('should not attempt fallback on non-recoverable primary error', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        async (prompt, options, errorMsg) => {
          const primaryProvider = new MockProvider(
            'huggingface',
            createNonFallbackError(errorMsg),
          );
          const fallbackProvider = new MockProvider(
            'cloudflare',
            createSuccessResult('image'),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            fallbackProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Fallback should not be called for non-recoverable errors
          expect(fallbackProvider.calls.length).toBe(0);
          expect(result.success).toBe(false);
          expect(result.fallbackAttempted).toBe(false);
          expect(result.provider).toBe('huggingface');
        },
      ),
      {numRuns: 100},
    );
  });
});
