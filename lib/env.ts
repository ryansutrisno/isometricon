/**
 * Environment configuration
 * Server-side only - never expose to client
 */

export function getHuggingFaceApiKey(): string {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'HUGGINGFACE_API_KEY is not configured. Please set it in .env.local',
    );
  }

  return apiKey;
}

/**
 * Get Cloudflare Account ID from environment
 * Requirements: 2.1
 */
export function getCloudflareAccountId(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID is not configured. Please set it in .env.local',
    );
  }

  return accountId;
}

/**
 * Get Cloudflare API Token from environment
 * Requirements: 2.2
 */
export function getCloudflareApiToken(): string {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN is not configured. Please set it in .env.local',
    );
  }

  return apiToken;
}

/**
 * Validate that all required environment variables are set
 * Call this at server startup
 */
export function validateEnv(): void {
  const required = [
    'HUGGINGFACE_API_KEY',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}`,
    );
  }
}
