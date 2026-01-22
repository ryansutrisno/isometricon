/**
 * Input Utilities for AI Isometric Icon Generator
 * Handles input sanitization, validation, and character limit enforcement
 * Requirements: 2.2, 2.4, 2.5
 */

const MAX_PROMPT_LENGTH = 200;

/**
 * Sanitizes user input to prevent XSS attacks
 * Escapes HTML special characters and removes dangerous patterns
 * Requirements: 2.5
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove data: URLs that could contain scripts
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');

  return sanitized;
}

/**
 * Validates that a prompt is not empty or whitespace-only
 * Requirements: 2.4
 */
export function isValidPrompt(prompt: string): boolean {
  if (typeof prompt !== 'string') {
    return false;
  }

  // Trim and check if empty
  const trimmed = prompt.trim();
  return trimmed.length > 0;
}

/**
 * Enforces character limit on input
 * Returns truncated string if exceeds limit
 * Requirements: 2.2
 */
export function enforceCharacterLimit(
  input: string,
  limit: number = MAX_PROMPT_LENGTH,
): string {
  if (typeof input !== 'string') {
    return '';
  }

  if (input.length <= limit) {
    return input;
  }

  return input.slice(0, limit);
}

/**
 * Calculates remaining characters
 * Requirements: 2.3
 */
export function calculateRemaining(
  input: string,
  limit: number = MAX_PROMPT_LENGTH,
): number {
  if (typeof input !== 'string') {
    return limit;
  }

  const currentLength = Math.min(input.length, limit);
  return limit - currentLength;
}

/**
 * Combined validation and sanitization for prompt input
 * Returns sanitized, length-enforced input and validation result
 */
export function processPromptInput(input: string): {
  sanitized: string;
  isValid: boolean;
  remaining: number;
} {
  const sanitized = sanitizeInput(input);
  const limited = enforceCharacterLimit(sanitized);
  const isValid = isValidPrompt(limited);
  const remaining = calculateRemaining(limited);

  return {
    sanitized: limited,
    isValid,
    remaining,
  };
}

export {MAX_PROMPT_LENGTH};
