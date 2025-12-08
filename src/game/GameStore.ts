import type { GameState } from './GameState';
import { DEFAULT_GAME_STATE, isValidGameState } from './GameState';
import { Timer, type TimerCallbacks, type TimerStatus } from './Timer';
import { ScoreCalculator, type ScoreBreakdown, type ScoreCalculationInput } from './ScoreCalculator';
import { AnagramValidator, type AnagramValidationResult } from './AnagramValidator';

/**
 * Callback function type for state change subscribers
 */
export type StateChangeCallback = (state: GameState) => void;

/**
 * Central game state store with reactive updates and persistence
 * Implements subscriber pattern for UI updates and sessionStorage persistence
 */
export class GameStore {
  private state: GameState;
  private subscribers: StateChangeCallback[] = [];
  private readonly STORAGE_KEY = 'scramble-game-state';
  private timer: Timer | null = null;
  private scoreCalculator: ScoreCalculator;
  private anagramValidator: AnagramValidator;

  constructor() {
    this.state = this.loadFromStorage() || { ...DEFAULT_GAME_STATE };
    this.scoreCalculator = new ScoreCalculator();
    this.anagramValidator = new AnagramValidator();
    this.initializeTimer();
  }

  /**
   * Get current game state (readonly)
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Update game state with partial changes
   * Triggers subscriber notifications and persistence
   */
  updateState(updates: Partial<GameState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Validate updated state
    if (!isValidGameState(this.state)) {
      console.error('Invalid state update, reverting:', updates);
      this.state = previousState;
      return;
    }

    this.notifySubscribers();
    this.persistToStorage();
  }

  /**
   * Reset game state to defaults
   */
  resetState(): void {
    this.state = { ...DEFAULT_GAME_STATE };
    this.notifySubscribers();
    this.persistToStorage();
  }

  /**
   * Subscribe to state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Error in state change subscriber:', error);
      }
    });
  }

  /**
   * Persist current state to sessionStorage
   */
  private persistToStorage(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to persist state to sessionStorage:', error);
    }
  }

  /**
   * Load state from sessionStorage with validation
   */
  private loadFromStorage(): GameState | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return isValidGameState(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Failed to load state from sessionStorage:', error);
      return null;
    }
  }

  /**
   * Clear persisted state (useful for testing/debugging)
   */
  clearPersistedState(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }

  /**
   * Submit a correct answer and calculate score
   */
  submitCorrectAnswer(solution: string): ScoreBreakdown {
    const input: ScoreCalculationInput = {
      wordLength: solution.length,
      timeRemaining: this.state.timeRemaining,
      currentStreak: this.state.streak,
      isSkipped: false
    };

    const scoreBreakdown = this.scoreCalculator.calculateScore(input);
    
    // Update game state with new score and stats
    this.updateState({
      score: this.state.score + scoreBreakdown.finalScore,
      totalScore: (this.state.totalScore || 0) + scoreBreakdown.finalScore,
      streak: this.state.streak + 1,
      correctAnswers: (this.state.correctAnswers || 0) + 1,
      totalAnswers: (this.state.totalAnswers || 0) + 1,
      bestStreak: Math.max(this.state.bestStreak || 0, this.state.streak + 1),
      lastScoreBreakdown: {
        baseScore: scoreBreakdown.baseScore,
        speedMultiplier: scoreBreakdown.speedMultiplier,
        streakBonus: scoreBreakdown.streakBonus,
        finalScore: scoreBreakdown.finalScore
      }
    });

    return scoreBreakdown;
  }

  /**
   * Submit an incorrect answer (breaks streak, no points)
   */
  submitIncorrectAnswer(): void {
    this.updateState({
      streak: 0,
      totalAnswers: (this.state.totalAnswers || 0) + 1,
      lastScoreBreakdown: undefined
    });
  }

  /**
   * Skip current anagram (neutral action - no points, no streak break)
   */
  skipAnagram(): void {
    // Skip is neutral - increment attempts but don't break streak
    this.updateState({
      totalAnswers: (this.state.totalAnswers || 0) + 1,
      lastScoreBreakdown: undefined
    });
  }

  /**
   * Validate and submit a player's anagram solution
   * SCRAM-008: Complete anagram validation with detailed feedback
   */
  async validateAndSubmitAnswer(playerAnswer: string): Promise<{
    success: boolean
    validation: AnagramValidationResult
    scoreBreakdown?: ScoreBreakdown
  }> {
    if (!this.state.currentAnagram || !this.state.solution) {
      return {
        success: false,
        validation: {
          valid: false,
          error: 'No anagram available to validate',
          errorType: 'word'
        }
      }
    }
    
    try {
      // Validate the anagram solution
      const validation = await this.anagramValidator.validateSolution(
        this.state.currentAnagram,
        playerAnswer
      )
      
      if (validation.valid) {
        // Calculate score and update state for correct answer
        const scoreBreakdown = this.submitCorrectAnswer(playerAnswer)
        
        return {
          success: true,
          validation,
          scoreBreakdown
        }
      } else {
        // Handle incorrect answer
        this.submitIncorrectAnswer()
        
        return {
          success: false,
          validation
        }
      }
      
    } catch (error) {
      console.error('Validation error:', error)
      
      // Don't penalize player for system errors
      return {
        success: false,
        validation: {
          valid: false,
          error: 'Validation system temporarily unavailable. Please try again.',
          errorType: 'word'
        }
      }
    }
  }

  /**
   * Quick check if answer structure is valid (for real-time feedback)
   * SCRAM-008: Fast letter-only validation for UI feedback
   */
  isValidAnagramStructure(playerAnswer: string): boolean {
    if (!this.state.currentAnagram) {
      return false
    }
    
    return this.anagramValidator.isValidAnagramStructure(
      this.state.currentAnagram,
      playerAnswer
    )
  }

  /**
   * Get anagram validation statistics
   */
  getValidationStats() {
    return this.anagramValidator.getStats()
  }

  /**
   * Get current scoring statistics
   */
  getScoreStats(): {
    currentScore: number;
    totalScore: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageScore: number;
  } {
    const correctAnswers = this.state.correctAnswers || 0;
    const totalAnswers = this.state.totalAnswers || 0;
    
    return {
      currentScore: this.state.score,
      totalScore: this.state.totalScore || 0,
      accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      currentStreak: this.state.streak,
      bestStreak: this.state.bestStreak || 0,
      averageScore: correctAnswers > 0 ? (this.state.totalScore || 0) / correctAnswers : 0
    };
  }

  /**
   * Get potential score for current scenario
   */
  getPotentialScore(solution: string): ScoreBreakdown {
    return this.scoreCalculator.calculateScore({
      wordLength: solution.length,
      timeRemaining: this.state.timeRemaining,
      currentStreak: this.state.streak
    });
  }

  /**
   * Get score calculator instance for external use
   */
  getScoreCalculator(): ScoreCalculator {
    return this.scoreCalculator;
  }

  /**
   * Reset scoring statistics for new game
   */
  resetScores(): void {
    this.updateState({
      score: 0,
      streak: 0,
      totalScore: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      bestStreak: 0,
      lastScoreBreakdown: undefined
    });
  }

  /**
   * Initialize the game timer with callbacks
   */
  private initializeTimer(): void {
    const callbacks: TimerCallbacks = {
      onTick: (timeRemaining: number) => {
        this.updateState({ timeRemaining });
      },
      onTimeout: () => {
        this.handleTimeout();
      },
      onStatusChange: (status: TimerStatus) => {
        this.updateState({ timerStatus: status });
      }
    };

    this.timer = new Timer({
      duration: this.state.roundDuration || 60,
      callbacks
    });
  }

  /**
   * Start the game timer
   */
  startTimer(): void {
    if (!this.timer) this.initializeTimer();
    
    this.updateState({ 
      gameStatus: 'playing',
      timerStatus: 'running'
    });
    
    this.timer?.start();
  }

  /**
   * Pause the game timer
   */
  pauseTimer(): void {
    this.timer?.pause();
    this.updateState({ 
      gameStatus: 'paused',
      timerStatus: 'paused'
    });
  }

  /**
   * Resume the game timer
   */
  resumeTimer(): void {
    this.timer?.resume();
    this.updateState({ 
      gameStatus: 'playing',
      timerStatus: 'running'
    });
  }

  /**
   * Reset the timer with optional new duration
   */
  resetTimer(duration?: number): void {
    const newDuration = duration || this.state.roundDuration || 60;
    
    this.timer?.reset(newDuration);
    this.updateState({
      timeRemaining: newDuration,
      roundDuration: newDuration,
      timerStatus: 'idle'
    });
  }

  /**
   * Get current timer instance (for external access to timer methods)
   */
  getTimer(): Timer | null {
    return this.timer;
  }

  /**
   * Handle timer timeout event
   */
  private handleTimeout(): void {
    // Transition to timeout-reveal state to show solution
    this.updateState({
      gameStatus: 'timeout-reveal',
      timerStatus: 'finished'
    });
    
    // Track timeout analytics
    const currentAnagram = this.state.currentAnagram;
    const solution = this.state.solution;
    const difficulty = this.state.difficulty;
    
    // Note: Analytics tracking will be handled by UI component
    // to avoid circular dependencies
    
    // Auto-proceed to next anagram after 5 seconds
    setTimeout(() => {
      this.proceedToNextAnagram();
    }, 5000);
  }

  /**
   * Proceed to next anagram after timeout (internal method)
   */
  private proceedToNextAnagram(): void {
    // Reset streak on timeout (counts as incorrect)
    this.updateState({ streak: 0 });
    
    // Generate new anagram
    // Note: This will be called by external game logic
    // State changes to 'playing' will be handled by the game controller
  }

  /**
   * Cleanup timer resources (call when disposing GameStore)
   */
  destroy(): void {
    this.timer?.destroy();
    this.timer = null;
    this.subscribers = [];
  }
}