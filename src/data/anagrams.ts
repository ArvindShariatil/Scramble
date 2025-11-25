// Anagram data and dictionary
// This module will contain curated anagram sets and word lists

export interface AnagramSet {
  id: string;
  scrambled: string;
  solution: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category?: string;
  hints: {
    category: string;
    firstLetter: string;
  };
}

// Placeholder - will be implemented in SCRAM-003  
export const ANAGRAM_SETS: Record<number, AnagramSet[]> = {
  1: [
    { 
      id: 'easy-001', 
      scrambled: 'AERT', 
      solution: 'TEAR', 
      difficulty: 1, 
      hints: { category: 'emotion', firstLetter: 'T' }
    }
  ]
};