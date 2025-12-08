// WordsAPI Error Handling Tests
// Tests error handling edge cases for the WordsAPI client

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { WordsAPIClient } from '../../../src/api/WordsAPI'

// Mock the StorageHelper
vi.mock('@utils/storage', () => ({
  StorageHelper: {
    save: vi.fn(),
    load: vi.fn(() => null),
    remove: vi.fn()
  }
}))

// Mock fetch for testing API failures
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock environment variables
vi.stubEnv('VITE_WORDS_API_KEY', 'test-api-key')

describe('WordsAPI Error Handling', () => {
  let apiClient: WordsAPIClient
  
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient = new WordsAPIClient()
    
    // Mock DOM methods for error popup
    global.document = {
      createElement: vi.fn(() => ({
        style: {},
        innerHTML: '',
        remove: vi.fn()
      })),
      head: {
        appendChild: vi.fn()
      },
      body: {
        appendChild: vi.fn()
      }
    } as any
    
    global.setTimeout = vi.fn((fn, delay) => {
      if (typeof fn === 'function') fn()
      return 123
    }) as any
    
    global.clearTimeout = vi.fn()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Edge Cases', () => {
    test('should handle malformed error objects (non-Error types)', async () => {
      // Reject with a string instead of Error object
      mockFetch.mockRejectedValueOnce('Something went wrong')
      
      const result = await apiClient.validateWord('test')
      
      // Should handle the error gracefully and return invalid
      expect(result.valid).toBe(false)
      expect(typeof result.error === 'string' || result.error === undefined).toBe(true)
    })

    test('should handle malformed API JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      } as Response)
      
      const result = await apiClient.validateWord('test')
      
      // Should catch JSON parsing error and return invalid
      expect(result.valid).toBe(false)
    })
    
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const result = await apiClient.validateWord('hello')
      
      // Should return invalid but not crash
      expect(result.valid).toBe(false)
      // After fallback attempt, source is marked as 'cache' (offline mode)
      expect(['api', 'cache'].includes(result.source || '')).toBe(true)
    })
  })
})
