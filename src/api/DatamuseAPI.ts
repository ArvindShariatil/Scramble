/**
 * DatamuseAPI Client
 * 
 * Fetches random words from Datamuse API filtered by difficulty level.
 * Uses word frequency data to map difficulty (1-5) to appropriate word complexity.
 * 
 * API: https://api.datamuse.com/words
 * Rate Limit: 100,000 requests/day (no authentication required)
 */

/**
 * Datamuse API word response
 */
interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[]; // Contains frequency data: ["f:12.34"]
}

/**
 * Difficulty parameters for word generation
 */
interface DifficultyParams {
  minLength: number;
  maxLength: number;
  minFrequency: number; // Frequency per million words
}

/**
 * Custom error for Datamuse API failures
 */
export class DatamuseAPIError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatamuseAPIError';
  }
}

/**
 * Datamuse API Client
 * 
 * Provides random word generation with difficulty-based filtering.
 */
export class DatamuseAPI {
  private readonly baseURL = 'https://api.datamuse.com/words';
  private readonly timeout = 500; // ms - matches WordsAPI timeout pattern

  /**
   * Get a random word for the specified difficulty level
   * 
   * @param difficulty - Difficulty level (1=easiest, 5=hardest)
   * @returns Promise resolving to a word string
   * @throws DatamuseAPIError on network failure, timeout, or invalid response
   */
  async getRandomWord(difficulty: 1 | 2 | 3 | 4 | 5): Promise<string> {
    const params = this.getDifficultyParams(difficulty);
    
    try {
      // Build URL with wildcard pattern for word length
      const pattern = '?'.repeat(params.minLength);
      const url = `${this.baseURL}?sp=${pattern}&md=f&max=100`;
      
      // Fetch with timeout
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new DatamuseAPIError(
          `Datamuse API returned ${response.status}: ${response.statusText}`
        );
      }
      
      const words: DatamuseWord[] = await response.json();
      
      if (!Array.isArray(words) || words.length === 0) {
        throw new DatamuseAPIError('No words returned from Datamuse API');
      }
      
      // Filter by frequency and select random word
      return this.selectByFrequency(words, params);
      
    } catch (error) {
      if (error instanceof DatamuseAPIError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DatamuseAPIError('Datamuse API request timeout (500ms)', error);
      }
      
      throw new DatamuseAPIError(
        'Failed to fetch word from Datamuse API',
        error
      );
    }
  }

  /**
   * Map difficulty level to word length and frequency constraints
   * 
   * Difficulty progression:
   * 1: Short, common words (MAKE, JUMP)
   * 2: Medium length, common words (PLATE, HOUSE)
   * 3: Medium length, moderate frequency (FROZEN, GARDEN)
   * 4: Longer words, less common (BLANKET, CRYSTAL)
   * 5: Long, rare words (ELEPHANT, BREAKFAST)
   */
  private getDifficultyParams(difficulty: 1 | 2 | 3 | 4 | 5): DifficultyParams {
    const paramsMap: Record<number, DifficultyParams> = {
      1: { minLength: 4, maxLength: 5, minFrequency: 20 },   // 4-5 letters, high frequency
      2: { minLength: 5, maxLength: 6, minFrequency: 10 },   // 5-6 letters, medium-high
      3: { minLength: 6, maxLength: 7, minFrequency: 5 },    // 6-7 letters, medium
      4: { minLength: 7, maxLength: 8, minFrequency: 2 },    // 7-8 letters, medium-low
      5: { minLength: 8, maxLength: 12, minFrequency: 0.5 }, // 8+ letters, low frequency
    };

    return paramsMap[difficulty];
  }

  /**
   * Select a random word from results filtered by frequency and length
   * 
   * @param words - Array of words from Datamuse API
   * @param params - Difficulty parameters for filtering
   * @returns Selected word
   */
  private selectByFrequency(
    words: DatamuseWord[],
    params: DifficultyParams
  ): string {
    // Filter by length and frequency
    const filtered = words.filter((wordObj) => {
      const word = wordObj.word;
      
      // Length check
      if (word.length < params.minLength || word.length > params.maxLength) {
        return false;
      }
      
      // Only alphabetic characters (no hyphens, apostrophes, etc.)
      if (!/^[a-z]+$/i.test(word)) {
        return false;
      }
      
      // Frequency check
      const frequency = this.extractFrequency(wordObj);
      if (frequency < params.minFrequency) {
        return false;
      }
      
      return true;
    });

    if (filtered.length === 0) {
      throw new DatamuseAPIError(
        `No words match criteria for difficulty (length: ${params.minLength}-${params.maxLength}, freq: ${params.minFrequency}+)`
      );
    }

    // Select random word from filtered results
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex].word.toLowerCase();
  }

  /**
   * Extract frequency value from Datamuse word tags
   * 
   * @param wordObj - Word object from Datamuse API
   * @returns Frequency per million words, or 0 if not found
   */
  private extractFrequency(wordObj: DatamuseWord): number {
    if (!wordObj.tags || wordObj.tags.length === 0) {
      return 0;
    }

    // Find frequency tag (format: "f:12.34")
    const freqTag = wordObj.tags.find((tag) => tag.startsWith('f:'));
    if (!freqTag) {
      return 0;
    }

    const freqStr = freqTag.substring(2); // Remove "f:" prefix
    const frequency = parseFloat(freqStr);
    
    return isNaN(frequency) ? 0 : frequency;
  }

  /**
   * Fetch with AbortController timeout
   * 
   * @param url - URL to fetch
   * @returns Promise resolving to Response
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
