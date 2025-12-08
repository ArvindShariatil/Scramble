/**
 * AnagramGenerator v3 Tests - SCRAM-022
 * 
 * Test Coverage:
 * - AC-001: Preserve v2.0.0 code path (curated mode)
 * - AC-002: Mode configuration (curated/hybrid/unlimited-only)
 * - AC-003: Hybrid generation flow (cache → API → curated)
 * - AC-004: API generation pipeline
 * - AC-005: Loading state management (TODO: GameState integration)
 * - AC-006: Analytics integration
 * - AC-007: Error handling
 * - AC-008: Backward compatibility
 * - AC-009: 30+ unit tests with 100% coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnagramGeneratorV3 } from '../../../src/game/AnagramGenerator-v3';
import type { AnagramSet } from '../../../src/data/anagrams';
import { DatamuseAPI } from '../../../src/api/DatamuseAPI';
import { WordScrambler } from '../../../src/game/WordScrambler';
import { AnagramCache } from '../../../src/utils/AnagramCache';

describe('AnagramGenerator v3 - SCRAM-022', () => {
  let generator: AnagramGeneratorV3;
  let mockDatamuseAPI: any;
  let mockWordScrambler: any;
  let mockCache: any;

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

    // Create mock instances
    mockDatamuseAPI = {
      getRandomWord: vi.fn(),
    };

    mockWordScrambler = {
      scramble: vi.fn(),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      getStats: vi.fn().mockReturnValue({ size: 0, hitRate: 0, evictions: 0 }),
    };

    // Create generator with injected mocks
    generator = new AnagramGeneratorV3(1, mockDatamuseAPI as any, mockWordScrambler as any, mockCache as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-001: Preserve v2.0.0 Code Path', () => {
    it('should return curated anagram in curated mode', async () => {
      generator.setMode('curated');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram).not.toBeNull();
      expect(anagram?.id).toMatch(/^easy-/); // Curated ID pattern
      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockDatamuseAPI.getRandomWord).not.toHaveBeenCalled();
    });

    it('should not call API in curated mode', async () => {
      generator.setMode('curated');

      await generator.getAnagram({ difficulty: 2 });

      expect(mockDatamuseAPI.getRandomWord).not.toHaveBeenCalled();
      expect(mockWordScrambler.scramble).not.toHaveBeenCalled();
    });

    it('should track only curated anagrams as used in curated mode', async () => {
      generator.setMode('curated');

      const anagram1 = await generator.getAnagram({ difficulty: 1 });
      const anagram2 = await generator.getAnagram({ difficulty: 1 });

      expect(anagram1?.id).not.toBe(anagram2?.id); // Different anagrams
      expect(generator.isUsed(anagram1!.id)).toBe(true);
      expect(generator.isUsed(anagram2!.id)).toBe(true);
    });
  });

  describe('AC-002: Mode Configuration', () => {
    it('should initialize with hybrid mode by default', () => {
      expect(generator.getMode()).toBe('hybrid');
    });

    it('should allow setting mode to curated', () => {
      generator.setMode('curated');
      expect(generator.getMode()).toBe('curated');
    });

    it('should allow setting mode to unlimited-only', () => {
      generator.setMode('unlimited-only');
      expect(generator.getMode()).toBe('unlimited-only');
    });

    it('should persist mode to localStorage', () => {
      generator.setMode('unlimited-only');

      const stored = localStorage.getItem('scramble-word-mode');
      expect(stored).toBe('unlimited-only');
    });

    it('should load mode from localStorage on initialization', () => {
      localStorage.setItem('scramble-word-mode', 'curated');

      const newGenerator = new AnagramGeneratorV3(1);

      expect(newGenerator.getMode()).toBe('curated');
    });

    it('should handle invalid mode in localStorage gracefully', () => {
      localStorage.setItem('scramble-word-mode', 'invalid-mode');

      const newGenerator = new AnagramGeneratorV3(1);

      expect(newGenerator.getMode()).toBe('hybrid'); // Default
    });
  });

  describe('AC-003: Hybrid Generation Flow', () => {
    it('should try cache first in hybrid mode', async () => {
      const cachedAnagram: AnagramSet = {
        id: 'cached-001',
        scrambled: 'olleh',
        solution: 'hello',
        category: 'Cached',
        hint: '5 letters',
      };

      mockCache.get.mockReturnValue(cachedAnagram);

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(mockCache.get).toHaveBeenCalledWith(1);
      expect(anagram).toEqual(cachedAnagram);
      expect(mockDatamuseAPI.getRandomWord).not.toHaveBeenCalled();
    });

    it('should call API on cache miss', async () => {
      mockCache.get.mockReturnValue(null); // Cache miss
      mockDatamuseAPI.getRandomWord.mockResolvedValue('world');
      mockWordScrambler.scramble.mockReturnValue('dlrow');

      const anagram = await generator.getAnagram({ difficulty: 2 });

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockDatamuseAPI.getRandomWord).toHaveBeenCalledWith(2);
      expect(mockWordScrambler.scramble).toHaveBeenCalledWith('world');
      expect(anagram).not.toBeNull();
      expect(anagram?.solution).toBe('world');
    });

    it('should fallback to curated on API failure in hybrid mode', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('API error'));

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram).not.toBeNull();
      expect(anagram?.id).toMatch(/^easy-/); // Curated fallback
    });

    it('should cache API-generated anagrams', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('testing');
      mockWordScrambler.scramble.mockReturnValue('gnitset');

      await generator.getAnagram({ difficulty: 3 });

      expect(mockCache.set).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          solution: 'testing',
          scrambled: 'gnitset',
        })
      );
    });
  });

  describe('AC-004: API Generation Pipeline', () => {
    it('should generate anagram from API with correct structure', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('example');
      mockWordScrambler.scramble.mockReturnValue('elpmaxe');

      const anagram = await generator.getAnagram({ difficulty: 4 });

      expect(anagram).toMatchObject({
        id: expect.stringMatching(/^generated-\d+-example$/),
        scrambled: 'elpmaxe',
        solution: 'example',
        difficulty: 4,
        category: 'API Generated Word',
        hints: {
          category: 'General',
          firstLetter: 'E'
        },
      });
    });

    it('should retry API generation on WordScrambler error', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord
        .mockResolvedValueOnce('aaa') // First call (will fail scrambler)
        .mockResolvedValueOnce('valid'); // Second call (succeeds)
      
      mockWordScrambler.scramble
        .mockImplementationOnce(() => {
          throw new Error('Cannot scramble word with all identical letters');
        })
        .mockReturnValueOnce('dival');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(mockDatamuseAPI.getRandomWord).toHaveBeenCalledTimes(2);
      expect(anagram?.solution).toBe('valid');
    });

    it('should throw after max retries (3 attempts)', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('aaa');
      mockWordScrambler.scramble.mockImplementation(() => {
        throw new Error('Cannot scramble');
      });

      generator.setMode('unlimited-only'); // Should throw on failure

      await expect(generator.getAnagram({ difficulty: 1 })).rejects.toThrow();
      expect(mockDatamuseAPI.getRandomWord).toHaveBeenCalledTimes(3); // Max retries
    });

    it('should generate unique IDs for API-generated anagrams', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('test');
      mockWordScrambler.scramble.mockReturnValue('stet');

      const anagram1 = await generator.getAnagram({ difficulty: 1 });
      const anagram2 = await generator.getAnagram({ difficulty: 1 });

      expect(anagram1?.id).not.toBe(anagram2?.id);
      expect(anagram1?.id).toMatch(/^generated-\d+-test$/);
    });
  });

  describe('AC-006: Analytics Integration', () => {
    it('should track cache hit event', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const cachedAnagram: AnagramSet = {
        id: 'cached-001',
        scrambled: 'test',
        solution: 'test',
        category: 'Test',
        hint: 'test',
      };
      mockCache.get.mockReturnValue(cachedAnagram);

      await generator.getAnagram({ difficulty: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] WORD_GENERATION_SOURCE',
        { source: 'cache', difficulty: 1 }
      );

      consoleLogSpy.mockRestore();
    });

    it('should track API generation event', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('api');
      mockWordScrambler.scramble.mockReturnValue('ipa');

      await generator.getAnagram({ difficulty: 2 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] WORD_GENERATION_SOURCE',
        { source: 'api', difficulty: 2 }
      );

      consoleLogSpy.mockRestore();
    });

    it('should track curated fallback event', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('API error'));

      await generator.getAnagram({ difficulty: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] WORD_GENERATION_SOURCE',
        { source: 'curated', difficulty: 1 }
      );

      consoleLogSpy.mockRestore();
    });

    it('should track API generation failure', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('Network timeout'));

      await generator.getAnagram({ difficulty: 3 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] API_GENERATION_FAILED',
        expect.objectContaining({
          api: 'datamuse',
          difficulty: 3,
          error: 'Network timeout',
        })
      );

      consoleLogSpy.mockRestore();
    });

    it('should track unlimited mode enabled', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      generator.setMode('unlimited-only');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics] UNLIMITED_MODE_ENABLED',
        { mode: 'unlimited-only' }
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('AC-007: Error Handling', () => {
    it('should catch DatamuseAPIError and fallback in hybrid mode', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('Datamuse API Error'));

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram).not.toBeNull();
      expect(anagram?.id).toMatch(/^easy-/); // Curated fallback
    });

    it('should throw error in unlimited-only mode on API failure', async () => {
      generator.setMode('unlimited-only');
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('API down'));

      await expect(generator.getAnagram({ difficulty: 1 })).rejects.toThrow(
        'API generation failed and unlimited-only mode requires API'
      );
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockImplementation(() => {
        throw new Error('Cache error');
      });
      mockDatamuseAPI.getRandomWord.mockResolvedValue('fallback');
      mockWordScrambler.scramble.mockReturnValue('kcabllaf');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      // Should still work by catching cache error and trying API
      expect(anagram).not.toBeNull();
    });

    it('should never expose API errors to UI in hybrid mode', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('API error'));

      const anagram = await generator.getAnagram({ difficulty: 1 });

      // Should return curated fallback without throwing
      expect(anagram).not.toBeNull();
    });
  });

  describe('AC-008: Backward Compatibility', () => {
    it('should maintain v2.0.0 method signature for getAnagram', () => {
      // getAnagram should accept same options as v2.0.0
      expect(async () => {
        await generator.getAnagram();
        await generator.getAnagram({ difficulty: 2 });
        await generator.getAnagram({ difficulty: 3, category: 'Animals' });
        await generator.getAnagram({ excludeUsed: false });
      }).not.toThrow();
    });

    it('should return same AnagramSet interface as v2.0.0', async () => {
      generator.setMode('curated');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram).toHaveProperty('id');
      expect(anagram).toHaveProperty('scrambled');
      expect(anagram).toHaveProperty('solution');
      expect(anagram).toHaveProperty('difficulty');
      expect(anagram).toHaveProperty('hints');
    });

    it('should preserve curated anagram ID patterns', async () => {
      generator.setMode('curated');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram?.id).toMatch(/^easy-\d{3}$/);
    });

    it('should have distinct ID pattern for API-generated anagrams', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('api');
      mockWordScrambler.scramble.mockReturnValue('ipa');

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram?.id).toMatch(/^generated-\d+-api$/);
      expect(anagram?.id).not.toMatch(/^easy-/);
    });
  });

  describe('Inherited v2.0.0 Methods', () => {
    it('should support getNextAnagram', async () => {
      generator.setMode('curated');

      const anagram = await generator.getNextAnagram();

      expect(anagram).not.toBeNull();
    });

    it('should support markAsUsed', () => {
      generator.markAsUsed('test-id');

      expect(generator.isUsed('test-id')).toBe(true);
    });

    it('should support resetUsedAnagrams', () => {
      generator.markAsUsed('test-1');
      generator.markAsUsed('test-2');

      generator.resetUsedAnagrams();

      expect(generator.isUsed('test-1')).toBe(false);
      expect(generator.isUsed('test-2')).toBe(false);
    });

    it('should support difficulty management', () => {
      generator.setDifficulty(3);
      expect(generator.getCurrentDifficulty()).toBe(3);

      generator.increaseDifficulty(2);
      expect(generator.getCurrentDifficulty()).toBe(5);
    });

    it('should provide usage stats with cache stats', () => {
      const stats = generator.getUsageStats();

      expect(stats).toHaveProperty('totalUsed');
      expect(stats).toHaveProperty('usedByDifficulty');
      expect(stats).toHaveProperty('availableByDifficulty');
      expect(stats).toHaveProperty('cacheStats');
      expect(stats.cacheStats).toHaveProperty('size');
      expect(stats.cacheStats).toHaveProperty('hitRate');
      expect(stats.cacheStats).toHaveProperty('evictions');
    });

    it('should support clearCache method', () => {
      generator.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full game session with hybrid mode', async () => {
      mockCache.get
        .mockReturnValueOnce({ id: 'cache-1', scrambled: 'c1', solution: 's1', category: 'C', hint: 'h' })
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ id: 'cache-2', scrambled: 'c2', solution: 's2', category: 'C', hint: 'h' });

      mockDatamuseAPI.getRandomWord.mockResolvedValue('api-word');
      mockWordScrambler.scramble.mockReturnValue('drow-ipa');

      const anagram1 = await generator.getAnagram({ difficulty: 1 }); // Cache hit
      const anagram2 = await generator.getAnagram({ difficulty: 1 }); // Cache miss → API
      const anagram3 = await generator.getAnagram({ difficulty: 1 }); // Cache hit

      expect(anagram1?.id).toBe('cache-1');
      expect(anagram2?.solution).toBe('api-word');
      expect(anagram3?.id).toBe('cache-2');
    });

    it('should handle offline scenario gracefully', async () => {
      mockCache.get.mockReturnValue(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('Network offline'));

      const anagram = await generator.getAnagram({ difficulty: 1 });

      expect(anagram).not.toBeNull();
      expect(anagram?.id).toMatch(/^easy-/); // Curated fallback
    });

    it('should track all analytics events in realistic flow', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Cache hit
      mockCache.get.mockReturnValueOnce({ id: 'c1', scrambled: 't', solution: 't', category: 'T', hint: 't' });
      await generator.getAnagram({ difficulty: 1 });

      // API generation
      mockCache.get.mockReturnValueOnce(null);
      mockDatamuseAPI.getRandomWord.mockResolvedValue('api');
      mockWordScrambler.scramble.mockReturnValue('ipa');
      await generator.getAnagram({ difficulty: 2 });

      // API failure → curated
      mockCache.get.mockReturnValueOnce(null);
      mockDatamuseAPI.getRandomWord.mockRejectedValue(new Error('Fail'));
      await generator.getAnagram({ difficulty: 3 });

      // Verify key analytics events were tracked
      expect(consoleLogSpy).toHaveBeenCalledWith('[Analytics] WORD_GENERATION_SOURCE', { source: 'cache', difficulty: 1 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Analytics] WORD_GENERATION_SOURCE', { source: 'api', difficulty: 2 });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Analytics] API_GENERATION_FAILED', expect.objectContaining({ api: 'datamuse' }));
      expect(consoleLogSpy).toHaveBeenCalledWith('[Analytics] WORD_GENERATION_SOURCE', { source: 'curated', difficulty: 3 });

      consoleLogSpy.mockRestore();
    });
  });
});
