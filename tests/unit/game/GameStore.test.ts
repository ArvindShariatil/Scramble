import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameStore } from '../../../src/game/GameStore'
import { DEFAULT_GAME_STATE, GameState } from '../../../src/game/GameState'

describe('GameStore', () => {
  let gameStore: GameStore
  
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear()
    gameStore = new GameStore()
  })

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear()
  })

  describe('initialization', () => {
    it('should initialize with default state when no stored state exists', () => {
      const state = gameStore.getState()
      expect(state).toEqual(DEFAULT_GAME_STATE)
    })

    it('should load valid state from sessionStorage', () => {
      const storedState: GameState = {
        currentAnagram: 'TEAR',
        solution: 'RATE',
        timeRemaining: 45,
        score: 100,
        streak: 3,
        difficulty: 2,
        gameStatus: 'playing'
      }

      sessionStorage.setItem('scramble-game-state', JSON.stringify(storedState))
      
      const newStore = new GameStore()
      expect(newStore.getState()).toEqual(storedState)
    })

    it('should ignore invalid stored state and use defaults', () => {
      const invalidState = { invalidProperty: 'invalid' }
      sessionStorage.setItem('scramble-game-state', JSON.stringify(invalidState))
      
      const newStore = new GameStore()
      expect(newStore.getState()).toEqual(DEFAULT_GAME_STATE)
    })

    it('should handle corrupted sessionStorage data gracefully', () => {
      sessionStorage.setItem('scramble-game-state', 'invalid-json')
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const newStore = new GameStore()
      
      expect(newStore.getState()).toEqual(DEFAULT_GAME_STATE)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load state from sessionStorage:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('getState', () => {
    it('should return a readonly copy of the state', () => {
      const state1 = gameStore.getState()
      const state2 = gameStore.getState()
      
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2) // Different object references
    })

    it('should not allow direct mutation of returned state', () => {
      const state = gameStore.getState() as any
      
      // TypeScript prevents this at compile time, but test runtime behavior
      state.score = 999
      
      expect(gameStore.getState().score).toBe(0) // Original state unchanged
    })
  })

  describe('updateState', () => {
    it('should update state with partial changes', () => {
      gameStore.updateState({ score: 100, streak: 5 })
      
      const state = gameStore.getState()
      expect(state.score).toBe(100)
      expect(state.streak).toBe(5)
      expect(state.gameStatus).toBe('ended') // Unchanged properties preserved
    })

    it('should trigger subscriber notifications', () => {
      const callback = vi.fn()
      gameStore.subscribe(callback)
      
      gameStore.updateState({ score: 100 })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100 })
      )
    })

    it('should persist state to sessionStorage', () => {
      gameStore.updateState({ score: 100, gameStatus: 'playing' })
      
      const stored = JSON.parse(sessionStorage.getItem('scramble-game-state')!)
      expect(stored.score).toBe(100)
      expect(stored.gameStatus).toBe('playing')
    })

    it('should reject invalid state updates', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const originalState = gameStore.getState()
      
      // Try to update with invalid gameStatus
      gameStore.updateState({ gameStatus: 'invalid-status' as any })
      
      expect(gameStore.getState()).toEqual(originalState)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid state update, reverting:',
        { gameStatus: 'invalid-status' }
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle sessionStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock sessionStorage.setItem to throw an error
      const setItemSpy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      gameStore.updateState({ score: 100 })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to persist state to sessionStorage:',
        expect.any(Error)
      )
      
      // Restore mocks
      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('resetState', () => {
    it('should reset state to defaults', () => {
      gameStore.updateState({ score: 100, streak: 5, gameStatus: 'playing' })
      gameStore.resetState()
      
      expect(gameStore.getState()).toEqual(DEFAULT_GAME_STATE)
    })

    it('should trigger subscriber notifications', () => {
      const callback = vi.fn()
      gameStore.subscribe(callback)
      
      gameStore.resetState()
      
      expect(callback).toHaveBeenCalledWith(DEFAULT_GAME_STATE)
    })

    it('should persist reset state to sessionStorage', () => {
      gameStore.updateState({ score: 100 })
      gameStore.resetState()
      
      const stored = JSON.parse(sessionStorage.getItem('scramble-game-state')!)
      expect(stored).toEqual(DEFAULT_GAME_STATE)
    })
  })

  describe('subscribe', () => {
    it('should register callback for state changes', () => {
      const callback = vi.fn()
      gameStore.subscribe(callback)
      
      gameStore.updateState({ score: 100 })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100 })
      )
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = gameStore.subscribe(callback)
      
      gameStore.updateState({ score: 100 })
      expect(callback).toHaveBeenCalledTimes(1)
      
      unsubscribe()
      gameStore.updateState({ score: 200 })
      expect(callback).toHaveBeenCalledTimes(1) // No additional calls
    })

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      gameStore.subscribe(callback1)
      gameStore.subscribe(callback2)
      
      gameStore.updateState({ score: 100 })
      
      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100 })
      )
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100 })
      )
    })

    it('should handle subscriber callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      const normalCallback = vi.fn()
      
      gameStore.subscribe(errorCallback)
      gameStore.subscribe(normalCallback)
      
      gameStore.updateState({ score: 100 })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in state change subscriber:',
        expect.any(Error)
      )
      expect(normalCallback).toHaveBeenCalled() // Other subscribers still work
      
      consoleSpy.mockRestore()
    })
  })

  describe('clearPersistedState', () => {
    it('should remove state from sessionStorage', () => {
      gameStore.updateState({ score: 100 })
      expect(sessionStorage.getItem('scramble-game-state')).not.toBeNull()
      
      gameStore.clearPersistedState()
      expect(sessionStorage.getItem('scramble-game-state')).toBeNull()
    })

    it('should handle sessionStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock sessionStorage.removeItem to throw an error
      const removeItemSpy = vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      gameStore.clearPersistedState()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear persisted state:',
        expect.any(Error)
      )
      
      // Restore mocks
      removeItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('integration scenarios', () => {
    it('should maintain state consistency across updates', () => {
      const updates = [
        { score: 10, streak: 1 },
        { score: 30, streak: 2 },
        { timeRemaining: 45 },
        { gameStatus: 'playing' as const }
      ]
      
      updates.forEach(update => {
        gameStore.updateState(update)
      })
      
      const finalState = gameStore.getState()
      expect(finalState.score).toBe(30)
      expect(finalState.streak).toBe(2)
      expect(finalState.timeRemaining).toBe(45)
      expect(finalState.gameStatus).toBe('playing')
    })

    it('should handle rapid state updates correctly', () => {
      const callback = vi.fn()
      gameStore.subscribe(callback)
      
      // Rapid fire updates
      for (let i = 0; i < 10; i++) {
        gameStore.updateState({ score: i * 10 })
      }
      
      expect(callback).toHaveBeenCalledTimes(10)
      expect(gameStore.getState().score).toBe(90)
    })
  })
})