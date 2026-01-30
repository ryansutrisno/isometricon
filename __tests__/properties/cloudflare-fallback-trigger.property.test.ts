/**
 * Feature: cloudflare-fallback-provider
 * Property 5: Fallback Trigger on Recoverable Errors
 * Validates: Requirements 7.3
 *
 * For any primary provider failure where shouldFallback is true,
 * the ProviderManager SHALL attempt generation with the CloudflareProvider
 * using the same prompt and options.
 */

import * as fc from 'fast-check';
import {describe, expect, it} from 'vitest';

import {createProviderManagerWithProviders} from '@/lib/providers/provider-manager';
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

// Arbitrary for recoverable error codes that should trigger fallback
const recoverableErrorCodeArb = fc.constantFrom(
  'RATE_LIMIT',
  'TIMEOUT',
  'SERVICE_UNAVAILABLE',
  'SERVER_ERROR',
  'PAYMENT_REQUIRED',
) as fc.Arbitrary<
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'PAYMENT_REQUIRED'
>;

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

describe('Property 5: Fallback Trigger on Recoverable Errors', () => {
  /**
   * Validates: Requirements 7.3
   * For any primary provider failure where shouldFallback is true,
   * the ProviderManager SHALL attempt generation with the CloudflareProvider
   * using the same prompt and options.
   */
  it('should trigger Cloudflare fallback when primary fails with shouldFallback=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        recoverableErrorCodeArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorCode, errorMsg, image) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: errorCode,
              message: errorMsg,
              shouldFallback: true,
            },
          });

          const cloudflareProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            cloudflareProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Cloudflare fallback should be called
          expect(cloudflareProvider.calls.length).toBe(1);
          expect(result.fallbackAttempted).toBe(true);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should pass identical prompt to Cloudflare fallback', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        recoverableErrorCodeArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorCode, errorMsg, image) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: errorCode,
              message: errorMsg,
              shouldFallback: true,
            },
          });

          const cloudflareProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            cloudflareProvider,
          );

          await manager.generate(prompt, options);

          // Property: Cloudflare should receive identical prompt
          expect(cloudflareProvider.calls[0].prompt).toBe(prompt);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should pass identical options to Cloudflare fallback', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        recoverableErrorCodeArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorCode, errorMsg, image) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: errorCode,
              message: errorMsg,
              shouldFallback: true,
            },
          });

          const cloudflareProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            cloudflareProvider,
          );

          await manager.generate(prompt, options);

          // Property: Cloudflare should receive identical options
          expect(cloudflareProvider.calls[0].options).toEqual(options);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return Cloudflare as provider when fallback succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        recoverableErrorCodeArb,
        errorMessageArb,
        imageArb,
        async (prompt, options, errorCode, errorMsg, image) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: errorCode,
              message: errorMsg,
              shouldFallback: true,
            },
          });

          const cloudflareProvider = new MockProvider(
            'cloudflare',
            createSuccessResult(image),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            cloudflareProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Provider should be 'cloudflare' when fallback succeeds
          expect(result.success).toBe(true);
          expect(result.provider).toBe('cloudflare');
          expect(result.image).toBe(image);
        },
      ),
      {numRuns: 100},
    );
  });

  it('should NOT trigger fallback when primary fails with shouldFallback=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        promptArb,
        optionsArb,
        errorMessageArb,
        async (prompt, options, errorMsg) => {
          const primaryProvider = new MockProvider('huggingface', {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: errorMsg,
              shouldFallback: false,
            },
          });

          const cloudflareProvider = new MockProvider(
            'cloudflare',
            createSuccessResult('image'),
          );

          const manager = createProviderManagerWithProviders(
            primaryProvider,
            cloudflareProvider,
          );

          const result = await manager.generate(prompt, options);

          // Property: Cloudflare should NOT be called when shouldFallback is false
          expect(cloudflareProvider.calls.length).toBe(0);
          expect(result.fallbackAttempted).toBe(false);
          expect(result.success).toBe(false);
        },
      ),
      {numRuns: 100},
    );
  });
});
