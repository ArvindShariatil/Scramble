// SCRAM-008: Anagram Solution Validation Tests
// Comprehensive test suite for AnagramValidator

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnagramValidator, AnagramValidationResult } from '../../../src/game/AnagramValidator'

// Mock WordsAPIClient with proper vitest syntax
const mockValidateWord = vi.fn()

vi.mock('../../../src/api/WordsAPI', () => {
  return {
    WordsAPIClient: function MockWordsAPIClient(this: any) {
      this.validateWord = mockValidateWord
    }
  }
})

describe('AnagramValidator - SCRAM-008', () => {
  let validator: AnagramValidator

  beforeEach(() => {
    validator = new AnagramValidator()
    mockValidateWord.mockClear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(validator).toBeDefined()
      expect(typeof validator.validateSolution).toBe('function')
      expect(typeof validator.getStats).toBe('function')
      expect(typeof validator.isValidAnagramStructure).toBe('function')
    })

    it('should provide initial statistics', () => {
      const stats = validator.getStats()
      expect(stats.totalValidations).toBe(0)
      expect(stats.correctSolutions).toBe(0)
      expect(stats.letterErrors).toBe(0)
      expect(stats.wordErrors).toBe(0)
      expect(stats.averageTime).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should reject empty scrambled word', async () => {
      const result = await validator.validateSolution('', 'hello')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('length')
      expect(result.error).toContain('must be provided')
    })

    it('should reject empty solution', async () => {
      const result = await validator.validateSolution('hello', '')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('length')
      expect(result.error).toContain('must be provided')
    })

    it('should reject solution shorter than 2 characters', async () => {
      const result = await validator.validateSolution('ab', 'a')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('length')
      expect(result.error).toContain('at least 2 characters')
    })

    it('should reject solution with numbers', async () => {
      const result = await validator.validateSolution('hello', 'h3llo')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('characters')
      expect(result.error).toContain('only letters')
    })

    it('should reject solution with special characters', async () => {
      const result = await validator.validateSolution('hello', 'hel!o')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('characters')
      expect(result.error).toContain('only letters')
    })

    it('should handle whitespace in inputs', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api'
      })

      const result = await validator.validateSolution('  hello  ', '  olleh  ')
      
      expect(result.valid).toBe(true)
      expect(result.details?.scrambled).toBe('hello')
      expect(result.details?.solution).toBe('olleh')
    })
  })

  describe('Letter Usage Validation', () => {
    it('should validate correct letter usage', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api'
      })

      const result = await validator.validateSolution('hello', 'olleh')
      
      expect(result.valid).toBe(true)
      expect(result.details?.lettersMatch).toBe(true)
    })

    it('should reject wrong number of letters', async () => {
      const result = await validator.validateSolution('hello', 'hell')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('letters')
      expect(result.error).toContain('must use all 5 letters')
    })

    it('should reject incorrect letters with detailed feedback', async () => {
      const result = await validator.validateSolution('hello', 'world')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('letters')
      expect(result.error).toContain('Must use all letters exactly once')
      expect(result.error).toContain('Extra:')
      expect(result.error).toContain('Missing:')
    })

    it('should handle duplicate letters correctly', async () => {
      const result = await validator.validateSolution('aab', 'abb')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('letters')
      expect(result.error).toContain('Extra: b')
      expect(result.error).toContain('Missing: a')
    })

    it('should be case insensitive for letter matching', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api'
      })

      const result = await validator.validateSolution('Hello', 'OLLEH')
      
      expect(result.valid).toBe(true)
      expect(result.details?.lettersMatch).toBe(true)
    })
  })

  describe('Word Validation Integration', () => {
    it('should validate correct anagram with valid word', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api',
        definition: { word: 'listen' }
      })

      const result = await validator.validateSolution('silent', 'listen')
      
      expect(result.valid).toBe(true)
      expect(result.details?.lettersMatch).toBe(true)
      expect(result.details?.wordValid).toBe(true)
      expect(result.details?.source).toBe('api')
      expect(mockValidateWord).toHaveBeenCalledWith('listen')
    })

    it('should reject correct letters with invalid word', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: false,
        error: 'Word not found in dictionary',
        source: 'api'
      })

      const result = await validator.validateSolution('hello', 'lleho')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('word')
      expect(result.error).toContain('not found in dictionary')
      expect(result.details?.lettersMatch).toBe(true)
      expect(result.details?.wordValid).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      mockValidateWord.mockRejectedValueOnce(new Error('Network error'))

      const result = await validator.validateSolution('hello', 'olleh')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Validation system error')
    })

    it('should use cached word validation results', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'cache'
      })

      const result = await validator.validateSolution('hello', 'olleh')
      
      expect(result.valid).toBe(true)
      expect(result.details?.source).toBe('cache')
    })
  })

  describe('Statistics Tracking', () => {
    it('should track validation statistics', async () => {
      mockValidateWord
        .mockResolvedValueOnce({ valid: true, source: 'api' })
        .mockResolvedValueOnce({ valid: false, error: 'Not found', source: 'api' })

      // Successful validation
      await validator.validateSolution('hello', 'olleh')
      
      // Failed word validation
      await validator.validateSolution('hello', 'lleho')
      
      // Failed letter validation
      await validator.validateSolution('hello', 'world')

      const stats = validator.getStats()
      expect(stats.totalValidations).toBe(3)
      expect(stats.correctSolutions).toBe(1)
      expect(stats.wordErrors).toBe(1)
      expect(stats.letterErrors).toBe(1)
      expect(stats.averageTime).toBeGreaterThan(0)
    })

    it('should reset statistics', async () => {
      mockValidateWord.mockResolvedValueOnce({ valid: true, source: 'api' })
      
      await validator.validateSolution('hello', 'olleh')
      expect(validator.getStats().totalValidations).toBe(1)
      
      validator.resetStats()
      expect(validator.getStats().totalValidations).toBe(0)
    })
  })

  describe('Utility Methods', () => {
    it('should check anagram structure without API call', () => {
      expect(validator.isValidAnagramStructure('hello', 'olleh')).toBe(true)
      expect(validator.isValidAnagramStructure('hello', 'world')).toBe(false)
      expect(validator.isValidAnagramStructure('hello', 'hell')).toBe(false)
    })

    it('should validate multiple solutions in batch', async () => {
      mockValidateWord
        .mockResolvedValueOnce({ valid: true, source: 'api' })
        .mockResolvedValueOnce({ valid: false, error: 'Not found', source: 'api' })

      const results = await validator.validateMultiple('hello', ['olleh', 'world'])
      
      expect(results).toHaveLength(2)
      expect(results[0].valid).toBe(true)
      expect(results[1].valid).toBe(false)
      expect(results[1].errorType).toBe('letters')
    })
  })

  describe('Performance Requirements', () => {
    it('should complete validation under 50ms for cached results', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'cache' // Simulating fast cache response
      })

      const start = performance.now()
      await validator.validateSolution('hello', 'olleh')
      const duration = performance.now() - start
      
      // Should be very fast for cached results
      expect(duration).toBeLessThan(50)
    })

    it('should handle concurrent validations efficiently', async () => {
      mockValidateWord.mockImplementation(async (word) => ({
        valid: true,
        source: 'api'
      }))

      const promises = Array.from({ length: 10 }, (_, i) => 
        validator.validateSolution('hello', 'olleh')
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      expect(results.every(r => r.valid)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long words', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api'
      })

      const longWord = 'abcdefghijklmnopqrstuvwxyz'
      const scrambled = 'zyxwvutsrqponmlkjihgfedcba'
      
      const result = await validator.validateSolution(longWord, scrambled)
      expect(result.valid).toBe(true)
    })

    it('should handle words with repeated letters', async () => {
      mockValidateWord.mockResolvedValueOnce({
        valid: true,
        source: 'api'
      })

      const result = await validator.validateSolution('aabbcc', 'abcabc')
      expect(result.valid).toBe(true)
    })

    it('should handle single character differences', async () => {
      const result = await validator.validateSolution('abc', 'abd')
      
      expect(result.valid).toBe(false)
      expect(result.errorType).toBe('letters')
      expect(result.error).toContain('Extra: d')
      expect(result.error).toContain('Missing: c')
    })
  })
})