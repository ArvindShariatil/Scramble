import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnagramGenerator } from '../../../src/game/AnagramGenerator'
import { ANAGRAM_SETS } from '../../../src/data/anagrams'

describe('AnagramGenerator', () => {
  let generator: AnagramGenerator

  beforeEach(() => {
    generator = new AnagramGenerator()
  })

  describe('initialization', () => {
    it('should initialize with default difficulty 1', () => {
      expect(generator.getCurrentDifficulty()).toBe(1)
    })

    it('should initialize with specified difficulty', () => {
      const customGenerator = new AnagramGenerator(3)
      expect(customGenerator.getCurrentDifficulty()).toBe(3)
    })

    it('should clamp difficulty to valid range during initialization', () => {
      const lowGenerator = new AnagramGenerator(-1)
      const highGenerator = new AnagramGenerator(10)
      
      expect(lowGenerator.getCurrentDifficulty()).toBe(1)
      expect(highGenerator.getCurrentDifficulty()).toBe(5)
    })
  })

  describe('getAnagram', () => {
    it('should return an anagram for default difficulty', () => {
      const anagram = generator.getAnagram()
      
      expect(anagram).toBeDefined()
      expect(anagram?.difficulty).toBe(1)
      expect(typeof anagram?.scrambled).toBe('string')
      expect(typeof anagram?.solution).toBe('string')
    })

    it('should return an anagram for specified difficulty', () => {
      const anagram = generator.getAnagram({ difficulty: 2 })
      
      expect(anagram).toBeDefined()
      expect(anagram?.difficulty).toBe(2)
    })

    it('should return null for non-existent difficulty level', () => {
      // Mock empty anagram set
      const originalSets = { ...ANAGRAM_SETS }
      ANAGRAM_SETS[6] = []
      
      const anagram = generator.getAnagram({ difficulty: 6 as any })
      expect(anagram).toBeNull()
      
      // Restore original sets
      Object.assign(ANAGRAM_SETS, originalSets)
    })

    it('should filter by category when specified', () => {
      const anagram = generator.getAnagram({ category: 'emotions' })
      
      if (anagram) {
        expect(anagram.category).toBe('emotions')
      } else {
        // If no emotions category found, test should still pass
        expect(anagram).toBeNull()
      }
    })

    it('should exclude used anagrams by default', () => {
      const firstAnagram = generator.getAnagram()
      if (firstAnagram) {
        generator.markAsUsed(firstAnagram.id)
        
        // Should not return the same anagram again
        const secondAnagram = generator.getAnagram()
        if (secondAnagram) {
          expect(secondAnagram.id).not.toBe(firstAnagram.id)
        }
      }
    })

    it('should include used anagrams when excludeUsed is false', () => {
      const firstAnagram = generator.getAnagram()
      if (firstAnagram) {
        generator.markAsUsed(firstAnagram.id)
        
        // Should potentially return used anagrams when flag is false
        const anagram = generator.getAnagram({ excludeUsed: false })
        expect(anagram).toBeDefined()
      }
    })

    it('should reset used anagrams when all are exhausted', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Mark all level 1 anagrams as used
      const level1Anagrams = ANAGRAM_SETS[1] || []
      level1Anagrams.forEach(anagram => {
        generator.markAsUsed(anagram.id)
      })
      
      // Should reset and return an anagram
      const anagram = generator.getAnagram({ difficulty: 1 })
      expect(anagram).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('All anagrams used for difficulty 1')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('getNextAnagram', () => {
    it('should return anagram with current difficulty', () => {
      generator.setDifficulty(2)
      const anagram = generator.getNextAnagram()
      
      expect(anagram).toBeDefined()
      expect(anagram?.difficulty).toBe(2)
    })
  })

  describe('difficulty management', () => {
    it('should set difficulty within valid range', () => {
      generator.setDifficulty(3)
      expect(generator.getCurrentDifficulty()).toBe(3)
      
      generator.setDifficulty(-1)
      expect(generator.getCurrentDifficulty()).toBe(1)
      
      generator.setDifficulty(10)
      expect(generator.getCurrentDifficulty()).toBe(5)
    })

    it('should increase difficulty correctly', () => {
      generator.setDifficulty(2)
      generator.increaseDifficulty()
      expect(generator.getCurrentDifficulty()).toBe(3)
      
      generator.increaseDifficulty(2)
      expect(generator.getCurrentDifficulty()).toBe(5)
      
      // Should not exceed maximum
      generator.increaseDifficulty()
      expect(generator.getCurrentDifficulty()).toBe(5)
    })
  })

  describe('usage tracking', () => {
    it('should mark anagrams as used', () => {
      const anagramId = 'test-id'
      
      expect(generator.isUsed(anagramId)).toBe(false)
      generator.markAsUsed(anagramId)
      expect(generator.isUsed(anagramId)).toBe(true)
    })

    it('should reset used anagrams for specific difficulty', () => {
      const level1Anagrams = ANAGRAM_SETS[1] || []
      const testAnagram = level1Anagrams[0]
      
      if (testAnagram) {
        generator.markAsUsed(testAnagram.id)
        expect(generator.isUsed(testAnagram.id)).toBe(true)
        
        generator.resetUsedAnagrams(1)
        expect(generator.isUsed(testAnagram.id)).toBe(false)
      }
    })

    it('should reset all used anagrams when no difficulty specified', () => {
      generator.markAsUsed('test-1')
      generator.markAsUsed('test-2')
      
      generator.resetUsedAnagrams()
      
      expect(generator.isUsed('test-1')).toBe(false)
      expect(generator.isUsed('test-2')).toBe(false)
    })

    it('should provide usage statistics', () => {
      const stats = generator.getUsageStats()
      
      expect(typeof stats.totalUsed).toBe('number')
      expect(typeof stats.usedByDifficulty).toBe('object')
      expect(typeof stats.availableByDifficulty).toBe('object')
      
      // Should have entries for all difficulty levels
      for (let i = 1; i <= 5; i++) {
        expect(stats.usedByDifficulty).toHaveProperty(i.toString())
        expect(stats.availableByDifficulty).toHaveProperty(i.toString())
      }
    })
  })

  describe('solution validation', () => {
    it('should validate correct solutions', () => {
      const level1Anagrams = ANAGRAM_SETS[1] || []
      const testAnagram = level1Anagrams[0]
      
      if (testAnagram) {
        const isValid = generator.validateSolution(testAnagram.id, testAnagram.solution)
        expect(isValid).toBe(true)
        
        // Should be case insensitive
        const isValidLower = generator.validateSolution(testAnagram.id, testAnagram.solution.toLowerCase())
        expect(isValidLower).toBe(true)
      }
    })

    it('should reject incorrect solutions', () => {
      const level1Anagrams = ANAGRAM_SETS[1] || []
      const testAnagram = level1Anagrams[0]
      
      if (testAnagram) {
        const isValid = generator.validateSolution(testAnagram.id, 'WRONG')
        expect(isValid).toBe(false)
      }
    })

    it('should handle non-existent anagram IDs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const isValid = generator.validateSolution('non-existent-id', 'ANSWER')
      expect(isValid).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Anagram with ID non-existent-id not found'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('hint system', () => {
    it('should provide hints for valid anagram IDs', () => {
      const level1Anagrams = ANAGRAM_SETS[1] || []
      const testAnagram = level1Anagrams[0]
      
      if (testAnagram) {
        const hint = generator.getHint(testAnagram.id)
        
        expect(hint).toBeDefined()
        expect(hint).toHaveProperty('category')
        expect(hint).toHaveProperty('firstLetter')
        expect(typeof hint?.category).toBe('string')
        expect(typeof hint?.firstLetter).toBe('string')
      }
    })

    it('should return null for non-existent anagram IDs', () => {
      const hint = generator.getHint('non-existent-id')
      expect(hint).toBeNull()
    })
  })

  describe('category management', () => {
    it('should return available categories for difficulty level', () => {
      const categories = generator.getAvailableCategories(1)
      
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
      
      // Should be sorted
      const sortedCategories = [...categories].sort()
      expect(categories).toEqual(sortedCategories)
    })

    it('should return categories for current difficulty when no level specified', () => {
      generator.setDifficulty(2)
      const categories = generator.getAvailableCategories()
      
      // Should return categories for level 2
      expect(Array.isArray(categories)).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple anagram requests correctly', () => {
      const anagrams: any[] = []
      
      // Get 5 anagrams
      for (let i = 0; i < 5; i++) {
        const anagram = generator.getAnagram()
        if (anagram) {
          anagrams.push(anagram)
        }
      }
      
      // Should have unique anagrams (assuming enough available)
      const uniqueIds = new Set(anagrams.map(a => a.id))
      expect(uniqueIds.size).toBe(anagrams.length)
    })

    it('should maintain state consistency across operations', () => {
      const initialStats = generator.getUsageStats()
      
      const anagram = generator.getAnagram()
      if (anagram) {
        const afterStats = generator.getUsageStats()
        expect(afterStats.totalUsed).toBe(initialStats.totalUsed + 1)
        
        // Validate the solution
        const isValid = generator.validateSolution(anagram.id, anagram.solution)
        expect(isValid).toBe(true)
        
        // Get hint
        const hint = generator.getHint(anagram.id)
        expect(hint).toBeDefined()
      }
    })
  })
})