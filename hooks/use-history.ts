'use client';

import type {HistoryItem, StoredHistory, StylePreset} from '@/types';
import {useCallback, useEffect, useState} from 'react';

const STORAGE_KEY = 'isometric-generator-history';
const CURRENT_VERSION = 1;

/**
 * History Manager Hook
 * Manages generation history with localStorage persistence
 * Requirements: 9.1, 9.2, 9.5, 9.6
 */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadFromStorage(): HistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: StoredHistory = JSON.parse(stored);

    // Version check for future migrations
    if (parsed.version !== CURRENT_VERSION) {
      // Handle migration if needed in future versions
      return [];
    }

    return parsed.items || [];
  } catch {
    // If parsing fails, return empty array
    return [];
  }
}

function saveToStorage(items: HistoryItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const data: StoredHistory = {
      version: CURRENT_VERSION,
      items,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is full or unavailable
    console.warn('Failed to save history to localStorage');
  }
}

export interface UseHistoryReturn {
  items: HistoryItem[];
  addItem: (item: {
    prompt: string;
    style: StylePreset;
    imageData: string;
  }) => HistoryItem;
  removeItem: (id: string) => void;
  clearHistory: () => void;
  getAll: () => HistoryItem[];
}

export function useHistory(): UseHistoryReturn {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setItems(loaded);
    setIsInitialized(true);
  }, []);

  // Save to localStorage when items change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveToStorage(items);
    }
  }, [items, isInitialized]);

  const getAll = useCallback((): HistoryItem[] => {
    return items;
  }, [items]);

  const addItem = useCallback(
    (item: {
      prompt: string;
      style: StylePreset;
      imageData: string;
    }): HistoryItem => {
      const newItem: HistoryItem = {
        id: generateId(),
        prompt: item.prompt,
        style: item.style,
        imageData: item.imageData,
        createdAt: Date.now(),
      };

      setItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [],
  );

  const removeItem = useCallback((id: string): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback((): void => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearHistory,
    getAll,
  };
}

// Export standalone functions for non-React usage (e.g., testing)
export const historyManager = {
  load: loadFromStorage,
  save: saveToStorage,
  generateId,
};
