/**
 * WordScrambler - Smart anagram generation for API-fetched words
 * 
 * SCRAM-020: Creates challenging anagrams by avoiding obvious patterns
 * (common prefixes/suffixes) and ensuring visual distance from original.
 * 
 * Quality Rules:
 * - Must differ from original
 * - Avoid common prefixes (TH, UN, RE, IN, DE, EX, PRE, COM)
 * - Avoid common suffixes (ING, ED, LY, ER, EST, TION, ABLE)
 * - Visual distance >2 (position-based difference metric)
 * 
 * @epic Epic-006 - Unlimited Word Generation
 * @feature-flag EPIC_6_ENABLED
 */

/**
 * Common English prefixes to avoid in scrambled output
 */
const COMMON_PREFIXES = ['TH', 'UN', 'RE', 'IN', 'DE', 'EX', 'PRE', 'COM'];

/**
 * Common English suffixes to avoid in scrambled output
 */
const COMMON_SUFFIXES = ['ING', 'ED', 'LY', 'ER', 'EST', 'TION', 'ABLE'];

/**
 * Maximum shuffle attempts before returning best available scramble
 */
const MAX_SHUFFLE_ATTEMPTS = 5;

/**
 * Minimum visual distance required between original and scrambled word
 */
const MIN_VISUAL_DISTANCE = 2;

/**
 * WordScrambler - Stateless scrambling with quality validation
 */
export class WordScrambler {
  /**
   * Scramble a word into a challenging anagram
   * 
   * Algorithm:
   * 1. Convert to uppercase for pattern matching
   * 2. Attempt Fisher-Yates shuffle up to 5 times
   * 3. Validate against quality rules
   * 4. Return best scramble found (even if not perfect)
   * 
   * @param word - Original word to scramble
   * @returns Scrambled word (guaranteed to differ from original)
   * 
   * @example
   * scramble('HELLO') // Returns: 'LOHEL' (or similar valid scramble)
   * scramble('THE') // Returns: 'ETH' (avoids TH prefix)
   */
  scramble(word: string): string {
    if (!word || word.length < 2) {
      throw new Error('Word must be at least 2 characters long');
    }

    const original = word.toUpperCase();
    const letters = original.split('');
    
    // Special case: 2-letter words - just reverse (unless both letters are same)
    if (letters.length === 2) {
      if (letters[0] === letters[1]) {
        // Can't scramble two identical letters differently - add marker or throw
        throw new Error('Cannot scramble word with all identical letters');
      }
      return letters.reverse().join('').toLowerCase();
    }
    
    // Check if all letters are identical (e.g., AAA, AAAA)
    const uniqueLetters = new Set(letters);
    if (uniqueLetters.size === 1) {
      throw new Error('Cannot scramble word with all identical letters');
    }

    let bestScramble = '';
    let bestScore = -1;

    // Try up to MAX_SHUFFLE_ATTEMPTS to find a good scramble
    for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt++) {
      const shuffled = this.shuffle([...letters]).join('');
      
      // Calculate quality score (higher is better)
      const score = this.calculateQualityScore(original, shuffled);
      
      if (score > bestScore) {
        bestScore = score;
        bestScramble = shuffled;
      }

      // If we found a perfect scramble, use it immediately
      if (this.isGoodScramble(original, shuffled)) {
        return shuffled.toLowerCase();
      }
    }

    // Ensure we never return the original word
    if (bestScramble === original) {
      // Force a difference by swapping first two distinct letters
      const letters = bestScramble.split('');
      for (let i = 0; i < letters.length - 1; i++) {
        if (letters[i] !== letters[i + 1]) {
          [letters[i], letters[i + 1]] = [letters[i + 1], letters[i]];
          bestScramble = letters.join('');
          break;
        }
      }
    }

    return bestScramble.toLowerCase();
  }

  /**
   * Fisher-Yates shuffle algorithm (unbiased randomness)
   * 
   * @param letters - Array of characters to shuffle
   * @returns Shuffled array (mutates in place and returns)
   */
  private shuffle(letters: string[]): string[] {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }

  /**
   * Validate scramble quality against all rules
   * 
   * Quality Rules:
   * 1. Must differ from original
   * 2. No common prefixes (case-insensitive)
   * 3. No common suffixes (case-insensitive)
   * 4. Visual distance >2
   * 
   * @param original - Original word (uppercase)
   * @param scrambled - Scrambled word (uppercase)
   * @returns true if ALL quality rules pass
   */
  private isGoodScramble(original: string, scrambled: string): boolean {
    // Rule 1: Must differ from original
    if (scrambled === original) {
      return false;
    }

    // Rule 2: No common prefixes
    if (this.hasCommonPrefix(scrambled)) {
      return false;
    }

    // Rule 3: No common suffixes
    if (this.hasCommonSuffix(scrambled)) {
      return false;
    }

    // Rule 4: Visual distance >2
    const distance = this.calculateVisualDistance(original, scrambled);
    if (distance <= MIN_VISUAL_DISTANCE) {
      return false;
    }

    return true;
  }

  /**
   * Calculate quality score for a scramble (0-100)
   * 
   * Higher score = better scramble
   * Scoring factors:
   * - Different from original: +40 points
   * - No common prefix: +20 points
   * - No common suffix: +20 points
   * - Visual distance: +20 points (scaled)
   * 
   * @param original - Original word (uppercase)
   * @param scrambled - Scrambled word (uppercase)
   * @returns Quality score (0-100)
   */
  private calculateQualityScore(original: string, scrambled: string): number {
    let score = 0;

    // Factor 1: Different from original (40 points)
    if (scrambled !== original) {
      score += 40;
    }

    // Factor 2: No common prefix (20 points)
    if (!this.hasCommonPrefix(scrambled)) {
      score += 20;
    }

    // Factor 3: No common suffix (20 points)
    if (!this.hasCommonSuffix(scrambled)) {
      score += 20;
    }

    // Factor 4: Visual distance (20 points scaled by distance)
    const distance = this.calculateVisualDistance(original, scrambled);
    const maxDistance = original.length; // Maximum possible distance
    const distanceScore = Math.min(20, (distance / maxDistance) * 20);
    score += distanceScore;

    return score;
  }

  /**
   * Check if word starts with a common prefix
   * 
   * @param word - Word to check (uppercase)
   * @returns true if word starts with common prefix
   */
  private hasCommonPrefix(word: string): boolean {
    return COMMON_PREFIXES.some(prefix => word.startsWith(prefix));
  }

  /**
   * Check if word ends with a common suffix
   * 
   * @param word - Word to check (uppercase)
   * @returns true if word ends with common suffix
   */
  private hasCommonSuffix(word: string): boolean {
    return COMMON_SUFFIXES.some(suffix => word.endsWith(suffix));
  }

  /**
   * Calculate visual distance between two words
   * 
   * Metric: Count positions where characters differ
   * Example: HELLO vs LOHEL = 4 positions differ
   * 
   * @param word1 - First word
   * @param word2 - Second word
   * @returns Number of differing positions
   */
  private calculateVisualDistance(word1: string, word2: string): number {
    if (word1.length !== word2.length) {
      return Math.max(word1.length, word2.length);
    }

    let distance = 0;
    for (let i = 0; i < word1.length; i++) {
      if (word1[i] !== word2[i]) {
        distance++;
      }
    }
    return distance;
  }
}

/**
 * Factory function for stateless scrambling
 * 
 * @param word - Word to scramble
 * @returns Scrambled word
 */
export function scrambleWord(word: string): string {
  const scrambler = new WordScrambler();
  return scrambler.scramble(word);
}
