// Core game logic and state management
// This module will contain GameEngine, GameStore classes

export interface GameState {
  currentAnagram: string;
  solution: string;
  timeRemaining: number;
  score: number;
  streak: number;
  difficulty: number;
  gameStatus: 'playing' | 'paused' | 'ended';
}

// Placeholder - will be implemented in SCRAM-002
export class GameEngine {
  constructor() {
    console.log('GameEngine initialized - placeholder');
  }
}