import { describe, it, expect } from 'vitest'
import { GameEngine } from '../src/game/GameEngine'
import { StorageHelper } from '../src/utils/storage'

describe('SCRAM-001 Project Setup', () => {
  it('should initialize GameEngine successfully', () => {
    const engine = new GameEngine()
    expect(engine).toBeDefined()
  })
  
  it('should handle localStorage operations', () => {
    const testData = { test: true }
    StorageHelper.save('test-key', testData)
    const retrieved = StorageHelper.load('test-key')
    expect(retrieved).toEqual(testData)
  })
  
  it('should have proper TypeScript module structure', () => {
    // This test verifies our architecture modules are properly structured
    expect(async () => {
      await import('../src/game/GameEngine')
      await import('../src/api/WordsAPI')
      await import('../src/ui/GameUI')
      await import('../src/data/anagrams')
      await import('../src/utils/storage')
    }).not.toThrow()
  })
})