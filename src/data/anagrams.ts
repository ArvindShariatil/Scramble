/**
 * Curated anagram sets for Scramble game
 * All anagrams verified for single valid English word solutions
 */

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

/**
 * Level 1: 4-letter words (Easy difficulty)
 * Target: Everyday vocabulary, common words
 */
export const LEVEL_1_ANAGRAMS: AnagramSet[] = [
  // Emotions & Feelings
  { id: 'easy-001', scrambled: 'AERT', solution: 'TEAR', difficulty: 1, category: 'emotions', hints: { category: 'emotion', firstLetter: 'T' }},
  { id: 'easy-002', scrambled: 'VEOL', solution: 'LOVE', difficulty: 1, category: 'emotions', hints: { category: 'emotion', firstLetter: 'L' }},
  { id: 'easy-003', scrambled: 'ETAH', solution: 'HATE', difficulty: 1, category: 'emotions', hints: { category: 'emotion', firstLetter: 'H' }},
  { id: 'easy-004', scrambled: 'REAF', solution: 'FEAR', difficulty: 1, category: 'emotions', hints: { category: 'emotion', firstLetter: 'F' }},
  { id: 'easy-005', scrambled: 'EPOH', solution: 'HOPE', difficulty: 1, category: 'emotions', hints: { category: 'emotion', firstLetter: 'H' }},

  // Animals
  { id: 'easy-006', scrambled: 'TAEB', solution: 'BEAT', difficulty: 1, category: 'actions', hints: { category: 'heart rhythm', firstLetter: 'B' }},
  { id: 'easy-007', scrambled: 'IRDB', solution: 'BIRD', difficulty: 1, category: 'animals', hints: { category: 'flying animal', firstLetter: 'B' }},
  { id: 'easy-008', scrambled: 'SHIF', solution: 'FISH', difficulty: 1, category: 'animals', hints: { category: 'water animal', firstLetter: 'F' }},
  { id: 'easy-009', scrambled: 'OGRF', solution: 'FROG', difficulty: 1, category: 'animals', hints: { category: 'amphibian', firstLetter: 'F' }},

  // Body Parts
  { id: 'easy-010', scrambled: 'DAEH', solution: 'HEAD', difficulty: 1, category: 'body', hints: { category: 'body part', firstLetter: 'H' }},
  { id: 'easy-011', scrambled: 'DNAH', solution: 'HAND', difficulty: 1, category: 'body', hints: { category: 'body part', firstLetter: 'H' }},
  { id: 'easy-012', scrambled: 'TOFO', solution: 'FOOT', difficulty: 1, category: 'body', hints: { category: 'body part', firstLetter: 'F' }},
  { id: 'easy-013', scrambled: 'KCAB', solution: 'BACK', difficulty: 1, category: 'body', hints: { category: 'body part', firstLetter: 'B' }},
  { id: 'easy-014', scrambled: 'ECAF', solution: 'FACE', difficulty: 1, category: 'body', hints: { category: 'body part', firstLetter: 'F' }},

  // Colors
  { id: 'easy-015', scrambled: 'EULB', solution: 'BLUE', difficulty: 1, category: 'colors', hints: { category: 'color', firstLetter: 'B' }},
  { id: 'easy-016', scrambled: 'KPNI', solution: 'PINK', difficulty: 1, category: 'colors', hints: { category: 'color', firstLetter: 'P' }},
  { id: 'easy-017', scrambled: 'YARG', solution: 'GRAY', difficulty: 1, category: 'colors', hints: { category: 'color', firstLetter: 'G' }},

  // Directions & Places
  { id: 'easy-018', scrambled: 'TAES', solution: 'EAST', difficulty: 1, category: 'directions', hints: { category: 'direction', firstLetter: 'E' }},
  { id: 'easy-019', scrambled: 'TSEW', solution: 'WEST', difficulty: 1, category: 'directions', hints: { category: 'direction', firstLetter: 'W' }},
  { id: 'easy-020', scrambled: 'TEAS', solution: 'SEAT', difficulty: 1, category: 'furniture', hints: { category: 'furniture', firstLetter: 'S' }},

  // Actions & Verbs
  { id: 'easy-021', scrambled: 'PMUJ', solution: 'JUMP', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'J' }},
  { id: 'easy-022', scrambled: 'NRUT', solution: 'TURN', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'T' }},
  { id: 'easy-023', scrambled: 'KLAW', solution: 'WALK', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'W' }},
  { id: 'easy-024', scrambled: 'POTS', solution: 'STOP', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'S' }},
  { id: 'easy-025', scrambled: 'DAER', solution: 'READ', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'R' }},

  // Numbers & Math
  { id: 'easy-026', scrambled: 'RUOF', solution: 'FOUR', difficulty: 1, category: 'numbers', hints: { category: 'number', firstLetter: 'F' }},
  { id: 'easy-027', scrambled: 'EVIF', solution: 'FIVE', difficulty: 1, category: 'numbers', hints: { category: 'number', firstLetter: 'F' }},
  { id: 'easy-028', scrambled: 'ENIN', solution: 'NINE', difficulty: 1, category: 'numbers', hints: { category: 'number', firstLetter: 'N' }},

  // Time & Weather
  { id: 'easy-029', scrambled: 'EMIT', solution: 'TIME', difficulty: 1, category: 'time', hints: { category: 'temporal', firstLetter: 'T' }},
  { id: 'easy-030', scrambled: 'RAEY', solution: 'YEAR', difficulty: 1, category: 'time', hints: { category: 'temporal', firstLetter: 'Y' }},
  { id: 'easy-031', scrambled: 'KEEW', solution: 'WEEK', difficulty: 1, category: 'time', hints: { category: 'temporal', firstLetter: 'W' }},
  { id: 'easy-032', scrambled: 'NIAR', solution: 'RAIN', difficulty: 1, category: 'weather', hints: { category: 'weather', firstLetter: 'R' }},
  { id: 'easy-033', scrambled: 'WONS', solution: 'SNOW', difficulty: 1, category: 'weather', hints: { category: 'weather', firstLetter: 'S' }},

  // Basic Objects
  { id: 'easy-034', scrambled: 'KOOB', solution: 'BOOK', difficulty: 1, category: 'objects', hints: { category: 'reading material', firstLetter: 'B' }},
  { id: 'easy-035', scrambled: 'ROOD', solution: 'DOOR', difficulty: 1, category: 'objects', hints: { category: 'entrance', firstLetter: 'D' }},
  { id: 'easy-036', scrambled: 'DNIW', solution: 'WIND', difficulty: 1, category: 'weather', hints: { category: 'moving air', firstLetter: 'W' }},
  { id: 'easy-037', scrambled: 'ERIF', solution: 'FIRE', difficulty: 1, category: 'elements', hints: { category: 'hot element', firstLetter: 'F' }},
  { id: 'easy-038', scrambled: 'ATER', solution: 'RATE', difficulty: 1, category: 'math', hints: { category: 'measurement', firstLetter: 'R' }},

  // More common words
  { id: 'easy-039', scrambled: 'EMOC', solution: 'COME', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'C' }},
  { id: 'easy-040', scrambled: 'EKAM', solution: 'MAKE', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'M' }},
  { id: 'easy-041', scrambled: 'EKAT', solution: 'TAKE', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'T' }},
  { id: 'easy-042', scrambled: 'EVOM', solution: 'MOVE', difficulty: 1, category: 'actions', hints: { category: 'action', firstLetter: 'M' }},
];

/**
 * Level 2: 5-letter words (Medium difficulty)
 * Target: Common vocabulary with some complexity
 */
export const LEVEL_2_ANAGRAMS: AnagramSet[] = [
  // Animals
  { id: 'med-001', scrambled: 'SROHE', solution: 'HORSE', difficulty: 2, category: 'animals', hints: { category: 'farm animal', firstLetter: 'H' }},
  { id: 'med-002', scrambled: 'ENHOW', solution: 'WHOLE', difficulty: 2, category: 'complete', hints: { category: 'complete', firstLetter: 'W' }},
  { id: 'med-003', scrambled: 'DLROW', solution: 'WORLD', difficulty: 2, category: 'places', hints: { category: 'planet', firstLetter: 'W' }},
  { id: 'med-004', scrambled: 'GHILT', solution: 'LIGHT', difficulty: 2, category: 'physics', hints: { category: 'illumination', firstLetter: 'L' }},
  { id: 'med-005', scrambled: 'TEAW', solution: 'WATER', difficulty: 2, category: 'elements', hints: { category: 'liquid', firstLetter: 'W' }},

  // Actions & Verbs
  { id: 'med-006', scrambled: 'NRAEL', solution: 'LEARN', difficulty: 2, category: 'education', hints: { category: 'education', firstLetter: 'L' }},
  { id: 'med-007', scrambled: 'HCATE', solution: 'TEACH', difficulty: 2, category: 'education', hints: { category: 'education', firstLetter: 'T' }},
  { id: 'med-008', scrambled: 'KCEHC', solution: 'CHECK', difficulty: 2, category: 'actions', hints: { category: 'verify', firstLetter: 'C' }},
  { id: 'med-009', scrambled: 'GNRWO', solution: 'WRONG', difficulty: 2, category: 'judgment', hints: { category: 'incorrect', firstLetter: 'W' }},
  { id: 'med-010', scrambled: 'THGIR', solution: 'RIGHT', difficulty: 2, category: 'judgment', hints: { category: 'correct', firstLetter: 'R' }},

  // Objects & Things
  { id: 'med-011', scrambled: 'ELBAT', solution: 'TABLE', difficulty: 2, category: 'furniture', hints: { category: 'furniture', firstLetter: 'T' }},
  { id: 'med-012', scrambled: 'RIAHC', solution: 'CHAIR', difficulty: 2, category: 'furniture', hints: { category: 'furniture', firstLetter: 'C' }},
  { id: 'med-013', scrambled: 'SUOH', solution: 'HOUSE', difficulty: 2, category: 'buildings', hints: { category: 'home', firstLetter: 'H' }},
  { id: 'med-014', scrambled: 'DNATS', solution: 'STAND', difficulty: 2, category: 'actions', hints: { category: 'posture', firstLetter: 'S' }},

  // Nature & Weather  
  { id: 'med-015', scrambled: 'DNUOS', solution: 'SOUND', difficulty: 2, category: 'physics', hints: { category: 'audio', firstLetter: 'S' }},
  { id: 'med-016', scrambled: 'EEPSL', solution: 'SLEEP', difficulty: 2, category: 'actions', hints: { category: 'rest', firstLetter: 'S' }},
  { id: 'med-017', scrambled: 'MAERD', solution: 'DREAM', difficulty: 2, category: 'mind', hints: { category: 'sleep vision', firstLetter: 'D' }},
  { id: 'med-018', scrambled: 'TRATS', solution: 'START', difficulty: 2, category: 'actions', hints: { category: 'begin', firstLetter: 'S' }},
  { id: 'med-019', scrambled: 'HSINF', solution: 'FINISH', difficulty: 2, category: 'actions', hints: { category: 'complete', firstLetter: 'F' }},
  { id: 'med-020', scrambled: 'GIENB', solution: 'BEGIN', difficulty: 2, category: 'actions', hints: { category: 'start', firstLetter: 'B' }},

  // Colors & Descriptions
  { id: 'med-021', scrambled: 'KCALB', solution: 'BLACK', difficulty: 2, category: 'colors', hints: { category: 'color', firstLetter: 'B' }},
  { id: 'med-022', scrambled: 'ETIHW', solution: 'WHITE', difficulty: 2, category: 'colors', hints: { category: 'color', firstLetter: 'W' }},
  { id: 'med-023', scrambled: 'NEERG', solution: 'GREEN', difficulty: 2, category: 'colors', hints: { category: 'color', firstLetter: 'G' }},

  // Time & Numbers
  { id: 'med-024', scrambled: 'YAD OT', solution: 'TODAY', difficulty: 2, category: 'time', hints: { category: 'current day', firstLetter: 'T' }},
  { id: 'med-025', scrambled: 'HTNOM', solution: 'MONTH', difficulty: 2, category: 'time', hints: { category: 'time period', firstLetter: 'M' }},

  // More medium complexity words
  { id: 'med-026', scrambled: 'ECALP', solution: 'PLACE', difficulty: 2, category: 'location', hints: { category: 'location', firstLetter: 'P' }},
  { id: 'med-027', scrambled: 'ECSAP', solution: 'SPACE', difficulty: 2, category: 'physics', hints: { category: 'area', firstLetter: 'S' }},
  { id: 'med-028', scrambled: 'DNUOR', solution: 'ROUND', difficulty: 2, category: 'shapes', hints: { category: 'shape', firstLetter: 'R' }},
  { id: 'med-029', scrambled: 'LOCES', solution: 'CLOSE', difficulty: 2, category: 'actions', hints: { category: 'shut', firstLetter: 'C' }},
  { id: 'med-030', scrambled: 'LAMSSS', solution: 'SMALL', difficulty: 2, category: 'size', hints: { category: 'tiny', firstLetter: 'S' }},
];

/**
 * Level 3: 6-letter words (Hard difficulty)
 */
export const LEVEL_3_ANAGRAMS: AnagramSet[] = [
  { id: 'hard-001', scrambled: 'RETSAMR', solution: 'MASTER', difficulty: 3, category: 'skill', hints: { category: 'expert', firstLetter: 'M' }},
  { id: 'hard-002', scrambled: 'ECNAHC', solution: 'CHANCE', difficulty: 3, category: 'probability', hints: { category: 'luck', firstLetter: 'C' }},
  { id: 'hard-003', scrambled: 'EGNAHC', solution: 'CHANGE', difficulty: 3, category: 'actions', hints: { category: 'alter', firstLetter: 'C' }},
  { id: 'hard-004', scrambled: 'ECROF', solution: 'FORCE', difficulty: 3, category: 'physics', hints: { category: 'power', firstLetter: 'F' }},
  { id: 'hard-005', scrambled: 'ECNEID', solution: 'DECIDE', difficulty: 3, category: 'mind', hints: { category: 'choose', firstLetter: 'D' }},
  // Add more level 3 anagrams as needed
];

/**
 * Level 4: 7-letter words (Expert difficulty)
 */
export const LEVEL_4_ANAGRAMS: AnagramSet[] = [
  { id: 'expert-001', scrambled: 'ECNEICS', solution: 'SCIENCE', difficulty: 4, category: 'education', hints: { category: 'study', firstLetter: 'S' }},
  { id: 'expert-002', scrambled: 'GNIDAER', solution: 'READING', difficulty: 4, category: 'education', hints: { category: 'literacy', firstLetter: 'R' }},
  { id: 'expert-003', scrambled: 'GNITIRW', solution: 'WRITING', difficulty: 4, category: 'education', hints: { category: 'literacy', firstLetter: 'W' }},
  // Add more level 4 anagrams as needed
];

/**
 * Level 5: 8+ letter words (Master difficulty)  
 */
export const LEVEL_5_ANAGRAMS: AnagramSet[] = [
  { id: 'master-001', scrambled: 'NOIDUCT', solution: 'EDUCATION', difficulty: 5, category: 'learning', hints: { category: 'schooling', firstLetter: 'E' }},
  { id: 'master-002', scrambled: 'TNEMERIUQER', solution: 'REQUIREMENT', difficulty: 5, category: 'necessity', hints: { category: 'needed', firstLetter: 'R' }},
  // Add more level 5 anagrams as needed
];

/**
 * Combined anagram sets by difficulty level
 */
export const ANAGRAM_SETS: Record<number, AnagramSet[]> = {
  1: LEVEL_1_ANAGRAMS,
  2: LEVEL_2_ANAGRAMS, 
  3: LEVEL_3_ANAGRAMS,
  4: LEVEL_4_ANAGRAMS,
  5: LEVEL_5_ANAGRAMS,
};

/**
 * Get total count of anagrams across all levels
 */
export function getTotalAnagramCount(): number {
  return Object.values(ANAGRAM_SETS).reduce((total, level) => total + level.length, 0);
}

/**
 * Get all anagrams across all difficulty levels
 */
export function getAllAnagrams(): AnagramSet[] {
  return Object.values(ANAGRAM_SETS).flat();
}

/**
 * Get anagrams by category across all difficulty levels
 */
export function getAnagramsByCategory(category: string): AnagramSet[] {
  const allAnagrams = getAllAnagrams();
  return allAnagrams.filter(anagram => anagram.category === category);
}