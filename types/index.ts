/**
 * Core Types for AI Isometric Icon Generator
 * Requirements: 3.1
 */

/**
 * Style preset options for icon generation
 */
export type StylePreset = 'default' | 'warm' | 'monochrome' | 'pastel';

/**
 * Configuration for each style preset
 */
export interface StyleConfig {
  name: string;
  colors: [string, string];
  promptSuffix: string;
}

/**
 * Style preset configurations
 */
export const STYLE_CONFIGS: Record<StylePreset, StyleConfig> = {
  default: {
    name: 'Default',
    colors: ['#6366f1', '#3b82f6'],
    promptSuffix: 'blue tones',
  },
  warm: {
    name: 'Warm',
    colors: ['#f97316', '#ef4444'],
    promptSuffix: 'warm orange and red tones',
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#6b7280', '#374151'],
    promptSuffix: 'grayscale monochrome',
  },
  pastel: {
    name: 'Pastel',
    colors: ['#f9a8d4', '#a5b4fc'],
    promptSuffix: 'soft pastel colors',
  },
};

/**
 * Error codes for generation failures
 */
export type ErrorCode =
  | 'RATE_LIMIT'
  | 'SERVICE_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT';

/**
 * Generation error structure
 */
export interface GenerationError {
  code: ErrorCode;
  message: string;
  retryAfter?: number;
}

/**
 * History item for past generations
 */
export interface HistoryItem {
  id: string;
  prompt: string;
  style: StylePreset;
  imageData: string; // Base64 PNG
  createdAt: number; // Unix timestamp
}

/**
 * Generator component state
 */
export interface GeneratorState {
  prompt: string;
  style: StylePreset;
  isGenerating: boolean;
  generatedImage: string | null;
  error: GenerationError | null;
  progress: number; // 0-100
}

/**
 * API request for image generation
 */
export interface GenerateRequest {
  prompt: string;
  style: StylePreset;
}

/**
 * API response for image generation
 */
export interface GenerateResponse {
  success: boolean;
  image?: string; // Base64 encoded
  error?: GenerationError;
}

/**
 * localStorage schema for history
 */
export interface StoredHistory {
  version: 1;
  items: HistoryItem[];
}

/**
 * localStorage schema for rate limit
 */
export interface StoredRateLimit {
  count: number;
  windowStart: number; // Unix timestamp
}

/**
 * Isometric transformation options
 */
export interface TransformOptions {
  rotationAngle: number; // Default: 30
  depthGradient: boolean;
  shadowEnabled: boolean;
  shadowOffset: {x: number; y: number};
}
