/**
 * Enhanced Input Component Tests
 * SCRAM-010: Text Input Interface Enhancement
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { EnhancedInput, InputConfig } from '@ui/EnhancedInput'

describe('EnhancedInput Component', () => {
  let enhancedInput: EnhancedInput
  let config: InputConfig
  let mockStateChange: ReturnType<typeof vi.fn>
  let mockSubmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '<div id="test-container"></div>'
    
    mockStateChange = vi.fn()
    mockSubmit = vi.fn()
    
    config = {
      scrambledLetters: ['L', 'E', 'T', 'T', 'E', 'R'],
      expectedLength: 6,
      placeholder: 'Test input...',
      onStateChange: mockStateChange,
      onSubmit: mockSubmit
    }
    
    enhancedInput = new EnhancedInput(config)
  })

  test('initializes with correct default state', () => {
    const state = enhancedInput.getState()
    
    expect(state.value).toBe('')
    expect(state.characterCount).toBe(0)
    expect(state.expectedLength).toBe(6)
    expect(state.isValid).toBe(false)
    expect(state.isComplete).toBe(false)
    expect(state.validationMessage).toBe('0/6 letters')
    expect(state.remainingLetters).toEqual(['L', 'E', 'T', 'T', 'E', 'R'])
  })

  test('validates input against scrambled letters', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    // Simulate typing valid letters
    input.value = 'LET'
    input.dispatchEvent(new Event('input'))
    
    let state = enhancedInput.getState()
    expect(state.isValid).toBe(true)
    expect(state.characterCount).toBe(3)
    
    // Try invalid letter
    input.value = 'LETX'
    input.dispatchEvent(new Event('input'))
    
    state = enhancedInput.getState()
    expect(state.isValid).toBe(false)
  })

  test('detects completion when input matches expected length and is valid', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    input.value = 'LETTER'
    input.dispatchEvent(new Event('input'))
    
    const state = enhancedInput.getState()
    expect(state.isComplete).toBe(true)
    expect(state.isValid).toBe(true)
    expect(state.validationMessage).toBe('Ready to submit! ✨')
  })

  test('prevents duplicate letters beyond available count', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    // Try to use 3 T's when only 2 are available
    input.value = 'LETTT'
    input.dispatchEvent(new Event('input'))
    
    const state = enhancedInput.getState()
    expect(state.isValid).toBe(false)
  })

  test('updates remaining letters correctly', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    input.value = 'LET'
    input.dispatchEvent(new Event('input'))
    
    const state = enhancedInput.getState()
    expect(state.remainingLetters).toEqual(['T', 'E', 'R'])
  })

  test('handles keyboard shortcuts', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    // Set valid complete input
    input.value = 'LETTER'
    input.dispatchEvent(new Event('input'))
    
    // Simulate Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    input.dispatchEvent(enterEvent)
    
    expect(mockSubmit).toHaveBeenCalledWith('LETTER')
    
    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    input.dispatchEvent(escapeEvent)
    
    const state = enhancedInput.getState()
    expect(state.value).toBe('')
  })

  test('filters non-alphabetic characters', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    input.value = 'L3T@#'
    input.dispatchEvent(new Event('input'))
    
    expect(input.value).toBe('LT')
  })

  test('provides correct validation messages', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    // Empty input
    let state = enhancedInput.getState()
    expect(state.validationMessage).toBe('0/6 letters')
    
    // Valid partial input
    input.value = 'LET'
    input.dispatchEvent(new Event('input'))
    state = enhancedInput.getState()
    expect(state.validationMessage).toBe('3/6 letters')
    
    // Invalid input
    input.value = 'LETX'
    input.dispatchEvent(new Event('input'))
    state = enhancedInput.getState()
    expect(state.validationMessage).toBe('Some letters not available')
    
    // Complete valid input
    input.value = 'LETTER'
    input.dispatchEvent(new Event('input'))
    state = enhancedInput.getState()
    expect(state.validationMessage).toBe('Ready to submit! ✨')
  })

  test('updates scrambled letters dynamically', () => {
    enhancedInput.updateScrambledLetters(['C', 'A', 'T'])
    
    const state = enhancedInput.getState()
    expect(state.expectedLength).toBe(3)
    expect(state.remainingLetters).toEqual(['C', 'A', 'T'])
  })

  test('calls onStateChange callback on input changes', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    input.value = 'L'
    input.dispatchEvent(new Event('input'))
    
    expect(mockStateChange).toHaveBeenCalled()
    const calledState = mockStateChange.mock.calls[0][0]
    expect(calledState.value).toBe('L')
    expect(calledState.characterCount).toBe(1)
  })

  test('clears input and resets state', () => {
    const elements = enhancedInput.getElements()
    const input = elements.input as HTMLInputElement
    
    // Set some input
    input.value = 'LET'
    input.dispatchEvent(new Event('input'))
    
    // Clear
    enhancedInput.clear()
    
    const state = enhancedInput.getState()
    expect(state.value).toBe('')
    expect(state.characterCount).toBe(0)
    expect(state.isValid).toBe(false)
    expect(state.isComplete).toBe(false)
  })
})