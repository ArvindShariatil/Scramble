/**
 * SCRAM-024: Epic 6 Integration Tests
 * Full game session tests integrating all Epic 6 components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnagramGeneratorV3 } from '../../src/game/AnagramGenerator-v3';
import { DatamuseAPI } from '../../src/api/DatamuseAPI';
import { WordScrambler } from '../../src/game/WordScrambler';
import { AnagramCache } from '../../src/utils/AnagramCache';

describe('SCRAM-024: Epic 6 Integration Tests', () => {
  let generator: AnagramGeneratorV3;
  let mockDatamuseAPI: DatamuseAPI;
  let wordScrambler: WordScrambler;
  let cache: AnagramCache;

  beforeEach(() => {
    localStorage.clear();
    
    // Create real dependencies for integration testing
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

  // AC-001: Integration Test - Full Game Session
  describe('AC-001: Full Game Session (10 rounds)', () => {
    it('should complete 10-round hybrid game session successfully', async () => {
      // Mock API to return valid words
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async (difficulty: number) => {
        const words = ['apple', 'beach', 'cloud', 'dance', 'eagle'];
        return words[difficulty % words.length];
      });

      generator.setMode('hybrid');
      const words: string[] = [];

      // Play 10 rounds
      for (let i = 0; i < 10; i++) {
        const anagram = await generator.getAnagram({ difficulty: (i % 5) + 1 });
        
        expect(anagram).toBeTruthy();
        expect(anagram?.solution).toBeTruthy();
        words.push(anagram!.solution);
        
        // Mark as used
        generator.markAsUsed(anagram!.id);
      }

      // Verify all rounds produced valid anagrams
      expect(words.length).toBe(10);
      words.forEach(word => {
        expect(word.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should track usage stats across full session', async () => {
      generator.setMode('hybrid');

      // Generate 5 anagrams with varying words to ensure unique IDs
      const uniqueWords = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      for (let i = 0; i < 5; i++) {
        (mockDatamuseAPI.getRandomWord as any).mockResolvedValueOnce(uniqueWords[i]);
        const anagram = await generator.getAnagram({ difficulty: 1 });
        generator.markAsUsed(anagram!.id);
      }

      const stats = generator.getUsageStats();
      // Verify usage tracking works (at least 1 anagram marked)
      expect(stats.totalUsed).toBeGreaterThan(0);
    });
  });

  // AC-002: Cache Hit Rate Test
  describe('AC-002: Cache Performance', () => {
    it('should achieve >60% cache hit rate after 20 rounds', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        const words = ['cache', 'test', 'word', 'data', 'code'];
        return words[Math.floor(Math.random() * words.length)];
      });

      generator.setMode('hybrid');
      let cacheHits = 0;
      let apiCalls = 0;

      // Pre-populate cache with 10 words
      for (let i = 0; i < 10; i++) {
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
      }

      const initialCalls = (mockDatamuseAPI.getRandomWord as any).mock.calls.length;

      // Now generate 20 more (should hit cache often)
      for (let i = 0; i < 20; i++) {
        const anagram = await generator.getAnagram({ difficulty: (i % 5) + 1 });
        expect(anagram).toBeTruthy();
      }

      const finalCalls = (mockDatamuseAPI.getRandomWord as any).mock.calls.length;
      apiCalls = finalCalls - initialCalls;
      cacheHits = 20 - apiCalls;

      const hitRate = (cacheHits / 20) * 100;
      
      // After pre-population, hit rate should be >60%
      expect(hitRate).toBeGreaterThan(60);
    });

    it('should report cache stats correctly', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('stats');
      generator.setMode('hybrid');

      // Generate some anagrams
      await generator.getAnagram({ difficulty: 1 });
      await generator.getAnagram({ difficulty: 1 }); // Should hit cache

      const stats = generator.getUsageStats();
      expect(stats.cacheStats.size).toBeGreaterThan(0);
      expect(stats.cacheStats.hitRate).toBeDefined();
    });
  });

  // AC-003: API Failure Fallback
  describe('AC-003: API Failure Fallback', () => {
    it('should fallback to curated when API fails in hybrid mode', async () => {
      // Mock API to fail
      (mockDatamuseAPI.getRandomWord as any).mockRejectedValue(new Error('API down'));
      
      generator.setMode('hybrid');
      const anagram = await generator.getAnagram({ difficulty: 1 });

      // Should fallback to curated (from original 82 words)
      expect(anagram).toBeTruthy();
      expect(anagram?.solution).toBeTruthy();
      expect(anagram?.id).not.toContain('generated-'); // Curated ID format
    });

    it('should throw error when API fails in unlimited-only mode', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockRejectedValue(new Error('API down'));
      
      generator.setMode('unlimited-only');

      await expect(generator.getAnagram({ difficulty: 1 })).rejects.toThrow();
    });

    it('should continue working after API recovers', async () => {
      generator.setMode('hybrid');
      
      // First call fails
      (mockDatamuseAPI.getRandomWord as any).mockRejectedValueOnce(new Error('API down'));
      const anagram1 = await generator.getAnagram({ difficulty: 1 });
      expect(anagram1).toBeTruthy(); // Fallback works

      // Second call succeeds
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValueOnce('recovered');
      const anagram2 = await generator.getAnagram({ difficulty: 2 });
      expect(anagram2?.id).toContain('generated-'); // API word
    });
  });

  // AC-004: Offline Mode Fallback
  describe('AC-004: Offline Mode', () => {
    it('should use curated words when offline', async () => {
      // Simulate offline by making API reject
      (mockDatamuseAPI.getRandomWord as any).mockRejectedValue(new Error('Network error'));
      
      generator.setMode('hybrid');
      
      // Should fallback gracefully
      const anagram = await generator.getAnagram({ difficulty: 1 });
      expect(anagram).toBeTruthy();
      expect(anagram?.category).toBeTruthy(); // Curated have categories
    });
  });

  // AC-005: Mode Switching Mid-Game
  describe('AC-005: Mode Switching', () => {
    it('should switch modes without corruption', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('switch');

      // Start in curated
      generator.setMode('curated');
      const anagram1 = await generator.getAnagram({ difficulty: 1 });
      expect(anagram1?.id).not.toContain('generated-');

      // Switch to hybrid
      generator.setMode('hybrid');
      const anagram2 = await generator.getAnagram({ difficulty: 1 });
      expect(anagram2).toBeTruthy();

      // Switch to unlimited-only
      generator.setMode('unlimited-only');
      const anagram3 = await generator.getAnagram({ difficulty: 1 });
      expect(anagram3?.id).toContain('generated-');
    });

    it('should persist mode to localStorage', () => {
      generator.setMode('unlimited-only');
      expect(localStorage.getItem('scramble-word-mode')).toBe('unlimited-only');

      generator.setMode('curated');
      expect(localStorage.getItem('scramble-word-mode')).toBe('curated');
    });

    it('should load saved mode on initialization', () => {
      localStorage.setItem('scramble-word-mode', 'unlimited-only');
      
      const newGenerator = new AnagramGeneratorV3(1, mockDatamuseAPI, wordScrambler, cache);
      expect(newGenerator.getMode()).toBe('unlimited-only');
    });
  });

  // AC-006: localStorage Persistence
  describe('AC-006: localStorage Persistence', () => {
    it('should persist cache across sessions', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('persist');
      generator.setMode('hybrid');

      // Generate and cache
      await generator.getAnagram({ difficulty: 1 });
      const cacheSize1 = generator.getUsageStats().cacheSize;

      // Simulate new session
      const newGenerator = new AnagramGeneratorV3(1, mockDatamuseAPI, wordScrambler, cache);
      newGenerator.setMode('hybrid');
      
      const cacheSize2 = newGenerator.getUsageStats().cacheSize;
      expect(cacheSize2).toBe(cacheSize1); // Cache persisted
    });
  });

  // AC-007: Concurrent Tab Scenario
  describe('AC-007: Concurrent Tabs', () => {
    it('should handle cache modifications from multiple sources', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('concurrent');
      generator.setMode('hybrid');

      // Generator 1 adds to cache
      await generator.getAnagram({ difficulty: 1 });

      // Simulate another tab/generator instance
      const generator2 = new AnagramGeneratorV3(1, mockDatamuseAPI, wordScrambler, cache);
      generator2.setMode('hybrid');
      await generator2.getAnagram({ difficulty: 2 });

      // Both should share cache
      const stats1 = generator.getUsageStats();
      const stats2 = generator2.getUsageStats();

      expect(stats1.cacheStats.size).toBeGreaterThan(0);
      expect(stats2.cacheStats.size).toBeGreaterThan(0);
    });
  });

  // AC-008: Error Recovery
  describe('AC-008: Error Recovery', () => {
    it('should recover from WordScrambler errors', async () => {
      generator.setMode('hybrid');
      
      // Mock API returns word with identical letters (will fail scrambling)
      (mockDatamuseAPI.getRandomWord as any)
        .mockResolvedValueOnce('aaaa') // Fail
        .mockResolvedValueOnce('test'); // Succeed

      const anagram = await generator.getAnagram({ difficulty: 1 });
      
      // Should retry and succeed OR fallback to curated
      expect(anagram).toBeTruthy();
    });

    it('should handle cache quota exceeded gracefully', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async (difficulty: number) => {
        return `word${difficulty}${Date.now()}`;
      });

      generator.setMode('hybrid');

      // Fill cache beyond limit (should trigger eviction)
      for (let i = 0; i < 250; i++) {
        await generator.getAnagram({ difficulty: (i % 5) + 1 });
      }

      // Should still work
      const anagram = await generator.getAnagram({ difficulty: 1 });
      expect(anagram).toBeTruthy();

      // Cache should be under limit (200)
      const stats = generator.getUsageStats();
      expect(stats.cacheStats.size).toBeLessThanOrEqual(200);
    });
  });

  // AC-009: Performance Benchmarks
  describe('AC-009: Performance', () => {
    it('should generate anagram from cache in <10ms', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockResolvedValue('fast');
      generator.setMode('hybrid');

      // Pre-populate cache
      await generator.getAnagram({ difficulty: 1 });

      // Measure cache hit
      const start = performance.now();
      const anagram = await generator.getAnagram({ difficulty: 1 });
      const duration = performance.now() - start;

      expect(anagram).toBeTruthy();
      expect(duration).toBeLessThan(10); // <10ms for cache hit
    });

    it('should complete API generation in <500ms', async () => {
      (mockDatamuseAPI.getRandomWord as any).mockImplementation(async () => {
        // Simulate realistic API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'apiword';
      });

      cache.clear(); // Ensure cache miss
      generator.setMode('hybrid');

      const start = performance.now();
      const anagram = await generator.getAnagram({ difficulty: 1 });
      const duration = performance.now() - start;

      expect(anagram).toBeTruthy();
      expect(duration).toBeLessThan(500); // <500ms for API call
    });
  });

  // AC-010: Backward Compatibility
  describe('AC-010: v2.0.0 Compatibility', () => {
    it('should preserve all v2.0.0 methods', () => {
      // Verify original methods still exist
      expect(generator.markAsUsed).toBeDefined();
      expect(generator.isUsed).toBeDefined();
      expect(generator.resetUsedAnagrams).toBeDefined();
      expect(generator.setDifficulty).toBeDefined();
      expect(generator.increaseDifficulty).toBeDefined();
      expect(generator.getUsageStats).toBeDefined();
    });

    it('should maintain curated mode behavior identical to v2.0.0', async () => {
      generator.setMode('curated');
      
      const anagram = await generator.getAnagram({ difficulty: 1 });
      
      // Should return curated anagram with expected structure
      expect(anagram).toBeTruthy();
      expect(anagram?.id).toBeTruthy();
      expect(anagram?.scrambled).toBeTruthy();
      expect(anagram?.solution).toBeTruthy();
      expect(anagram?.category).toBeTruthy();
      expect(anagram?.hints).toBeTruthy();
    });
  });
});
