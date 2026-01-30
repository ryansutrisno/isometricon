# Implementation Plan: API Fallback Provider

## Overview

Implementasi fallback mechanism untuk image generation API. Ketika Hugging Face API mengalami rate limit atau error, sistem akan otomatis switch ke Puter API sebagai backup provider.

## Tasks

- [x] 1. Create provider types and interfaces
  - [x] 1.1 Create provider types in `lib/providers/types.ts`
    - Define `ProviderName`, `ProviderError`, `ProviderResult`, `GenerationOptions` interfaces
    - Define `ImageProvider` interface with `generate` method
    - Define error codes and `shouldFallback` classification
    - _Requirements: 1.3, 2.1-2.6, 5.1_

  - [x] 1.2 Write property test for error classification
    - **Property 4: Fallback Triggered on Recoverable Errors**
    - **Property 5: No Fallback on Non-Recoverable Errors**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

- [x] 2. Implement Hugging Face Provider
  - [x] 2.1 Create `lib/providers/huggingface-provider.ts`
    - Extract existing Hugging Face logic from `app/api/generate/route.ts`
    - Implement `ImageProvider` interface
    - Add `shouldFallback` flag to error responses
    - _Requirements: 1.1, 1.2, 2.1-2.6_

  - [x] 2.2 Write unit tests for Hugging Face provider error mapping
    - Test HTTP status to error code mapping
    - Test `shouldFallback` flag for each error type
    - _Requirements: 2.1-2.6_

- [x] 3. Implement Puter Provider
  - [x] 3.1 Create `lib/providers/puter-provider.ts`
    - Implement `ImageProvider` interface for Puter API
    - Use Puter's `flux-schnell` model for consistency with Hugging Face
    - Handle Puter-specific response format and convert to `ProviderResult`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2_

  - [x] 3.2 Write property test for Puter response transformation
    - **Property 10: Puter Response Transformation**
    - **Validates: Requirements 6.2**

- [x] 4. Implement Provider Manager
  - [x] 4.1 Create `lib/providers/provider-manager.ts`
    - Implement sequential fallback logic
    - Try primary provider first, fallback on recoverable errors
    - Combine errors when both providers fail
    - Calculate minimum retry time for dual rate limits
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 4.2, 4.3_

  - [x] 4.2 Write property tests for Provider Manager
    - **Property 1: Primary Provider Always Attempted First**
    - **Property 2: No Fallback on Primary Success**
    - **Property 6: Parameter Preservation on Fallback**
    - **Property 7: Dual Failure Error Structure**
    - **Property 8: Minimum Retry Time on Dual Rate Limit**
    - **Validates: Requirements 1.1, 1.2, 3.1, 4.1, 4.2, 4.3**

- [x] 5. Checkpoint - Ensure provider layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update API route to use Provider Manager
  - [x] 6.1 Refactor `app/api/generate/route.ts`
    - Replace direct Hugging Face calls with Provider Manager
    - Add `provider` field to response
    - Add `fallbackUsed` field to response
    - Maintain backward compatibility with existing response structure
    - _Requirements: 1.3, 5.1, 5.3_

  - [x] 6.2 Write property test for API response structure
    - **Property 3: Provider Metadata Always Present**
    - **Property 9: Backward Compatibility**
    - **Validates: Requirements 1.3, 5.1, 5.3**

- [x] 7. Update types for extended response
  - [x] 7.1 Update `types/index.ts`
    - Add `provider` field to `GenerateResponse`
    - Add `fallbackUsed` field to `GenerateResponse`
    - Add `primaryError` and `fallbackError` to `GenerationError`
    - _Requirements: 4.2, 5.1, 5.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Puter API uses client-side puter.js, so server implementation will use fetch to Puter's REST endpoint
