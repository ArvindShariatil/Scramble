/**
 * Core game state interface for Scramble anagram game
 * Manages all game data and status information
 */

export interface GameState {
  currentAnagram: string;
  solution: string;
  timeRemaining: number;
  score: number;
  streak: number;
  difficulty: number;
  gameStatus: 'playing' | 'paused' | 'ended' | 'timeout-reveal';
  currentAnagramId?: string; // Add anagram ID for tracking
  usedAnagrams?: string[];   // Track used anagram IDs
  timerStatus?: 'idle' | 'running' | 'paused' | 'finished'; // Timer state
  roundDuration?: number;    // Duration of current round in seconds
  totalScore?: number;       // Cumulative score across all rounds
  correctAnswers?: number;   // Total correct answers count
  totalAnswers?: number;     // Total answers attempted
  bestStreak?: number;       // Highest streak achieved
  lastScoreBreakdown?: {     // Last score calculation details
    baseScore: number;
    speedMultiplier: number;
    streakBonus: number;
    finalScore: number;
  };
}

/**
 * Default initial state for new games
 */
export const DEFAULT_GAME_STATE: GameState = {
  currentAnagram: '',
  solution: '',
  timeRemaining: 60,
  score: 0,
  streak: 0,
  difficulty: 1,
  gameStatus: 'ended',
  currentAnagramId: undefined,
  usedAnagrams: [],
  timerStatus: 'idle',
  roundDuration: 60,
  totalScore: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  bestStreak: 0,
  lastScoreBreakdown: undefined
};

/**
 * Type guard to validate GameState objects
 */
export function isValidGameState(state: any): state is GameState {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof state.currentAnagram === 'string' &&
    typeof state.solution === 'string' &&
    typeof state.timeRemaining === 'number' &&
    typeof state.score === 'number' &&
    typeof state.streak === 'number' &&
    typeof state.difficulty === 'number' &&
    ['playing', 'paused', 'ended'].includes(state.gameStatus) &&
    (state.currentAnagramId === undefined || typeof state.currentAnagramId === 'string') &&
    (state.usedAnagrams === undefined || Array.isArray(state.usedAnagrams)) &&
    (state.timerStatus === undefined || ['idle', 'running', 'paused', 'finished'].includes(state.timerStatus)) &&
    (state.roundDuration === undefined || typeof state.roundDuration === 'number') &&
    (state.totalScore === undefined || typeof state.totalScore === 'number') &&
    (state.correctAnswers === undefined || typeof state.correctAnswers === 'number') &&
    (state.totalAnswers === undefined || typeof state.totalAnswers === 'number') &&
    (state.bestStreak === undefined || typeof state.bestStreak === 'number') &&
    (state.lastScoreBreakdown === undefined || typeof state.lastScoreBreakdown === 'object')
  );
}