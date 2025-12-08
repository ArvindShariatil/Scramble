import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameState, DEFAULT_GAME_STATE, isValidGameState } from '../../../src/game/GameState'

describe('GameState', () => {
  describe('DEFAULT_GAME_STATE', () => {
    it('should have valid initial state', () => {
      expect(DEFAULT_GAME_STATE).toEqual({
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
      })
    })

    it('should pass validation', () => {
      expect(isValidGameState(DEFAULT_GAME_STATE)).toBe(true)
    })
  })

  describe('isValidGameState', () => {
    it('should validate correct GameState objects', () => {
      const validState: GameState = {
        currentAnagram: 'TEAR',
        solution: 'RATE',
        timeRemaining: 45,
        score: 100,
        streak: 3,
        difficulty: 2,
        gameStatus: 'playing'
      }

      expect(isValidGameState(validState)).toBe(true)
    })

    it('should reject invalid game status values', () => {
      const invalidState = {
        ...DEFAULT_GAME_STATE,
        gameStatus: 'invalid-status'
      }

      expect(isValidGameState(invalidState)).toBe(false)
    })

    it('should reject missing required properties', () => {
      const invalidState = {
        currentAnagram: 'TEAR',
        solution: 'RATE',
        // missing timeRemaining
        score: 100,
        streak: 3,
        difficulty: 2,
        gameStatus: 'playing'
      }

      expect(isValidGameState(invalidState)).toBe(false)
    })

    it('should reject wrong property types', () => {
      const invalidState = {
        ...DEFAULT_GAME_STATE,
        score: '100', // should be number
        timeRemaining: '60' // should be number
      }

      expect(isValidGameState(invalidState)).toBe(false)
    })

    it('should reject null and undefined', () => {
      expect(isValidGameState(null)).toBe(false)
      expect(isValidGameState(undefined)).toBe(false)
    })

    it('should validate all valid game status values', () => {
      const statuses = ['playing', 'paused', 'ended']
      
      statuses.forEach(status => {
        const state = { ...DEFAULT_GAME_STATE, gameStatus: status }
        expect(isValidGameState(state)).toBe(true)
      })
    })
  })
})