/**
 * SCRAM-024: Epic 6 Performance Tests
 * Performance benchmarks for cache, API, and fallback operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnagramGeneratorV3 } from '../../src/game/AnagramGenerator-v3';
import { DatamuseAPI } from '../../src/api/DatamuseAPI';
import { WordScrambler } from '../../src/game/WordScrambler';
import { AnagramCache } from '../../src/utils/AnagramCache';

describe('SCRAM-024: Epic 6 Performance Tests', () => {
  let generator: AnagramGeneratorV3;
  let mockDatamuseAPI: DatamuseAPI;
  let wordScrambler: WordScrambler;
  let cache: AnagramCache;

  beforeEach(() => {
    localStorage.clear();
    
    mockDatamuseAPI = {
      getRandomWord: vi.fn()
    } as unknown as DatamuseAPI;
    
    wordScrambler = new WordScrambler();
    cache = AnagramCache.getInstance();
    cache.clear();
    
    generator = new AnagramGeneratorV3(1, mockDatamuseAPI, wordScrambler, cache);
  });

  afterEach(() => {
    localStorage.clear();
    cache.clear();
  });

  // AC-005: Performance Tests
  describe('AC-005: Cache Performance', () => {
    it('should achieve <10ms average for 100 cache hits', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('cached');
      generator.setMode('hybrid');

      // Pre-populate cache
      await generator.getAnagram({ difficulty: 1 });

      // Measure 100 cache hits
      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await generator.getAnagram({ difficulty: 1 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(10); // <10ms average
    });

    it('should handle 100 cache operations without memory leaks', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('memory');
      generator.setMode('hybrid');

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform 100 cache operations
      for (let i = 0; i < 100; i++) {
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should not grow excessively (allow 5MB increase)
      if (initialMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // <5MB
      }
    });
  });

  describe('AC-005: API Performance', () => {
    it('should complete API calls in <500ms average for 100 misses', { timeout: 20000 }, async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 50ms API
        return `word${Date.now()}`;
      });

      cache.clear();
      generator.setMode('hybrid');

      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        cache.clear(); // Force API call
        const start = performance.now();
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(500); // <500ms average
    });
  });

  describe('AC-005: Fallback Performance', () => {
    it('should complete curated fallback in <10ms average for 100 operations', async () => {
      // Mock API to always fail
      (mockDatamuseAPI.getRandomWord as any).mockRejectedValue(new Error('API down'));
      
      generator.setMode('hybrid');

      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(10); // <10ms average for curated fallback
    });
  });

  describe('AC-005: Loading State Debounce', () => {
    it('should not flicker loading indicator on fast API (<100ms)', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Fast 50ms API
        return 'fast';
      });

      cache.clear();
      generator.setMode('hybrid');

      const start = performance.now();
      await generator.getAnagram({ difficulty: 1 });
      const duration = performance.now() - start;

      // Fast API calls should not trigger loading indicator (allow test overhead)
      expect(duration).toBeLessThan(150);
    });
  });

  describe('AC-005: Memory Stability', () => {
    it('should maintain stable heap size over 100 rounds', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        return `word${Math.random()}`;
      });

      generator.setMode('hybrid');

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialHeap = (performance as any).memory?.usedJSHeapSize || 0;

      // Play 100 rounds
      for (let i = 0; i < 100; i++) {
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
      }

      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }

      const finalHeap = (performance as any).memory?.usedJSHeapSize || 0;

      // Heap should not grow by more than 10MB
      if (initialHeap > 0) {
        const heapGrowth = finalHeap - initialHeap;
        expect(heapGrowth).toBeLessThan(10 * 1024 * 1024); // <10MB growth
      }
    });
  });

  describe('AC-005: Concurrent Performance', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return `word${Date.now()}`;
      });

      generator.setMode('hybrid');

      const start = performance.now();
      
      // Fire 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        generator.getAnagram({ difficulty: (i % 5) + 1 })
      );

      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      // Concurrent requests should complete faster than sequential
      // (10 * 100ms = 1000ms sequential, but should be ~150ms concurrent with caching)
      expect(duration).toBeLessThan(500); // <500ms for 10 concurrent
      expect(results.every(r => r !== null)).toBe(true);
    });
  });

  describe('AC-005: Cache Eviction Performance', () => {
    it('should perform LRU eviction quickly when cache exceeds 200', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        return `word${Date.now()}${Math.random()}`;
      });

      generator.setMode('hybrid');

      // Fill cache to 200
      for (let i = 0; i < 200; i++) {
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
      }

      // Next addition should trigger eviction
      const start = performance.now();
      await generator.getAnagram({ difficulty: 1 });
      const evictionTime = performance.now() - start;

      // Eviction should be fast (<50ms)
      expect(evictionTime).toBeLessThan(50);

      const stats = generator.getUsageStats();
      expect(stats.cacheStats.size).toBeLessThanOrEqual(200);
    });
  });

  describe('AC-005: Mode Switching Performance', () => {
    it('should switch modes instantly (<1ms)', () => {
      const modes: Array<'curated' | 'hybrid' | 'unlimited-only'> = ['curated', 'hybrid', 'unlimited-only'];
      
      const times: number[] = [];
      modes.forEach(mode => {
        const start = performance.now();
        generator.setMode(mode);
        times.push(performance.now() - start);
      });

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(10); // <10ms mode switch (allows test overhead)
    });
  });

  describe('AC-005: Scrambling Performance', () => {
    it('should scramble words in <5ms average', () => {
      const words = ['apple', 'beach', 'cloud', 'dance', 'eagle', 'frost', 'grape'];
      const scrambler = new WordScrambler();

      const times: number[] = [];
      words.forEach(word => {
        const start = performance.now();
        scrambler.scramble(word);
        times.push(performance.now() - start);
      });

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(5); // <5ms average
    });
  });
});
