import type { AnagramSet } from '../data/anagrams';
import { ANAGRAM_SETS } from '../data/anagrams';

/**
 * Options for anagram generation
 */
export interface GeneratorOptions {
  difficulty?: 1 | 2 | 3 | 4 | 5;
  category?: string;
  excludeUsed?: boolean;
}

/**
 * AnagramGenerator manages anagram selection and session tracking
 * Prevents duplicates within same session and provides difficulty-based selection
 */
export class AnagramGenerator {
  private usedAnagrams: Set<string> = new Set();
  private currentDifficulty: number = 1;

  constructor(initialDifficulty: number = 1) {
    this.currentDifficulty = Math.max(1, Math.min(5, initialDifficulty));
  }

  /**
   * Get a random anagram for the specified difficulty level
   * @param options Generation options
   * @returns Selected anagram set or null if none available
   */
  getAnagram(options: GeneratorOptions = {}): AnagramSet | null {
    const difficulty = options.difficulty ?? this.currentDifficulty;
    const availableAnagrams = ANAGRAM_SETS[difficulty] || [];

    if (availableAnagrams.length === 0) {
      console.warn(`No anagrams available for difficulty level ${difficulty}`);
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
      console.log(`All anagrams used for difficulty ${difficulty}, resetting...`);
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
   * Get next anagram with automatic difficulty progression
   * @returns Selected anagram with potentially increased difficulty
   */
  getNextAnagram(): AnagramSet | null {
    return this.getAnagram({ difficulty: this.currentDifficulty as 1 | 2 | 3 | 4 | 5 });
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
  } {
    const stats = {
      totalUsed: this.usedAnagrams.size,
      usedByDifficulty: {} as Record<number, number>,
      availableByDifficulty: {} as Record<number, number>
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
      console.warn(`Anagram with ID ${anagramId} not found`);
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
}