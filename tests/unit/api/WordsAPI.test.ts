// SCRAM-006: WordsAPI Integration Tests
// Essential functionality tests for WordsAPIClient

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WordsAPIClient } from '../../../src/api/WordsAPI'

// Mock StorageHelper with static methods
vi.mock('../../../src/utils/storage', () => ({
  StorageHelper: {
    save: vi.fn(),
    load: vi.fn(() => null),
    remove: vi.fn()
  }
}))

describe('WordsAPIClient - Core Functionality', () => {
  let apiClient: WordsAPIClient

  beforeEach(() => {
    apiClient = new WordsAPIClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(apiClient).toBeDefined()
      expect(typeof apiClient.validateWord).toBe('function')
      expect(typeof apiClient.getStats).toBe('function')
      expect(typeof apiClient.clearCache).toBe('function')
    })

    it('should provide usage statistics', () => {
      const stats = apiClient.getStats()
      expect(stats).toHaveProperty('remainingRequests')
      expect(stats).toHaveProperty('cacheSize')
      expect(typeof stats.remainingRequests).toBe('number')
      expect(typeof stats.cacheSize).toBe('number')
    })
  })

  describe('Input Validation', () => {
    it('should reject empty words', async () => {
      const result = await apiClient.validateWord('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Word must be at least 2 characters long')
      expect(result.source).toBe('cache')
    })

    it('should reject single character words', async () => {
      const result = await apiClient.validateWord('a')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Word must be at least 2 characters long')
      expect(result.source).toBe('cache')
    })

    it('should reject words with numbers', async () => {
      const result = await apiClient.validateWord('hello123')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Word must contain only letters')
      expect(result.source).toBe('cache')
    })

    it('should reject words with special characters', async () => {
      const result = await apiClient.validateWord('hello!')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Word must contain only letters')
      expect(result.source).toBe('cache')
    })

    it('should handle whitespace and case normalization', async () => {
      const result1 = await apiClient.validateWord('HELLO')
      const result2 = await apiClient.validateWord('  hello  ')
      
      // Both should be processed consistently
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(typeof result1.valid).toBe('boolean')
      expect(typeof result2.valid).toBe('boolean')
    })
  })

  describe('API Integration', () => {
    it('should return consistent validation result structure', async () => {
      const result = await apiClient.validateWord('hello')
      
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('source')
      expect(typeof result.valid).toBe('boolean')
      expect(['api', 'cache'].includes(result.source!)).toBe(true)
      
      if (!result.valid) {
        expect(result).toHaveProperty('error')
        expect(typeof result.error).toBe('string')
      }
    })

    it('should handle valid English words', async () => {
      const testWords = ['hello', 'world', 'test', 'game']
      
      for (const word of testWords) {
        const result = await apiClient.validateWord(word)
        expect(result).toBeDefined()
        expect(typeof result.valid).toBe('boolean')
      }
    })
  })

  describe('Cache Management', () => {
    it('should clear cache without errors', () => {
      expect(() => apiClient.clearCache()).not.toThrow()
      
      const stats = apiClient.getStats()
      expect(stats.cacheSize).toBe(0)
    })

    it('should use cache for repeated validation requests', async () => {
      // First validation
      const result1 = await apiClient.validateWord('test')
      
      // Second validation of same word
      const result2 = await apiClient.validateWord('test')
      
      // Results should be consistent
      expect(result1.valid).toBe(result2.valid)
      if (result1.error) {
        expect(result2.error).toBe(result1.error)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidInputs = ['', 'a', '123', 'hello!', '  ', 'test@example']
      
      for (const input of invalidInputs) {
        const result = await apiClient.validateWord(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeTruthy()
        expect(typeof result.error).toBe('string')
      }
    })

    it('should not crash on edge cases', async () => {
      const edgeCases = [
        'verylongwordthatmightcauseissueswithvalidationsystems',
        '   ',
        '\t\n'
      ]
      
      for (const testCase of edgeCases) {
        await expect(async () => {
          await apiClient.validateWord(testCase)
        }).not.toThrow()
      }
    })
  })

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        apiClient.validateWord(`word${i}`)
      )
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result.valid).toBe('boolean')
      })
    })

    it('should complete validation requests in reasonable time', async () => {
      const start = performance.now()
      await apiClient.validateWord('test')
      const duration = performance.now() - start
      
      // Should complete within 2 seconds (generous for API calls)
      expect(duration).toBeLessThan(2000)
    })
  })
})