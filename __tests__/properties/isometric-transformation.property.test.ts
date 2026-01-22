/**
 * Feature: ai-isometric-icon-generator
 * Property 6: Isometric Transformation Matrix
 * Validates: Requirements 5.1
 *
 * For any input image, the Isometric_Transformer SHALL apply a transformation
 * matrix that rotates the image by 30° around the isometric axis, such that
 * the output image dimensions and rotation angle are mathematically consistent
 * with isometric projection.
 */

import {
  calculateIsometricMatrix,
  getTransformationMetadata,
} from '@/lib/isometric-transformer';
import fc from 'fast-check';
import {describe, expect, it} from 'vitest';

describe('Property 6: Isometric Transformation Matrix', () => {
  const DEFAULT_ROTATION = 30;

  it('should calculate correct isometric matrix for any rotation angle', () => {
    fc.assert(
      fc.property(fc.integer({min: 0, max: 90}), (rotationAngle) => {
        const matrix = calculateIsometricMatrix(rotationAngle);
        const radians = (rotationAngle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        // Matrix should follow isometric transformation formula:
        // a = cos(θ), b = sin(θ)/2, c = -sin(θ), d = cos(θ)/2
        expect(matrix.a).toBeCloseTo(cos, 10);
        expect(matrix.b).toBeCloseTo(sin * 0.5, 10);
        expect(matrix.c).toBeCloseTo(-sin, 10);
        expect(matrix.d).toBeCloseTo(cos * 0.5, 10);
      }),
      {numRuns: 100},
    );
  });

  it('should use 30° as default rotation angle', () => {
    const metadata = getTransformationMetadata();

    expect(metadata.rotationAngle).toBe(DEFAULT_ROTATION);
    expect(metadata.rotationRadians).toBeCloseTo(
      (DEFAULT_ROTATION * Math.PI) / 180,
      10,
    );
  });

  it('should produce deterministic matrix for same rotation angle', () => {
    fc.assert(
      fc.property(fc.integer({min: 0, max: 360}), (rotationAngle) => {
        const matrix1 = calculateIsometricMatrix(rotationAngle);
        const matrix2 = calculateIsometricMatrix(rotationAngle);

        // Same input should produce identical output
        expect(matrix1.a).toBe(matrix2.a);
        expect(matrix1.b).toBe(matrix2.b);
        expect(matrix1.c).toBe(matrix2.c);
        expect(matrix1.d).toBe(matrix2.d);
      }),
      {numRuns: 100},
    );
  });

  it('should maintain mathematical consistency in transformation matrix', () => {
    fc.assert(
      fc.property(fc.integer({min: 0, max: 360}), (rotationAngle) => {
        const matrix = calculateIsometricMatrix(rotationAngle);

        // The matrix should preserve the relationship between components
        // For isometric: b = -c/2 (since b = sin/2 and c = -sin)
        expect(matrix.b).toBeCloseTo(-matrix.c / 2, 10);

        // And d = a/2 (since d = cos/2 and a = cos)
        expect(matrix.d).toBeCloseTo(matrix.a / 2, 10);
      }),
      {numRuns: 100},
    );
  });

  it('should produce identity-like matrix at 0° rotation', () => {
    const matrix = calculateIsometricMatrix(0);

    // At 0°: cos(0) = 1, sin(0) = 0
    // So: a = 1, b = 0, c = 0, d = 0.5
    expect(matrix.a).toBeCloseTo(1, 10);
    expect(matrix.b).toBeCloseTo(0, 10);
    expect(matrix.c).toBeCloseTo(0, 10);
    expect(matrix.d).toBeCloseTo(0.5, 10);
  });

  it('should produce correct matrix at 30° (standard isometric)', () => {
    const matrix = calculateIsometricMatrix(30);
    const cos30 = Math.cos((30 * Math.PI) / 180);
    const sin30 = Math.sin((30 * Math.PI) / 180);

    expect(matrix.a).toBeCloseTo(cos30, 10);
    expect(matrix.b).toBeCloseTo(sin30 * 0.5, 10);
    expect(matrix.c).toBeCloseTo(-sin30, 10);
    expect(matrix.d).toBeCloseTo(cos30 * 0.5, 10);
  });

  it('should return correct metadata for any rotation angle', () => {
    fc.assert(
      fc.property(fc.integer({min: 0, max: 360}), (rotationAngle) => {
        const metadata = getTransformationMetadata(rotationAngle);

        // Metadata should contain correct angle
        expect(metadata.rotationAngle).toBe(rotationAngle);

        // Radians should be correctly calculated
        expect(metadata.rotationRadians).toBeCloseTo(
          (rotationAngle * Math.PI) / 180,
          10,
        );

        // Matrix should match direct calculation
        const directMatrix = calculateIsometricMatrix(rotationAngle);
        expect(metadata.matrix.a).toBe(directMatrix.a);
        expect(metadata.matrix.b).toBe(directMatrix.b);
        expect(metadata.matrix.c).toBe(directMatrix.c);
        expect(metadata.matrix.d).toBe(directMatrix.d);
      }),
      {numRuns: 100},
    );
  });
});
