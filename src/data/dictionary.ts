// Local dictionary for offline word validation
// This module will contain common English words for fallback

// Placeholder - will be implemented in SCRAM-007
export const COMMON_WORDS = [
  'tear', 'rate', 'care', 'race', 'dare',
  'bear', 'dear', 'fear', 'gear', 'hear'
  // ... will contain 5000+ words
];

export class LocalDictionary {
  private _words: Set<string> = new Set(); // Placeholder for SCRAM-007
  
  constructor() {
    console.log('LocalDictionary initialized - placeholder');
  }
  
  async validateWord(word: string): Promise<boolean> {
    console.log(`Local validation: ${word} - placeholder`);
    return true;
  }
}