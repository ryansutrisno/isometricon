# Requirements Document

## Introduction

This document defines the requirements for integrating Cloudflare Workers AI as a fallback image generation provider. The current system uses HuggingFace as the primary provider and Puter as the fallback. However, Puter only works client-side with a "User-Pays" model, making it unsuitable for server-side operations. Cloudflare Workers AI will replace Puter as the fallback provider, offering server-side image generation using the FLUX.1 schnell model.

## Glossary

- **Cloudflare_Provider**: The image generation provider implementation that interfaces with Cloudflare Workers AI REST API
- **Workers_AI**: Cloudflare's serverless AI inference platform that provides access to various AI models
- **FLUX_Schnell_Model**: The `@cf/black-forest-labs/flux-1-schnell` model available on Cloudflare Workers AI for fast image generation
- **Account_ID**: Cloudflare account identifier required for API authentication
- **API_Token**: Cloudflare API token with Workers AI permissions for authentication
- **Provider_Manager**: The component that orchestrates primary and fallback provider selection
- **ProviderResult**: The standardized response structure containing success status, image data, or error information
- **ImageProvider**: The interface contract that all image generation providers must implement

## Requirements

### Requirement 1: Cloudflare Provider Implementation

**User Story:** As a developer, I want a Cloudflare Workers AI provider that implements the existing ImageProvider interface, so that it can be used as a drop-in replacement for the Puter fallback provider.

#### Acceptance Criteria

1. THE Cloudflare_Provider SHALL implement the ImageProvider interface with name property set to 'cloudflare'
2. WHEN the generate method is called, THE Cloudflare_Provider SHALL accept prompt and GenerationOptions parameters
3. THE Cloudflare_Provider SHALL return a ProviderResult with success boolean, optional image string, and optional error object
4. THE Cloudflare_Provider SHALL use the FLUX_Schnell_Model (`@cf/black-forest-labs/flux-1-schnell`) for image generation

### Requirement 2: Cloudflare API Authentication

**User Story:** As a system administrator, I want the Cloudflare provider to authenticate securely using environment variables, so that credentials are not exposed in code.

#### Acceptance Criteria

1. THE Cloudflare_Provider SHALL read the Account_ID from the `CLOUDFLARE_ACCOUNT_ID` environment variable
2. THE Cloudflare_Provider SHALL read the API_Token from the `CLOUDFLARE_API_TOKEN` environment variable
3. IF the Account_ID environment variable is missing, THEN THE Cloudflare_Provider SHALL return an error with code 'SERVER_ERROR' and shouldFallback set to false
4. IF the API_Token environment variable is missing, THEN THE Cloudflare_Provider SHALL return an error with code 'SERVER_ERROR' and shouldFallback set to false

### Requirement 3: Cloudflare API Request Format

**User Story:** As a developer, I want the provider to correctly format requests to Cloudflare Workers AI API, so that image generation works reliably.

#### Acceptance Criteria

1. THE Cloudflare_Provider SHALL send POST requests to `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell`
2. THE Cloudflare_Provider SHALL include the Authorization header with format `Bearer {api_token}`
3. THE Cloudflare_Provider SHALL send the prompt in the request body as JSON with the `prompt` field
4. THE Cloudflare_Provider SHALL apply style transformations to the prompt using the existing buildPrompt function

### Requirement 4: Response Transformation

**User Story:** As a developer, I want Cloudflare API responses to be transformed to the standard ProviderResult format, so that the provider manager can process them consistently.

#### Acceptance Criteria

1. WHEN Cloudflare returns a successful response with image data, THE Cloudflare_Provider SHALL extract the base64 image from the response
2. WHEN Cloudflare returns image data, THE Cloudflare_Provider SHALL format it as a data URL with format `data:image/png;base64,{base64_data}`
3. WHEN Cloudflare returns an error response, THE Cloudflare_Provider SHALL transform it to a ProviderError with appropriate code and message
4. THE Cloudflare_Provider SHALL set shouldFallback to false on all errors since it is the fallback provider

### Requirement 5: Error Classification

**User Story:** As a developer, I want errors from Cloudflare to be properly classified, so that the system can provide appropriate user feedback.

#### Acceptance Criteria

1. WHEN Cloudflare returns HTTP 429, THE Cloudflare_Provider SHALL classify it as 'RATE_LIMIT' error
2. WHEN Cloudflare returns HTTP 401, THE Cloudflare_Provider SHALL classify it as 'UNAUTHORIZED' error
3. WHEN Cloudflare returns HTTP 500 or other 5xx status, THE Cloudflare_Provider SHALL classify it as 'SERVER_ERROR'
4. WHEN a network error or timeout occurs, THE Cloudflare_Provider SHALL classify it as 'TIMEOUT' error
5. WHEN Cloudflare returns HTTP 400, THE Cloudflare_Provider SHALL classify it as 'VALIDATION_ERROR'
6. IF the Retry-After header is present, THEN THE Cloudflare_Provider SHALL include the retryAfter value in the error

### Requirement 6: Timeout Handling

**User Story:** As a user, I want the provider to handle slow responses gracefully, so that I don't wait indefinitely for image generation.

#### Acceptance Criteria

1. THE Cloudflare_Provider SHALL support configurable timeout via GenerationOptions.timeout parameter
2. THE Cloudflare_Provider SHALL use a default timeout of 60000 milliseconds if not specified
3. WHEN a request exceeds the timeout, THE Cloudflare_Provider SHALL abort the request and return a timeout error
4. WHEN a timeout occurs, THE Cloudflare_Provider SHALL return error code 'TIMEOUT' with shouldFallback set to false

### Requirement 7: Provider Manager Integration

**User Story:** As a developer, I want the provider manager to use Cloudflare instead of Puter as the fallback provider, so that server-side fallback works correctly.

#### Acceptance Criteria

1. THE Provider_Manager SHALL use Cloudflare_Provider as the fallback provider instead of Puter
2. THE Provider_Manager SHALL maintain HuggingFace as the primary provider
3. WHEN the primary provider fails with shouldFallback true, THE Provider_Manager SHALL attempt generation with Cloudflare_Provider
4. THE ProviderName type SHALL be updated to include 'cloudflare' and remove 'puter'

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the API response structure to remain unchanged, so that existing client code continues to work.

#### Acceptance Criteria

1. THE GenerationResult structure SHALL remain unchanged with success, image, provider, error, and fallbackAttempted fields
2. THE ProviderResult structure SHALL remain unchanged with success, image, and error fields
3. THE ProviderError structure SHALL remain unchanged with code, message, retryAfter, and shouldFallback fields
4. WHEN Cloudflare is used as fallback, THE GenerationResult.provider field SHALL contain 'cloudflare'
