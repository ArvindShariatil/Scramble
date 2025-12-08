/**
 * Score Calculator - Advanced scoring system with bonuses and multipliers
 * 
 * Implements fair scoring with speed bonuses, streak rewards, and transparent
 * calculation breakdown for player motivation and learning.
 */

export interface ScoreBreakdown {
  baseScore: number;
  speedMultiplier: number;
  streakBonus: number;
  finalScore: number;
  breakdown: {
    wordLength: number;
    timeRemaining: number;
    currentStreak: number;
    speedBonusPercent: number;
    streakBonusPercent: number;
  };
}

export interface ScoreCalculationInput {
  wordLength: number;
  timeRemaining: number;
  currentStreak: number;
  difficulty?: number;
  isSkipped?: boolean;
}

export class ScoreCalculator {
  
  /**
   * Calculate score for a solved anagram with full breakdown
   */
  calculateScore(input: ScoreCalculationInput): ScoreBreakdown {
    const { wordLength, timeRemaining, currentStreak, isSkipped = false } = input;
    
    // Skip actions give no points but don't break streaks
    if (isSkipped) {
      return this.createZeroScoreBreakdown(wordLength, timeRemaining, currentStreak);
    }
    
    const baseScore = this.getBaseScore(wordLength);
    const speedMultiplier = this.getSpeedMultiplier(timeRemaining);
    const streakBonusMultiplier = this.getStreakBonusMultiplier(currentStreak);
    
    const finalScore = Math.round(baseScore * speedMultiplier * streakBonusMultiplier);
    
    return {
      baseScore,
      speedMultiplier,
      streakBonus: streakBonusMultiplier,
      finalScore,
      breakdown: {
        wordLength,
        timeRemaining,
        currentStreak,
        speedBonusPercent: Math.round((speedMultiplier - 1) * 100),
        streakBonusPercent: Math.round((streakBonusMultiplier - 1) * 100)
      }
    };
  }
  
  /**
   * Calculate base score based on word length
   * 4-letter: 10pts, 5-letter: 20pts, 6-letter: 40pts, 7+letter: 60+ pts
   */
  private getBaseScore(wordLength: number): number {
    if (wordLength <= 4) return 10;
    if (wordLength === 5) return 20;
    if (wordLength === 6) return 40;
    
    // 7+ letters: 60 base + 10 per extra letter
    return 60 + (wordLength - 7) * 10;
  }
  
  /**
   * Calculate speed multiplier based on time remaining
   * 2x for first 20s (40+ remaining), 1.5x for next 20s (20-40s remaining)
   */
  private getSpeedMultiplier(timeRemaining: number): number {
    if (timeRemaining > 40) return 2.0;   // First 20 seconds (60-40s remaining)
    if (timeRemaining > 20) return 1.5;   // Next 20 seconds (40-20s remaining)
    return 1.0;                           // Final 20 seconds (20-0s remaining)
  }
  
  /**
   * Calculate streak bonus multiplier
   * +10% per consecutive correct answer (max 100% bonus = 2x multiplier)
   */
  private getStreakBonusMultiplier(currentStreak: number): number {
    const bonusPercent = Math.min(Math.max(currentStreak * 10, 0), 100); // Min 0%, Max 100% bonus
    return 1 + (bonusPercent / 100);
  }
  
  /**
   * Get speed tier description for UI display
   */
  getSpeedTier(timeRemaining: number): { tier: string; description: string; multiplier: number } {
    if (timeRemaining > 40) {
      return { tier: 'lightning', description: 'Lightning Fast!', multiplier: 2.0 };
    }
    if (timeRemaining > 20) {
      return { tier: 'quick', description: 'Quick Thinking!', multiplier: 1.5 };
    }
    return { tier: 'normal', description: 'Good Job!', multiplier: 1.0 };
  }
  
  /**
   * Get streak tier description for UI display
   */
  getStreakTier(currentStreak: number): { tier: string; description: string; bonus: number } {
    if (currentStreak >= 10) {
      return { tier: 'legendary', description: 'Legendary Streak!', bonus: 100 };
    }
    if (currentStreak >= 5) {
      return { tier: 'hot', description: 'On Fire!', bonus: currentStreak * 10 };
    }
    if (currentStreak >= 2) {
      return { tier: 'building', description: 'Building Momentum!', bonus: currentStreak * 10 };
    }
    return { tier: 'none', description: '', bonus: 0 };
  }
  
  /**
   * Calculate potential maximum score for a given scenario
   */
  calculateMaxPotentialScore(wordLength: number): number {
    return this.calculateScore({
      wordLength,
      timeRemaining: 60, // Maximum time
      currentStreak: 10  // Maximum streak
    }).finalScore;
  }
  
  /**
   * Create zero score breakdown for skipped or failed attempts
   */
  private createZeroScoreBreakdown(
    wordLength: number, 
    timeRemaining: number, 
    currentStreak: number
  ): ScoreBreakdown {
    return {
      baseScore: 0,
      speedMultiplier: 1,
      streakBonus: 1,
      finalScore: 0,
      breakdown: {
        wordLength,
        timeRemaining,
        currentStreak,
        speedBonusPercent: 0,
        streakBonusPercent: 0
      }
    };
  }
  
  /**
   * Format score breakdown for display
   */
  formatScoreBreakdown(breakdown: ScoreBreakdown): string {
    const { baseScore, speedMultiplier, streakBonus, finalScore } = breakdown;
    const { speedBonusPercent, streakBonusPercent } = breakdown.breakdown;
    
    let result = `Base: ${baseScore} pts`;
    
    if (speedBonusPercent > 0) {
      result += ` × ${speedMultiplier} (${speedBonusPercent}% speed bonus)`;
    }
    
    if (streakBonusPercent > 0) {
      result += ` × ${streakBonus.toFixed(1)} (${streakBonusPercent}% streak bonus)`;
    }
    
    result += ` = ${finalScore} pts`;
    
    return result;
  }
  
  /**
   * Get scoring guide for educational purposes
   */
  getScoringGuide(): { title: string; rules: string[] } {
    return {
      title: 'Scoring System',
      rules: [
        '📏 Base Points: 4-letter (10), 5-letter (20), 6-letter (40), 7+ letter (60+)',
        '⚡ Speed Bonus: 2× in first 20s, 1.5× in next 20s',
        '🔥 Streak Bonus: +10% per consecutive correct (max 100%)',
        '⏭️ Skip Actions: No points gained or lost, streak preserved',
        '❌ Wrong/Timeout: No points, streak reset to 0'
      ]
    };
  }
}

/**
 * Utility function to create score calculator instance
 */
export function createScoreCalculator(): ScoreCalculator {
  return new ScoreCalculator();
}

/**
 * Utility function for quick score calculation
 */
export function quickCalculateScore(
  wordLength: number,
  timeRemaining: number,
  streak: number = 0
): number {
  const calculator = new ScoreCalculator();
  return calculator.calculateScore({
    wordLength,
    timeRemaining,
    currentStreak: streak
  }).finalScore;
}