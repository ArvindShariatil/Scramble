/**
 * AnagramCache - LRU cache for API-generated anagrams
 * 
 * SCRAM-021: Persistent localStorage cache with LRU eviction
 * 
 * Features:
 * - LRU eviction at 200 anagrams (~20kb)
 * - localStorage persistence
 * - Hit/miss tracking for analytics
 * - Graceful error handling (quota, corruption)
 * 
 * @epic Epic-006 - Unlimited Word Generation
 * @feature-flag EPIC_6_ENABLED
 */

import type { AnagramSet } from '../data/anagrams';

/**
 * Cached anagram with metadata for LRU tracking
 */
export interface CachedAnagram {
  anagram: AnagramSet;
  timestamp: number;      // Last access time (for LRU)
  accessCount: number;    // Number of times accessed
}

/**
 * Cache statistics for analytics
 */
export interface CacheStats {
  size: number;
  hitRate: number;
  evictions: number;
}

/**
 * AnagramCache - Singleton LRU cache with localStorage persistence
 */
export class AnagramCache {
  private static instance: AnagramCache | null = null;
  private cache: Map<string, CachedAnagram> = new Map();
  private readonly maxSize = 200;
  private readonly storageKey = 'scramble-generated-cache';
  
  // Analytics tracking
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AnagramCache {
    if (!AnagramCache.instance) {
      AnagramCache.instance = new AnagramCache();
    }
    return AnagramCache.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AnagramCache.instance = null;
  }

  /**
   * Get random cached anagram for difficulty level
   * 
   * @param difficulty - Difficulty level (1-5)
   * @returns Cached anagram or null if not found
   */
  get(difficulty: number): AnagramSet | null {
    const entries = this.getEntriesByDifficulty(difficulty);
    
    if (entries.length === 0) {
      this.misses++;
      return null;
    }

    // Select random entry from available cache entries
    const randomEntry = entries[Math.floor(Math.random() * entries.length)];
    const cachedData = this.cache.get(randomEntry.key);
    
    if (!cachedData) {
      this.misses++;
      return null;
    }

    // Update LRU metadata
    cachedData.timestamp = Date.now();
    cachedData.accessCount++;
    
    this.hits++;
    this.saveToStorage();
    
    return cachedData.anagram;
  }

  /**
   * Store anagram in cache
   * 
   * @param difficulty - Difficulty level (1-5)
   * @param anagram - Anagram to cache
   */
  set(difficulty: number, anagram: AnagramSet): void {
    const key = this.generateKey(difficulty, anagram.id);
    
    // Add to cache
    this.cache.set(key, {
      anagram,
      timestamp: Date.now(),
      accessCount: 0,
    });

    // Trigger LRU eviction if needed
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    // Persist to storage
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache stats (size, hit rate, evictions)
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests === 0 ? 0 : this.hits / totalRequests;

    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      evictions: this.evictions,
    };
  }

  /**
   * Clear all cached anagrams
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.saveToStorage();
  }

  /**
   * Clear cached anagrams for specific difficulty
   * 
   * @param difficulty - Difficulty level (1-5)
   */
  clearDifficulty(difficulty: number): void {
    const entries = this.getEntriesByDifficulty(difficulty);
    
    entries.forEach(entry => {
      this.cache.delete(entry.key);
    });

    this.saveToStorage();
  }

  /**
   * Preload anagrams for testing
   * 
   * @param anagrams - Array of anagrams to preload
   */
  preload(anagrams: AnagramSet[]): void {
    anagrams.forEach(anagram => {
      // Extract difficulty from anagram ID or default to 1
      const difficulty = this.extractDifficultyFromAnagram(anagram);
      this.set(difficulty, anagram);
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    // Find entry with oldest timestamp
    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      
      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Invalid cache data structure, resetting cache');
        return;
      }

      // Restore cache entries
      if (parsed.cache && Array.isArray(parsed.cache)) {
        parsed.cache.forEach(([key, value]: [string, CachedAnagram]) => {
          this.cache.set(key, value);
        });
      }

      // Restore analytics
      this.hits = parsed.hits || 0;
      this.misses = parsed.misses || 0;
      this.evictions = parsed.evictions || 0;

    } catch (error) {
      console.warn('Failed to load cache from localStorage, resetting:', error);
      this.cache.clear();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        hits: this.hits,
        misses: this.misses,
        evictions: this.evictions,
        version: 1,
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));

    } catch (error) {
      // Handle quota exceeded errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, evicting oldest 50 entries');
        
        // Evict oldest 50 entries
        for (let i = 0; i < 50; i++) {
          this.evictLRU();
        }

        // Retry save
        try {
          const data = {
            cache: Array.from(this.cache.entries()),
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            version: 1,
          };
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (retryError) {
          console.error('Failed to save cache after eviction:', retryError);
        }
      } else {
        console.error('Failed to save cache to localStorage:', error);
      }
    }
  }

  /**
   * Generate cache key from difficulty and anagram ID
   * 
   * @param difficulty - Difficulty level
   * @param id - Anagram ID
   * @returns Cache key
   */
  private generateKey(difficulty: number, id: string): string {
    return `${difficulty}-${id}`;
  }

  /**
   * Get all cache entries for specific difficulty
   * 
   * @param difficulty - Difficulty level
   * @returns Array of cache entries with keys
   */
  private getEntriesByDifficulty(difficulty: number): Array<{ key: string; value: CachedAnagram }> {
    const entries: Array<{ key: string; value: CachedAnagram }> = [];
    const prefix = `${difficulty}-`;

    this.cache.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        entries.push({ key, value });
      }
    });

    return entries;
  }

  /**
   * Extract difficulty from anagram (heuristic based on word length)
   * 
   * @param anagram - Anagram set
   * @returns Estimated difficulty (1-5)
   */
  private extractDifficultyFromAnagram(anagram: AnagramSet): number {
    const wordLength = anagram.solution.length;
    
    if (wordLength <= 4) return 1;
    if (wordLength <= 5) return 2;
    if (wordLength <= 6) return 3;
    if (wordLength <= 7) return 4;
    return 5;
  }
}

/**
 * Factory function for easy access
 * 
 * @returns Singleton AnagramCache instance
 */
export function getAnagramCache(): AnagramCache {
  return AnagramCache.getInstance();
}
