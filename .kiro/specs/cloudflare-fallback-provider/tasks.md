# Implementation Plan: Cloudflare Fallback Provider

## Overview

Implementasi Cloudflare Workers AI sebagai fallback provider untuk image generation, menggantikan Puter yang hanya bisa berjalan di client-side. Implementasi mengikuti pola provider abstraction yang sudah ada.

## Tasks

- [x] 1. Update type definitions dan environment configuration
  - [x] 1.1 Update ProviderName type di `lib/providers/types.ts` untuk include 'cloudflare' dan remove 'puter'
    - Ubah type dari `'huggingface' | 'puter'` menjadi `'huggingface' | 'cloudflare'`
    - _Requirements: 7.4_
  - [x] 1.2 Add Cloudflare environment functions di `lib/env.ts`
    - Tambah `getCloudflareAccountId()` function
    - Tambah `getCloudflareApiToken()` function
    - Update `validateEnv()` untuk include Cloudflare variables
    - _Requirements: 2.1, 2.2_

- [x] 2. Implement CloudflareProvider class
  - [x] 2.1 Create `lib/providers/cloudflare-provider.ts` dengan basic structure
    - Implement ImageProvider interface
    - Set name property ke 'cloudflare'
    - Define constants untuk API URL dan default timeout
    - _Requirements: 1.1, 1.4_
  - [x] 2.2 Implement generate method dengan API call
    - Build prompt menggunakan buildPrompt function
    - Construct API URL dengan account ID
    - Send POST request dengan proper headers dan body
    - Handle timeout dengan AbortController
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3_
  - [x] 2.3 Implement response transformation
    - Create transformCloudflareResponse function
    - Extract base64 image dari response
    - Format sebagai data URL
    - Handle error responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 2.4 Implement error classification
    - Map HTTP status codes ke ProviderErrorCode
    - Parse Retry-After header
    - Set shouldFallback ke false untuk semua errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.4_
  - [x] 2.5 Write unit tests untuk CloudflareProvider
    - Test environment variable handling
    - Test HTTP error classification
    - Test timeout handling
    - Test response transformation
    - _Requirements: 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Checkpoint - Verify CloudflareProvider implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update ProviderManager untuk use Cloudflare
  - [x] 4.1 Update `lib/providers/provider-manager.ts`
    - Import createCloudflareProvider instead of createPuterProvider
    - Update createProviderManager function untuk use CloudflareProvider sebagai fallback
    - _Requirements: 7.1, 7.2_
  - [x] 4.2 Update types di `types/index.ts`
    - Update ProviderName type untuk include 'cloudflare'
    - _Requirements: 7.4, 8.4_
  - [x] 4.3 Write property test untuk fallback behavior
    - **Property 5: Fallback Trigger on Recoverable Errors**
    - **Validates: Requirements 7.3**

- [x] 5. Write property-based tests
  - [x] 5.1 Create `__tests__/properties/cloudflare-response-transformation.property.test.ts`
    - **Property 1: Response Transformation Produces Valid ProviderResult**
    - **Validates: Requirements 1.3, 4.1, 4.2, 4.3**
  - [x] 5.2 Write property test untuk data URL formatting
    - **Property 2: Data URL Format Consistency**
    - **Validates: Requirements 4.2**
  - [x] 5.3 Write property test untuk shouldFallback invariant
    - **Property 3: Fallback Provider Error Invariant**
    - **Validates: Requirements 4.4, 6.4**
  - [x] 5.4 Write property test untuk 5xx classification
    - **Property 4: 5xx Status Code Classification**
    - **Validates: Requirements 5.3**

- [x] 6. Cleanup dan documentation
  - [x] 6.1 Remove atau deprecate Puter provider files
    - Delete atau comment out `lib/providers/puter-provider.ts`
    - Update any imports yang reference Puter
    - _Requirements: 7.1_
  - [x] 6.2 Update environment example file
    - Add CLOUDFLARE_ACCOUNT_ID dan CLOUDFLARE_API_TOKEN ke `.env.example` atau `.env.local.example`
    - _Requirements: 2.1, 2.2_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify backward compatibility dengan existing API response structure
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
