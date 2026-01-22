/**
 * Feature: ai-isometric-icon-generator
 * Property 10: History Persistence Round-Trip
 * Validates: Requirements 9.1, 9.6
 *
 * For any HistoryItem saved to localStorage, retrieving the history after a
 * simulated session reset SHALL return an array containing that item with
 * identical id, prompt, style, imageData, and createdAt values.
 */

import {historyManager} from '@/hooks/use-history';
import type {StoredHistory, StylePreset} from '@/types';
import fc from 'fast-check';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

// Mock localStorage for testing
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const STORAGE_KEY = 'isometric-generator-history';
const CURRENT_VERSION = 1;

// Arbitraries for generating test data
const stylePresetArb = fc.constantFrom<StylePreset>(
  'default',
  'warm',
  'monochrome',
  'pastel',
);

const historyItemArb = fc.record({
  id: fc
    .string({minLength: 1, maxLength: 50})
    .filter((s) => s.trim().length > 0),
  prompt: fc
    .string({minLength: 1, maxLength: 200})
    .filter((s) => s.trim().length > 0),
  style: stylePresetArb,
  imageData: fc.string({minLength: 10, maxLength: 1000}),
  createdAt: fc.integer({min: 0, max: Date.now() + 1000000}),
});

describe('Property 10: History Persistence Round-Trip', () => {
  let mockStorage: MockStorage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    // Save original and replace with mock
    originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it('should persist and retrieve a single history item with identical values', () => {
    fc.assert(
      fc.property(historyItemArb, (item) => {
        mockStorage.clear();

        // Save item to storage
        const data: StoredHistory = {
          version: CURRENT_VERSION,
          items: [item],
        };
        mockStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Simulate session reset by loading from storage
        const loaded = historyManager.load();

        // Verify the item was retrieved with identical values
        expect(loaded).toHaveLength(1);
        expect(loaded[0].id).toBe(item.id);
        expect(loaded[0].prompt).toBe(item.prompt);
        expect(loaded[0].style).toBe(item.style);
        expect(loaded[0].imageData).toBe(item.imageData);
        expect(loaded[0].createdAt).toBe(item.createdAt);
      }),
      {numRuns: 100},
    );
  });

  it('should persist and retrieve multiple history items in order', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArb, {minLength: 1, maxLength: 10}),
        (items) => {
          mockStorage.clear();

          // Save items to storage
          const data: StoredHistory = {
            version: CURRENT_VERSION,
            items,
          };
          mockStorage.setItem(STORAGE_KEY, JSON.stringify(data));

          // Simulate session reset by loading from storage
          const loaded = historyManager.load();

          // Verify all items were retrieved
          expect(loaded).toHaveLength(items.length);

          // Verify each item has identical values
          for (let i = 0; i < items.length; i++) {
            expect(loaded[i].id).toBe(items[i].id);
            expect(loaded[i].prompt).toBe(items[i].prompt);
            expect(loaded[i].style).toBe(items[i].style);
            expect(loaded[i].imageData).toBe(items[i].imageData);
            expect(loaded[i].createdAt).toBe(items[i].createdAt);
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should handle save and load round-trip correctly', () => {
    fc.assert(
      fc.property(
        fc.array(historyItemArb, {minLength: 0, maxLength: 5}),
        (items) => {
          mockStorage.clear();

          // Save using historyManager
          historyManager.save(items);

          // Load using historyManager
          const loaded = historyManager.load();

          // Verify round-trip preserves all data
          expect(loaded).toHaveLength(items.length);

          for (let i = 0; i < items.length; i++) {
            expect(loaded[i]).toEqual(items[i]);
          }
        },
      ),
      {numRuns: 100},
    );
  });

  it('should return empty array for empty or missing storage', () => {
    mockStorage.clear();
    const loaded = historyManager.load();
    expect(loaded).toEqual([]);
  });

  it('should return empty array for invalid JSON in storage', () => {
    mockStorage.setItem(STORAGE_KEY, 'invalid json {{{');
    const loaded = historyManager.load();
    expect(loaded).toEqual([]);
  });

  it('should return empty array for wrong version', () => {
    const data = {
      version: 999, // Wrong version
      items: [
        {
          id: '1',
          prompt: 'test',
          style: 'default',
          imageData: 'data',
          createdAt: 123,
        },
      ],
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const loaded = historyManager.load();
    expect(loaded).toEqual([]);
  });

  it('should generate unique IDs', () => {
    fc.assert(
      fc.property(fc.integer({min: 2, max: 20}), (count) => {
        const ids = new Set<string>();

        for (let i = 0; i < count; i++) {
          ids.add(historyManager.generateId());
        }

        // All generated IDs should be unique
        expect(ids.size).toBe(count);
      }),
      {numRuns: 50},
    );
  });
});
