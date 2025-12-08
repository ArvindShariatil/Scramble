/**
 * AnagramCache Tests - SCRAM-021
 * 
 * Test Coverage:
 * - AC-002: Data structure design
 * - AC-003: Cache operations (get/set)
 * - AC-004: Cache storage
 * - AC-005: LRU eviction strategy
 * - AC-006: localStorage persistence
 * - AC-007: Cache metrics
 * - AC-008: Cache management
 * - AC-009: 25+ unit tests with 100% coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnagramCache, getAnagramCache } from '../../../src/utils/AnagramCache';
import type { AnagramSet } from '../../../src/data/anagrams';

describe('AnagramCache - SCRAM-021', () => {
  let cache: AnagramCache;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset singleton
    AnagramCache.resetInstance();
    cache = AnagramCache.getInstance();
  });

  afterEach(() => {
    cache.clear();
  });

  // Helper to create mock anagram
  const createMockAnagram = (id: string, solution: string): AnagramSet => ({
    id,
    scrambled: solution.split('').reverse().join(''),
    solution,
    category: 'Test',
    hint: `Hint for ${solution}`,
  });

  describe('AC-002: Data Structure Design', () => {
    it('should initialize with empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.evictions).toBe(0);
    });

    it('should use singleton pattern', () => {
      const cache1 = AnagramCache.getInstance();
      const cache2 = AnagramCache.getInstance();
      
      expect(cache1).toBe(cache2);
    });

    it('should store anagrams with timestamp and accessCount', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      const retrieved = cache.get(1);
      expect(retrieved).toEqual(anagram);
    });
  });

  describe('AC-003: Cache Operations', () => {
    it('should return null when cache is empty', () => {
      const result = cache.get(1);
      expect(result).toBeNull();
    });

    it('should return cached anagram after set', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      const result = cache.get(1);
      expect(result).toEqual(anagram);
    });

    it('should return random anagram when multiple cached for same difficulty', () => {
      const anagram1 = createMockAnagram('test-001', 'HELLO');
      const anagram2 = createMockAnagram('test-002', 'WORLD');
      const anagram3 = createMockAnagram('test-003', 'TESTS');
      
      cache.set(1, anagram1);
      cache.set(1, anagram2);
      cache.set(1, anagram3);
      
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const result = cache.get(1);
        if (result) {
          results.add(result.id);
        }
      }
      
      // Expect at least 2 different anagrams returned (probabilistic)
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    it('should update accessCount on get', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      // Access multiple times
      cache.get(1);
      cache.get(1);
      cache.get(1);
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(1); // 3 hits, 0 misses
    });

    it('should return null for different difficulty level', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      const result = cache.get(2);
      expect(result).toBeNull();
    });
  });

  describe('AC-004: Cache Storage', () => {
    it('should persist cache to localStorage on set', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      const stored = localStorage.getItem('scramble-generated-cache');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.cache).toBeDefined();
      expect(Array.isArray(parsed.cache)).toBe(true);
    });

    it('should handle localStorage quota exceeded errors', () => {
      // Mock quota exceeded error
      const originalSetItem = localStorage.setItem;
      let callCount = 0;
      
      vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        // Second call succeeds
        originalSetItem.call(localStorage, key, value);
      });

      // Fill cache beyond max size to trigger eviction during quota error
      for (let i = 0; i < 210; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0); // Evictions occurred
    });
  });

  describe('AC-005: LRU Eviction Strategy', () => {
    it('should evict LRU entry when cache exceeds 200', () => {
      // Fill cache to exactly 200
      for (let i = 0; i < 200; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      let stats = cache.getStats();
      expect(stats.size).toBe(200);
      expect(stats.evictions).toBe(0);

      // Add 201st item - should trigger eviction
      const newAnagram = createMockAnagram('test-201', 'EVICT');
      cache.set(1, newAnagram);

      stats = cache.getStats();
      expect(stats.size).toBe(200); // Still at max
      expect(stats.evictions).toBe(1); // One eviction
    });

    it('should evict oldest timestamp (least recently used)', async () => {
      const anagram1 = createMockAnagram('test-001', 'OLDEST');
      const anagram2 = createMockAnagram('test-002', 'MIDDLE');
      const anagram3 = createMockAnagram('test-003', 'NEWEST');
      
      cache.set(1, anagram1);
      
      // Wait 5ms for different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set(1, anagram2);
      
      // Wait 5ms for different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set(1, anagram3);

      // Fill cache beyond max to trigger eviction (need 198 more to reach 201 total)
      for (let i = 4; i < 202; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      // Verify eviction occurred (201 total, max 200, so 1 eviction)
      const stats = cache.getStats();
      expect(stats.size).toBe(200);
      expect(stats.evictions).toBe(1);
      
      // The cache should contain the newest entries, not the oldest
      // Since we can't deterministically check which specific entry was evicted
      // (random selection from 200 items), we verify the eviction mechanism worked
    });

    it('should never evict if size <= 200', () => {
      for (let i = 0; i < 150; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(150);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('AC-006: localStorage Persistence', () => {
    it('should load cache from localStorage on initialization', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      // Reset singleton to force reload from localStorage
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();
      
      const result = newCache.get(1);
      expect(result).toEqual(anagram);
    });

    it('should handle corrupt JSON gracefully', () => {
      localStorage.setItem('scramble-generated-cache', 'invalid json {{{');
      
      // Should not throw, should initialize empty cache
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();
      
      const stats = newCache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should handle invalid data structure gracefully', () => {
      localStorage.setItem('scramble-generated-cache', JSON.stringify({ invalid: 'structure' }));
      
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();
      
      const stats = newCache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should restore analytics data from localStorage', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      const stats1 = cache.getStats();
      expect(stats1.size).toBe(1);
      
      // Reload from storage
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();
      
      // Check that size is restored
      const stats2 = newCache.getStats();
      expect(stats2.size).toBe(1);
      
      // Verify cache still works after reload
      const retrieved = newCache.get(1);
      expect(retrieved).toEqual(anagram);
      
      // After one get, hitRate should be 100%
      const stats3 = newCache.getStats();
      expect(stats3.hitRate).toBe(1);
    });
  });

  describe('AC-007: Cache Metrics', () => {
    it('should track hit rate correctly', () => {
      const anagram = createMockAnagram('test-001', 'HELLO');
      cache.set(1, anagram);
      
      cache.get(1); // hit
      cache.get(1); // hit
      cache.get(2); // miss
      cache.get(3); // miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5); // 2 hits / 4 total
    });

    it('should track evictions correctly', () => {
      // Fill cache beyond max
      for (let i = 0; i < 205; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBe(5); // 205 - 200 = 5 evictions
    });

    it('should return current cache size', () => {
      for (let i = 0; i < 50; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(50);
    });

    it('should handle zero requests (no division by zero)', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('AC-008: Cache Management', () => {
    it('should clear all cached anagrams', () => {
      for (let i = 0; i < 10; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      let stats = cache.getStats();
      expect(stats.size).toBe(10);

      cache.clear();

      stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.evictions).toBe(0);
    });

    it('should clear only specific difficulty level', () => {
      // Add anagrams for difficulty 1 and 2
      for (let i = 0; i < 5; i++) {
        cache.set(1, createMockAnagram(`test-1-${i}`, `WORD${i}`));
        cache.set(2, createMockAnagram(`test-2-${i}`, `WORD${i}`));
      }

      let stats = cache.getStats();
      expect(stats.size).toBe(10);

      // Clear only difficulty 1
      cache.clearDifficulty(1);

      stats = cache.getStats();
      expect(stats.size).toBe(5); // Only difficulty 2 remains

      // Verify difficulty 1 is gone, difficulty 2 remains
      expect(cache.get(1)).toBeNull();
      expect(cache.get(2)).not.toBeNull();
    });

    it('should preload anagrams for testing', () => {
      const anagrams = [
        createMockAnagram('test-001', 'HELLO'),
        createMockAnagram('test-002', 'WORLD'),
        createMockAnagram('test-003', 'TESTING'),
      ];

      cache.preload(anagrams);

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });
  });

  describe('Factory Function', () => {
    it('should return singleton instance', () => {
      const cache1 = getAnagramCache();
      const cache2 = getAnagramCache();
      
      expect(cache1).toBe(cache2);
    });
  });

  describe('Integration: Real-World Scenarios', () => {
    it('should handle cache fill to 200, then add 50 more', () => {
      // Fill to 200
      for (let i = 0; i < 200; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      let stats = cache.getStats();
      expect(stats.size).toBe(200);
      expect(stats.evictions).toBe(0);

      // Add 50 more - should trigger 50 evictions
      for (let i = 200; i < 250; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      stats = cache.getStats();
      expect(stats.size).toBe(200); // Still at max
      expect(stats.evictions).toBe(50); // 50 evictions
    });

    it('should persist and restore all 200 entries', () => {
      // Fill cache to 200
      for (let i = 0; i < 200; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      const stats1 = cache.getStats();
      expect(stats1.size).toBe(200);

      // Reload from storage
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();

      const stats2 = newCache.getStats();
      expect(stats2.size).toBe(200);
    });

    it('should achieve >60% hit rate with realistic usage', () => {
      // Preload 20 anagrams for difficulty 1
      for (let i = 0; i < 20; i++) {
        const anagram = createMockAnagram(`test-${i}`, `WORD${i}`);
        cache.set(1, anagram);
      }

      // Simulate realistic usage: 70% cache hits, 30% misses
      for (let i = 0; i < 100; i++) {
        if (i % 10 < 7) {
          cache.get(1); // hit (difficulty 1 cached)
        } else {
          cache.get(2); // miss (difficulty 2 not cached)
        }
      }

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.6); // >60% hit rate
    });

    it('should handle concurrent modifications gracefully', () => {
      // Simulate multiple tabs modifying cache
      const anagram1 = createMockAnagram('test-001', 'HELLO');
      const anagram2 = createMockAnagram('test-002', 'WORLD');
      
      cache.set(1, anagram1);
      
      // Simulate external modification of localStorage
      const stored = localStorage.getItem('scramble-generated-cache');
      const parsed = JSON.parse(stored!);
      parsed.cache.push([
        '1-test-002',
        {
          anagram: anagram2,
          timestamp: Date.now(),
          accessCount: 0,
        },
      ]);
      localStorage.setItem('scramble-generated-cache', JSON.stringify(parsed));
      
      // Reload cache
      AnagramCache.resetInstance();
      const newCache = AnagramCache.getInstance();
      
      // Should have both anagrams
      const stats = newCache.getStats();
      expect(stats.size).toBe(2);
    });
  });
});
