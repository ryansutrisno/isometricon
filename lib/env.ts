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
 * Validate that all required environment variables are set
 * Call this at server startup
 */
export function validateEnv(): void {
  const required = ['HUGGINGFACE_API_KEY'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}`,
    );
  }
}
