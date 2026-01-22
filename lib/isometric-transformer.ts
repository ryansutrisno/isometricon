/**
 * Isometric Transformer
 * Canvas-based isometric transformation with 30° rotation, depth gradient, and shadow effects
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type {TransformOptions} from '@/types';

/**
 * Default transformation options
 */
const DEFAULT_OPTIONS: TransformOptions = {
  rotationAngle: 30,
  depthGradient: true,
  shadowEnabled: true,
  shadowOffset: {x: 10, y: 10},
};

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate isometric transformation matrix values
 * Isometric projection uses 30° rotation with specific scaling
 */
export function calculateIsometricMatrix(rotationAngle: number): {
  a: number;
  b: number;
  c: number;
  d: number;
} {
  const radians = degreesToRadians(rotationAngle);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Isometric transformation matrix:
  // [cos(θ)  -sin(θ)]
  // [sin(θ)/2  cos(θ)/2]
  // This creates the characteristic isometric "squash" effect
  return {
    a: cos,
    b: sin * 0.5,
    c: -sin,
    d: cos * 0.5,
  };
}

/**
 * Apply depth gradient overlay to canvas
 * Creates a subtle gradient from top-left to bottom-right for 3D depth effect
 */
function applyDepthGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Apply shadow effect to canvas
 * Creates elevation appearance with offset shadow
 */
function applyShadow(
  ctx: CanvasRenderingContext2D,
  shadowCtx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  offset: {x: number; y: number},
): void {
  // Create shadow by drawing a blurred, darkened version offset from original
  shadowCtx.filter = 'blur(8px)';
  shadowCtx.globalAlpha = 0.3;
  shadowCtx.drawImage(ctx.canvas, offset.x, offset.y);
  shadowCtx.filter = 'none';
  shadowCtx.globalAlpha = 1;
}

/**
 * Transform an image to isometric projection
 * Applies 30° rotation matrix, depth gradient overlay, and shadow effects
 *
 * @param imageData - Base64 encoded image string or HTMLImageElement
 * @param options - Transformation options (partial, merged with defaults)
 * @returns Promise<string> - Base64 encoded transformed image
 */
export async function transformToIsometric(
  imageData: string | HTMLImageElement,
  options?: Partial<TransformOptions>,
): Promise<string> {
  const opts: TransformOptions = {...DEFAULT_OPTIONS, ...options};

  // Load image if string provided
  const img = await loadImage(imageData);

  // Calculate output dimensions (isometric transform changes aspect ratio)
  const matrix = calculateIsometricMatrix(opts.rotationAngle);
  const outputWidth = Math.ceil(
    Math.abs(img.width * matrix.a) + Math.abs(img.height * matrix.c),
  );
  const outputHeight = Math.ceil(
    Math.abs(img.width * matrix.b) + Math.abs(img.height * matrix.d),
  );

  // Add padding for shadow
  const padding = opts.shadowEnabled
    ? Math.max(opts.shadowOffset.x, opts.shadowOffset.y) + 20
    : 0;
  const canvasWidth = outputWidth + padding * 2;
  const canvasHeight = outputHeight + padding * 2;

  // Create main canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Create shadow canvas if enabled
  let shadowCanvas: HTMLCanvasElement | null = null;
  let shadowCtx: CanvasRenderingContext2D | null = null;

  if (opts.shadowEnabled) {
    shadowCanvas = createCanvas(canvasWidth, canvasHeight);
    shadowCtx = shadowCanvas.getContext('2d');
  }

  // Center the transformation
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Apply isometric transformation
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  // Apply shadow effect
  if (opts.shadowEnabled && shadowCtx && shadowCanvas) {
    applyShadow(ctx, shadowCtx, canvasWidth, canvasHeight, opts.shadowOffset);

    // Composite shadow under main image
    const tempCanvas = createCanvas(canvasWidth, canvasHeight);
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(shadowCanvas, 0, 0);
      tempCtx.drawImage(canvas, 0, 0);

      // Copy back to main canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // Apply depth gradient overlay
  if (opts.depthGradient) {
    applyDepthGradient(ctx, canvasWidth, canvasHeight);
  }

  // Return as base64 PNG
  return canvas.toDataURL('image/png');
}

/**
 * Load image from base64 string or return existing HTMLImageElement
 */
async function loadImage(
  source: string | HTMLImageElement,
): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) {
    return source;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = source;
  });
}

/**
 * Create a canvas element (works in both browser and test environments)
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  // Check if we're in a browser environment
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  // For Node.js/test environment, throw error (tests should mock this)
  throw new Error('Canvas creation requires browser environment');
}

/**
 * Get transformation metadata for testing/verification
 */
export function getTransformationMetadata(rotationAngle: number = 30): {
  rotationAngle: number;
  rotationRadians: number;
  matrix: {a: number; b: number; c: number; d: number};
} {
  const radians = degreesToRadians(rotationAngle);
  const matrix = calculateIsometricMatrix(rotationAngle);

  return {
    rotationAngle,
    rotationRadians: radians,
    matrix,
  };
}
