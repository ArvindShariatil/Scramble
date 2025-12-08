/**
 * AnagramGenerator v3 - Hybrid word generation
 * 
 * SCRAM-022: Extends v2.0.0 with unlimited API-driven word generation
 * while maintaining backward compatibility and offline capability.
 * 
 * Architecture: Cache → API → Curated (3-tier fallback)
 * 
 * Modes:
 * - curated: v2.0.0 behavior (82 curated words only)
 * - hybrid: Try cache/API first, fallback to curated (DEFAULT)
 * - unlimited-only: API required, throw error if fails
 * 
 * @epic Epic-006 - Unlimited Word Generation
 * @feature-flag EPIC_6_ENABLED
 */

import type { AnagramSet } from '../data/anagrams';
import { ANAGRAM_SETS } from '../data/anagrams';
import { DatamuseAPI } from '../api/DatamuseAPI';
import { WordScrambler } from './WordScrambler';
import { AnagramCache } from '../utils/AnagramCache';
import { WordsAPIClient } from '../api/WordsAPI';

/**
 * Word generation modes
 */
export type WordMode = 'curated' | 'hybrid' | 'unlimited-only';

/**
 * Options for anagram generation
 */
export interface GeneratorOptions {
  difficulty?: 1 | 2 | 3 | 4 | 5;
  category?: string;
  excludeUsed?: boolean;
}

/**
 * AnagramGenerator v3 - Hybrid generation with Epic 6
 */
export class AnagramGeneratorV3 {
  private usedAnagrams: Set<string> = new Set();
  private currentDifficulty: number = 1;
  private mode: WordMode = 'hybrid';
  private readonly storageKey = 'scramble-word-mode';
  
  // Epic 6 dependencies
  private datamuseAPI: DatamuseAPI;
  private wordScrambler: WordScrambler;
  private cache: AnagramCache;
  private wordsAPI: WordsAPIClient;

  constructor(
    initialDifficulty: number = 1,
    // Dependency injection for testability
    datamuseAPI?: DatamuseAPI,
    wordScrambler?: WordScrambler,
    cache?: AnagramCache
  ) {
    this.currentDifficulty = Math.max(1, Math.min(5, initialDifficulty));
    
    // Initialize Epic 6 dependencies (or use injected mocks)
    this.datamuseAPI = datamuseAPI || new DatamuseAPI();
    this.wordScrambler = wordScrambler || new WordScrambler();
    this.cache = cache || AnagramCache.getInstance();
    this.wordsAPI = new WordsAPIClient();
    
    // Load mode from localStorage
    this.loadMode();
  }

  /**
   * Get a random anagram for the specified difficulty level
   * 
   * Hybrid Flow:
   * 1. If mode === 'curated', return curated (v2.0.0 behavior)
   * 2. Check cache (AnagramCache.get)
   * 3. If cache miss, try API generation
   * 4. If API fails and mode === 'hybrid', fallback to curated
   * 5. If API fails and mode === 'unlimited-only', throw error
   * 
   * @param options Generation options
   * @returns Selected anagram set or null if none available
   */
  async getAnagram(options: GeneratorOptions = {}): Promise<AnagramSet | null> {
    const difficulty = options.difficulty ?? this.currentDifficulty;

    // Mode 1: Curated only (v2.0.0 behavior)
    if (this.mode === 'curated') {
      return this.getCuratedAnagram(difficulty, options);
    }

    // Mode 2 & 3: Hybrid or unlimited-only
    try {
      // Step 1: Try cache (only if not excluding used words)
      if (!options.excludeUsed) {
        const cachedAnagram = this.cache.get(difficulty as 1 | 2 | 3 | 4 | 5);
        if (cachedAnagram) {
          this.markAsUsed(cachedAnagram.id);
          this.trackAnalytics('WORD_GENERATION_SOURCE', { source: 'cache', difficulty });
          return cachedAnagram;
        }
      }

      // Step 2: Try API generation (always get fresh word when excludeUsed is true)
      const apiAnagram = await this.generateFromAPI(difficulty as 1 | 2 | 3 | 4 | 5);
      if (apiAnagram) {
        this.markAsUsed(apiAnagram.id);
        // Only cache if we're not excluding used words (to avoid cache pollution)
        if (!options.excludeUsed) {
          this.cache.set(difficulty as 1 | 2 | 3 | 4 | 5, apiAnagram);
        }
        this.trackAnalytics('WORD_GENERATION_SOURCE', { source: 'api', difficulty });
        return apiAnagram;
      }

    } catch (error) {
      // Log API failure
      this.trackAnalytics('API_GENERATION_FAILED', {
        api: 'datamuse',
        difficulty,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Mode 3: Unlimited-only throws on API failure
      if (this.mode === 'unlimited-only') {
        throw new Error('API generation failed and unlimited-only mode requires API');
      }

      // Mode 2: Hybrid falls back to curated
    }

    // Step 3: Fallback to curated (hybrid mode only)
    const curatedAnagram = this.getCuratedAnagram(difficulty, options);
    if (curatedAnagram) {
      this.trackAnalytics('WORD_GENERATION_SOURCE', { source: 'curated', difficulty });
    }
    return curatedAnagram;
  }

  /**
   * Generate anagram from Datamuse API
   * 
   * Pipeline:
   * 1. DatamuseAPI.getRandomWord(difficulty)
   * 2. WordScrambler.scramble(word)
   * 3. Create AnagramSet with source: 'api'
   * 4. Return AnagramSet
   * 
   * @param difficulty Difficulty level (1-5)
   * @returns Generated anagram or null on failure
   */
  private async generateFromAPI(difficulty: 1 | 2 | 3 | 4 | 5): Promise<AnagramSet | null> {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Step 1: Fetch word from API
        const word = await this.datamuseAPI.getRandomWord(difficulty);
        
        // Step 2: Scramble word (returns lowercase)
        const scrambled = this.wordScrambler.scramble(word);
        
        // Step 3: Fetch contextual hint from Words API
        const hint = await this.getContextualHint(word);
        
        // Small delay to ensure unique timestamps (tests run very fast)
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Step 4: Create AnagramSet (convert to uppercase for consistency)
        const anagram: AnagramSet = {
          id: `generated-${Date.now()}-${word}`,
          scrambled: scrambled.toUpperCase(),
          solution: word.toUpperCase(),
          difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
          category: hint.category,
          hints: {
            category: hint.hint,
            firstLetter: word[0].toUpperCase()
          },
        };

        return anagram;

      } catch (error) {
        // If WordScrambler error (e.g., all identical letters), retry with different word
        if (attempt < maxRetries) {
          continue;
        }
        
        // All retries exhausted
        throw error;
      }
    }

    return null;
  }

  /**
   * Get curated anagram (v2.0.0 logic)
   * 
   * @param difficulty Difficulty level
   * @param options Generator options
   * @returns Curated anagram or null
   */
  private getCuratedAnagram(difficulty: number, options: GeneratorOptions): AnagramSet | null {
    const availableAnagrams = ANAGRAM_SETS[difficulty] || [];

    if (availableAnagrams.length === 0) {
      return null;
    }

    // Filter by category if specified
    let filteredAnagrams = availableAnagrams;
    if (options.category) {
      filteredAnagrams = availableAnagrams.filter(
        anagram => anagram.category === options.category
      );
    }

    // Filter out used anagrams if requested
    if (options.excludeUsed !== false) {
      filteredAnagrams = filteredAnagrams.filter(
        anagram => !this.usedAnagrams.has(anagram.id)
      );
    }

    // If no unused anagrams, reset the used set for this difficulty
    if (filteredAnagrams.length === 0 && options.excludeUsed !== false) {
      this.resetUsedAnagrams(difficulty);
      
      // Re-filter without used anagram restriction
      filteredAnagrams = availableAnagrams;
      if (options.category) {
        filteredAnagrams = filteredAnagrams.filter(
          anagram => anagram.category === options.category
        );
      }
    }

    if (filteredAnagrams.length === 0) {
      return null;
    }

    // Select random anagram
    const randomIndex = Math.floor(Math.random() * filteredAnagrams.length);
    const selectedAnagram = filteredAnagrams[randomIndex];

    // Mark as used
    this.markAsUsed(selectedAnagram.id);

    return selectedAnagram;
  }

  /**
   * Get contextual hint for a word using Words API
   * 
   * @param word Word to get hint for
   * @returns Object with category and hint text
   */
  private async getContextualHint(word: string): Promise<{ category: string; hint: string }> {
    try {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_WORDS_API_KEY;
      if (!apiKey) {
        return this.getFallbackHint(word);
      }
      
      const result = await this.wordsAPI.validateWord(word);
      
      if (result.valid && result.definition) {
        const def = result.definition;
        
        // Extract first definition
        if (def.definitions && def.definitions.length > 0) {
          const firstDef = def.definitions[0];
          const partOfSpeech = firstDef.partOfSpeech || 'word';
          let definition = firstDef.definition || '';
          
          // Shorten definition if too long (keep it concise)
          if (definition.length > 60) {
            definition = definition.substring(0, 57) + '...';
          }
          
          return {
            category: partOfSpeech,
            hint: definition
          };
        }
        
        // Fallback to part of speech if available
        if (def.definitions && def.definitions.length > 0) {
          return {
            category: def.definitions[0].partOfSpeech || 'word',
            hint: `A ${def.definitions[0].partOfSpeech || 'word'}`
          };
        }
      }
    } catch (error) {
      // Silently fall back - don't show errors to user
    }
    
    // Fallback hint
    return this.getFallbackHint(word);
  }

  /**
   * Generate fallback hint when API is unavailable
   * Uses smart categorization based on word patterns
   */
  private getFallbackHint(word: string): { category: string; hint: string } {
    const length = word.length;
    const firstLetter = word[0].toUpperCase();
    
    // Generate helpful fallback based on word characteristics
    let hint = '';
    let category = 'word';
    
    // Common word patterns
    if (word.endsWith('ing')) {
      category = 'verb';
      hint = 'An action or activity';
    } else if (word.endsWith('ly')) {
      category = 'adverb';
      hint = 'Describes how something is done';
    } else if (word.endsWith('tion') || word.endsWith('sion')) {
      category = 'noun';
      hint = 'A thing or concept';
    } else if (word.endsWith('er') || word.endsWith('or')) {
      category = 'noun';
      hint = 'A person or thing that does something';
    } else if (word.endsWith('ed')) {
      category = 'verb';
      hint = 'Past tense action';
    } else if (word.endsWith('ful') || word.endsWith('less')) {
      category = 'adjective';
      hint = 'Describes a quality';
    } else {
      // Generic hint with first letter
      hint = `Starts with "${firstLetter}"`;
      category = 'word';
    }
    
    return { category, hint };
  }

  /**
   * Get next anagram with automatic difficulty progression
   * @returns Selected anagram with potentially increased difficulty
   */
  async getNextAnagram(): Promise<AnagramSet | null> {
    return this.getAnagram({ difficulty: this.currentDifficulty as 1 | 2 | 3 | 4 | 5 });
  }

  /**
   * Get current word generation mode
   */
  getMode(): WordMode {
    return this.mode;
  }

  /**
   * Set word generation mode
   * 
   * @param mode New mode ('curated' | 'hybrid' | 'unlimited-only')
   */
  setMode(mode: WordMode): void {
    this.mode = mode;
    this.saveMode();
    
    // Track analytics
    if (mode === 'unlimited-only') {
      this.trackAnalytics('UNLIMITED_MODE_ENABLED', { mode });
    }
  }

  /**
   * Load mode from localStorage
   */
  private loadMode(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && this.isValidMode(stored)) {
        this.mode = stored as WordMode;
      }
    } catch (error) {
      console.warn('Failed to load word mode from localStorage:', error);
    }
  }

  /**
   * Save mode to localStorage
   */
  private saveMode(): void {
    try {
      localStorage.setItem(this.storageKey, this.mode);
    } catch (error) {
      console.warn('Failed to save word mode to localStorage:', error);
    }
  }

  /**
   * Validate mode string
   */
  private isValidMode(mode: string): mode is WordMode {
    return mode === 'curated' || mode === 'hybrid' || mode === 'unlimited-only';
  }

  /**
   * Track analytics event (placeholder for actual analytics integration)
   */
  private trackAnalytics(_event: string, _data: Record<string, unknown>): void {
    // TODO: Integrate with actual analytics system (SCRAM-024)
  }

  /**
   * Mark an anagram as used in this session
   * @param anagramId ID of the anagram to mark as used
   */
  markAsUsed(anagramId: string): void {
    this.usedAnagrams.add(anagramId);
  }

  /**
   * Check if an anagram has been used in this session
   * @param anagramId ID of the anagram to check
   * @returns True if anagram has been used
   */
  isUsed(anagramId: string): boolean {
    return this.usedAnagrams.has(anagramId);
  }

  /**
   * Reset used anagrams for a specific difficulty level
   * @param difficulty Difficulty level to reset (optional, resets all if not specified)
   */
  resetUsedAnagrams(difficulty?: number): void {
    if (difficulty) {
      const anagramsForLevel = ANAGRAM_SETS[difficulty] || [];
      anagramsForLevel.forEach(anagram => {
        this.usedAnagrams.delete(anagram.id);
      });
    } else {
      this.usedAnagrams.clear();
    }
  }

  /**
   * Get current difficulty level
   */
  getCurrentDifficulty(): number {
    return this.currentDifficulty;
  }

  /**
   * Set difficulty level
   * @param difficulty New difficulty level (1-5)
   */
  setDifficulty(difficulty: number): void {
    this.currentDifficulty = Math.max(1, Math.min(5, difficulty));
  }

  /**
   * Increase difficulty level (with progression logic)
   * @param increment Amount to increase (default: 1)
   */
  increaseDifficulty(increment: number = 1): void {
    this.currentDifficulty = Math.min(5, this.currentDifficulty + increment);
  }

  /**
   * Get statistics about anagram usage
   * @returns Usage statistics
   */
  getUsageStats(): {
    totalUsed: number;
    usedByDifficulty: Record<number, number>;
    availableByDifficulty: Record<number, number>;
    cacheStats: {
      size: number;
      hitRate: number;
      evictions: number;
    };
  } {
    const stats = {
      totalUsed: this.usedAnagrams.size,
      usedByDifficulty: {} as Record<number, number>,
      availableByDifficulty: {} as Record<number, number>,
      cacheStats: this.cache.getStats(),
    };

    // Calculate usage by difficulty
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      const anagramsForLevel = ANAGRAM_SETS[difficulty] || [];
      const usedForLevel = anagramsForLevel.filter(
        anagram => this.usedAnagrams.has(anagram.id)
      ).length;
      
      stats.usedByDifficulty[difficulty] = usedForLevel;
      stats.availableByDifficulty[difficulty] = anagramsForLevel.length - usedForLevel;
    }

    return stats;
  }

  /**
   * Get available categories for a difficulty level
   * @param difficulty Difficulty level to check
   * @returns Array of available categories
   */
  getAvailableCategories(difficulty?: number): string[] {
    const level = difficulty ?? this.currentDifficulty;
    const anagrams = ANAGRAM_SETS[level] || [];
    
    const categories = new Set<string>();
    anagrams.forEach(anagram => {
      if (anagram.category) {
        categories.add(anagram.category);
      }
    });

    return Array.from(categories).sort();
  }

  /**
   * Validate that an anagram solution is correct
   * @param anagramId ID of the anagram
   * @param userSolution User's proposed solution
   * @returns True if solution is correct
   */
  validateSolution(anagramId: string, userSolution: string): boolean {
    // Find the anagram across all difficulty levels
    const allAnagrams = Object.values(ANAGRAM_SETS).flat();
    const anagram = allAnagrams.find(a => a.id === anagramId);
    
    if (!anagram) {
      // Check if it's a generated anagram (not in curated sets)
      // For generated anagrams, we can't validate from static data
      console.warn(`Anagram with ID ${anagramId} not found in curated sets`);
      return false;
    }

    return anagram.solution.toLowerCase() === userSolution.toLowerCase();
  }

  /**
   * Get hint for an anagram
   * @param anagramId ID of the anagram
   * @returns Hint object or null if anagram not found
   */
  getHint(anagramId: string): { category: string; firstLetter: string } | null {
    const allAnagrams = Object.values(ANAGRAM_SETS).flat();
    const anagram = allAnagrams.find(a => a.id === anagramId);
    
    return anagram ? anagram.hints : null;
  }

  /**
   * Clear cache (for testing or manual reset)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
