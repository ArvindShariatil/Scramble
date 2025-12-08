/**
 * Score Calculator Unit Tests
 * 
 * Comprehensive test suite for scoring functionality including:
 * - Base scoring by word length
 * - Speed multiplier calculations
 * - Streak bonus system
 * - Skip action handling
 * - Score breakdown formatting
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { 
  ScoreCalculator, 
  createScoreCalculator, 
  quickCalculateScore,
  type ScoreBreakdown,
  type ScoreCalculationInput 
} from '../../../src/game/ScoreCalculator';

describe('ScoreCalculator', () => {
  let scoreCalculator: ScoreCalculator;

  beforeEach(() => {
    scoreCalculator = new ScoreCalculator();
  });

  describe('Base Score Calculation', () => {
    test('should calculate correct base scores for different word lengths', () => {
      // Test each word length tier
      const testCases = [
        { length: 3, expected: 10 },   // ≤4 letters
        { length: 4, expected: 10 },   // ≤4 letters
        { length: 5, expected: 20 },   // 5 letters
        { length: 6, expected: 40 },   // 6 letters
        { length: 7, expected: 60 },   // 7 letters (base)
        { length: 8, expected: 70 },   // 8 letters (+10)
        { length: 9, expected: 80 },   // 9 letters (+20)
        { length: 10, expected: 90 }   // 10 letters (+30)
      ];

      testCases.forEach(({ length, expected }) => {
        const result = scoreCalculator.calculateScore({
          wordLength: length,
          timeRemaining: 30, // Neutral time
          currentStreak: 0   // No streak
        });
        
        expect(result.baseScore).toBe(expected);
      });
    });

    test('should handle edge cases for word lengths', () => {
      // Very short word
      const shortResult = scoreCalculator.calculateScore({
        wordLength: 1,
        timeRemaining: 30,
        currentStreak: 0
      });
      expect(shortResult.baseScore).toBe(10);

      // Very long word
      const longResult = scoreCalculator.calculateScore({
        wordLength: 15,
        timeRemaining: 30,
        currentStreak: 0
      });
      expect(longResult.baseScore).toBe(140); // 60 + (15-7) * 10
    });
  });

  describe('Speed Multiplier Calculation', () => {
    test('should apply correct speed multipliers', () => {
      const testCases = [
        { timeRemaining: 60, expectedMultiplier: 2.0, tier: 'lightning' },
        { timeRemaining: 50, expectedMultiplier: 2.0, tier: 'lightning' },
        { timeRemaining: 41, expectedMultiplier: 2.0, tier: 'lightning' },
        { timeRemaining: 40, expectedMultiplier: 1.5, tier: 'quick' },
        { timeRemaining: 30, expectedMultiplier: 1.5, tier: 'quick' },
        { timeRemaining: 21, expectedMultiplier: 1.5, tier: 'quick' },
        { timeRemaining: 20, expectedMultiplier: 1.0, tier: 'normal' },
        { timeRemaining: 10, expectedMultiplier: 1.0, tier: 'normal' },
        { timeRemaining: 1, expectedMultiplier: 1.0, tier: 'normal' },
        { timeRemaining: 0, expectedMultiplier: 1.0, tier: 'normal' }
      ];

      testCases.forEach(({ timeRemaining, expectedMultiplier, tier }) => {
        const result = scoreCalculator.calculateScore({
          wordLength: 5, // Standard 5-letter word (20 base points)
          timeRemaining,
          currentStreak: 0
        });
        
        expect(result.speedMultiplier).toBe(expectedMultiplier);
        
        const speedTier = scoreCalculator.getSpeedTier(timeRemaining);
        expect(speedTier.tier).toBe(tier);
        expect(speedTier.multiplier).toBe(expectedMultiplier);
      });
    });
  });

  describe('Streak Bonus Calculation', () => {
    test('should calculate correct streak bonuses', () => {
      const testCases = [
        { streak: 0, expectedMultiplier: 1.0, expectedPercent: 0 },
        { streak: 1, expectedMultiplier: 1.1, expectedPercent: 10 },
        { streak: 2, expectedMultiplier: 1.2, expectedPercent: 20 },
        { streak: 5, expectedMultiplier: 1.5, expectedPercent: 50 },
        { streak: 10, expectedMultiplier: 2.0, expectedPercent: 100 },
        { streak: 15, expectedMultiplier: 2.0, expectedPercent: 100 }, // Capped at 100%
        { streak: 20, expectedMultiplier: 2.0, expectedPercent: 100 }  // Capped at 100%
      ];

      testCases.forEach(({ streak, expectedMultiplier, expectedPercent }) => {
        const result = scoreCalculator.calculateScore({
          wordLength: 5, // Standard word
          timeRemaining: 30, // Neutral time
          currentStreak: streak
        });
        
        expect(result.streakBonus).toBeCloseTo(expectedMultiplier, 1);
        expect(result.breakdown.streakBonusPercent).toBe(expectedPercent);
      });
    });

    test('should provide correct streak tier descriptions', () => {
      const testCases = [
        { streak: 0, tier: 'none', description: '' },
        { streak: 1, tier: 'none', description: '' },
        { streak: 2, tier: 'building', description: 'Building Momentum!' },
        { streak: 4, tier: 'building', description: 'Building Momentum!' },
        { streak: 5, tier: 'hot', description: 'On Fire!' },
        { streak: 9, tier: 'hot', description: 'On Fire!' },
        { streak: 10, tier: 'legendary', description: 'Legendary Streak!' },
        { streak: 15, tier: 'legendary', description: 'Legendary Streak!' }
      ];

      testCases.forEach(({ streak, tier, description }) => {
        const streakTier = scoreCalculator.getStreakTier(streak);
        expect(streakTier.tier).toBe(tier);
        expect(streakTier.description).toBe(description);
      });
    });
  });

  describe('Complete Score Calculations', () => {
    test('should calculate complex scores with all bonuses', () => {
      // Lightning speed (60s) + 5-letter word (20 base) + 5 streak (50% bonus)
      // = 20 * 2.0 * 1.5 = 60 points
      const result = scoreCalculator.calculateScore({
        wordLength: 5,
        timeRemaining: 60,
        currentStreak: 5
      });

      expect(result.baseScore).toBe(20);
      expect(result.speedMultiplier).toBe(2.0);
      expect(result.streakBonus).toBe(1.5);
      expect(result.finalScore).toBe(60);
    });

    test('should calculate maximum possible score', () => {
      // 10-letter word (90 base) + lightning speed (2x) + max streak (2x)
      // = 90 * 2.0 * 2.0 = 360 points
      const result = scoreCalculator.calculateScore({
        wordLength: 10,
        timeRemaining: 60,
        currentStreak: 10
      });

      expect(result.finalScore).toBe(360);
    });

    test('should calculate minimum scoring scenario', () => {
      // 4-letter word (10 base) + slow (1x) + no streak (1x)
      // = 10 * 1.0 * 1.0 = 10 points
      const result = scoreCalculator.calculateScore({
        wordLength: 4,
        timeRemaining: 5,
        currentStreak: 0
      });

      expect(result.finalScore).toBe(10);
    });

    test('should round final scores correctly', () => {
      // Test rounding with odd multipliers
      const result = scoreCalculator.calculateScore({
        wordLength: 5, // 20 base
        timeRemaining: 30, // 1.5x speed
        currentStreak: 1 // 1.1x streak
      });
      
      // 20 * 1.5 * 1.1 = 33
      expect(result.finalScore).toBe(33);
    });
  });

  describe('Skip Action Handling', () => {
    test('should return zero score for skipped actions', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 6,
        timeRemaining: 60,
        currentStreak: 10,
        isSkipped: true
      });

      expect(result.baseScore).toBe(0);
      expect(result.speedMultiplier).toBe(1);
      expect(result.streakBonus).toBe(1);
      expect(result.finalScore).toBe(0);
    });

    test('should maintain streak information in skip breakdown', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 6,
        timeRemaining: 50,
        currentStreak: 7,
        isSkipped: true
      });

      expect(result.breakdown.wordLength).toBe(6);
      expect(result.breakdown.timeRemaining).toBe(50);
      expect(result.breakdown.currentStreak).toBe(7);
    });
  });

  describe('Score Breakdown and Formatting', () => {
    test('should provide detailed score breakdown', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 6,
        timeRemaining: 45,
        currentStreak: 3
      });

      expect(result.breakdown).toEqual({
        wordLength: 6,
        timeRemaining: 45,
        currentStreak: 3,
        speedBonusPercent: 100, // 2.0x = 100% bonus (45s > 40s threshold)
        streakBonusPercent: 30  // 1.3x = 30% bonus
      });
    });

    test('should format score breakdown correctly', () => {
      const breakdown: ScoreBreakdown = {
        baseScore: 40,
        speedMultiplier: 2.0,
        streakBonus: 1.5,
        finalScore: 120,
        breakdown: {
          wordLength: 6,
          timeRemaining: 55,
          currentStreak: 5,
          speedBonusPercent: 100,
          streakBonusPercent: 50
        }
      };

      const formatted = scoreCalculator.formatScoreBreakdown(breakdown);
      expect(formatted).toBe('Base: 40 pts × 2 (100% speed bonus) × 1.5 (50% streak bonus) = 120 pts');
    });

    test('should format breakdown without bonuses', () => {
      const breakdown: ScoreBreakdown = {
        baseScore: 10,
        speedMultiplier: 1.0,
        streakBonus: 1.0,
        finalScore: 10,
        breakdown: {
          wordLength: 4,
          timeRemaining: 15,
          currentStreak: 0,
          speedBonusPercent: 0,
          streakBonusPercent: 0
        }
      };

      const formatted = scoreCalculator.formatScoreBreakdown(breakdown);
      expect(formatted).toBe('Base: 10 pts = 10 pts');
    });
  });

  describe('Utility Functions', () => {
    test('should calculate maximum potential score', () => {
      const maxScore = scoreCalculator.calculateMaxPotentialScore(7);
      // 7-letter word: 60 base * 2.0 speed * 2.0 streak = 240
      expect(maxScore).toBe(240);
    });

    test('should provide scoring guide', () => {
      const guide = scoreCalculator.getScoringGuide();
      expect(guide.title).toBe('Scoring System');
      expect(guide.rules).toHaveLength(5);
      expect(guide.rules[0]).toContain('Base Points');
      expect(guide.rules[1]).toContain('Speed Bonus');
      expect(guide.rules[2]).toContain('Streak Bonus');
    });
  });

  describe('Factory Functions', () => {
    test('should create calculator instance', () => {
      const calculator = createScoreCalculator();
      expect(calculator).toBeInstanceOf(ScoreCalculator);
    });

    test('should perform quick score calculation', () => {
      const score = quickCalculateScore(5, 50, 2);
      // 5-letter (20) * 2.0 speed * 1.2 streak = 48
      expect(score).toBe(48);
    });

    test('should handle quick calculation with defaults', () => {
      const score = quickCalculateScore(4, 10);
      // 4-letter (10) * 1.0 speed * 1.0 streak = 10
      expect(score).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative time remaining', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 5,
        timeRemaining: -5,
        currentStreak: 0
      });
      
      expect(result.speedMultiplier).toBe(1.0); // Should default to normal speed
      expect(result.finalScore).toBe(20); // Base score only
    });

    test('should handle negative streak', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 5,
        timeRemaining: 30,
        currentStreak: -2
      });
      
      expect(result.streakBonus).toBe(1.0); // Should not go below 1.0
      expect(result.finalScore).toBe(30); // 20 * 1.5 * 1.0
    });

    test('should handle zero word length', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 0,
        timeRemaining: 30,
        currentStreak: 0
      });
      
      expect(result.baseScore).toBe(10); // Should default to minimum
    });

    test('should handle very large numbers', () => {
      const result = scoreCalculator.calculateScore({
        wordLength: 100,
        timeRemaining: 1000,
        currentStreak: 1000
      });
      
      expect(result.baseScore).toBe(990); // 60 + (100-7) * 10
      expect(result.speedMultiplier).toBe(2.0);
      expect(result.streakBonus).toBe(2.0); // Capped at max
      expect(result.finalScore).toBe(3960); // 990 * 2.0 * 2.0
    });
  });
});