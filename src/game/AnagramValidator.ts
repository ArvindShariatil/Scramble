// SCRAM-008: Anagram Solution Validation
// Comprehensive validation combining letter checking and word validation

import { WordsAPIClient, type ValidationResult as APIValidationResult } from '@api/WordsAPI'

export interface AnagramValidationResult {
  valid: boolean
  error?: string
  errorType?: 'letters' | 'word' | 'length' | 'characters'
  details?: {
    scrambled: string
    solution: string
    lettersMatch: boolean
    wordValid: boolean
    source?: 'api' | 'cache' | 'local'
  }
}

export interface ValidationStats {
  totalValidations: number
  correctSolutions: number
  letterErrors: number
  wordErrors: number
  averageTime: number
}

/**
 * Comprehensive anagram solution validator
 * Combines letter validation with word validation
 */
export class AnagramValidator {
  private wordsAPI: WordsAPIClient
  private stats: ValidationStats = {
    totalValidations: 0,
    correctSolutions: 0,
    letterErrors: 0,
    wordErrors: 0,
    averageTime: 0
  }
  
  constructor() {
    this.wordsAPI = new WordsAPIClient()
    console.log('AnagramValidator initialized with WordsAPI integration')
  }
  
  /**
   * Validate an anagram solution comprehensively
   * Checks both letter usage and word validity
   */
  async validateSolution(
    scrambled: string, 
    solution: string
  ): Promise<AnagramValidationResult> {
    const startTime = performance.now()
    
    try {
      // Update statistics
      this.stats.totalValidations++
      
      // Step 1: Input validation
      const inputValidation = this.validateInput(scrambled, solution)
      if (!inputValidation.valid) {
        this.updateStats('input', performance.now() - startTime)
        return inputValidation
      }
      
      // Step 2: Letter validation (fast, local check)
      const letterValidation = this.validateLetterUsage(scrambled, solution)
      if (!letterValidation.valid) {
        this.stats.letterErrors++
        this.updateStats('letters', performance.now() - startTime)
        return {
          ...letterValidation,
          details: {
            scrambled: scrambled.toLowerCase().trim(),
            solution: solution.toLowerCase().trim(),
            lettersMatch: false,
            wordValid: false
          }
        }
      }
      
      // Step 3: Word validation (API call)
      const wordValidation = await this.validateWord(solution)
      const duration = performance.now() - startTime
      
      if (wordValidation.valid) {
        this.stats.correctSolutions++
        this.updateStats('success', duration)
        
        return {
          valid: true,
          details: {
            scrambled: scrambled.toLowerCase().trim(),
            solution: solution.toLowerCase().trim(),
            lettersMatch: true,
            wordValid: true,
            source: wordValidation.source
          }
        }
      } else {
        this.stats.wordErrors++
        this.updateStats('word', duration)
        
        return {
          valid: false,
          error: wordValidation.error || 'Word not found in dictionary',
          errorType: 'word',
          details: {
            scrambled: scrambled.toLowerCase().trim(),
            solution: solution.toLowerCase().trim(),
            lettersMatch: true,
            wordValid: false,
            source: wordValidation.source
          }
        }
      }
      
    } catch (error) {
      const duration = performance.now() - startTime
      this.updateStats('error', duration)
      
      console.error('Anagram validation error:', error)
      return {
        valid: false,
        error: 'Validation system error. Please try again.',
        errorType: 'word',
        details: {
          scrambled: scrambled.toLowerCase().trim(),
          solution: solution.toLowerCase().trim(),
          lettersMatch: false,
          wordValid: false
        }
      }
    }
  }
  
  /**
   * Validate input parameters
   */
  private validateInput(
    scrambled: string, 
    solution: string
  ): AnagramValidationResult {
    // Check for empty inputs
    if (!scrambled?.trim() || !solution?.trim()) {
      return {
        valid: false,
        error: 'Both scrambled word and solution must be provided',
        errorType: 'length'
      }
    }
    
    // Check minimum length
    const cleanSolution = solution.trim()
    if (cleanSolution.length < 2) {
      return {
        valid: false,
        error: 'Solution must be at least 2 characters long',
        errorType: 'length'
      }
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z\s]+$/.test(cleanSolution)) {
      return {
        valid: false,
        error: 'Solution must contain only letters',
        errorType: 'characters'
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Validate that solution uses all scrambled letters exactly once
   */
  private validateLetterUsage(
    scrambled: string, 
    solution: string
  ): AnagramValidationResult {
    // Normalize inputs (lowercase, remove spaces)
    const scrambledClean = scrambled.toLowerCase().replace(/\s/g, '')
    const solutionClean = solution.toLowerCase().replace(/\s/g, '')
    
    // Check length first (quick check)
    if (scrambledClean.length !== solutionClean.length) {
      return {
        valid: false,
        error: `Solution must use all ${scrambledClean.length} letters (used ${solutionClean.length})`,
        errorType: 'letters'
      }
    }
    
    // Check character frequency (comprehensive check)
    const scrambledSorted = [...scrambledClean].sort().join('')
    const solutionSorted = [...solutionClean].sort().join('')
    
    if (scrambledSorted !== solutionSorted) {
      // Provide specific feedback about which letters are wrong
      const scrambledFreq = this.getCharacterFrequency(scrambledClean)
      const solutionFreq = this.getCharacterFrequency(solutionClean)
      
      const extraChars: string[] = []
      const missingChars: string[] = []
      
      // Find extra characters in solution
      for (const [char, count] of solutionFreq) {
        const scrambledCount = scrambledFreq.get(char) || 0
        if (count > scrambledCount) {
          for (let i = 0; i < count - scrambledCount; i++) {
            extraChars.push(char)
          }
        }
      }
      
      // Find missing characters from scrambled
      for (const [char, count] of scrambledFreq) {
        const solutionCount = solutionFreq.get(char) || 0
        if (count > solutionCount) {
          for (let i = 0; i < count - solutionCount; i++) {
            missingChars.push(char)
          }
        }
      }
      
      let errorMessage = 'Must use all letters exactly once'
      if (extraChars.length > 0) {
        errorMessage += `. Extra: ${extraChars.join(', ')}`
      }
      if (missingChars.length > 0) {
        errorMessage += `. Missing: ${missingChars.join(', ')}`
      }
      
      return {
        valid: false,
        error: errorMessage,
        errorType: 'letters'
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Get character frequency map for detailed error reporting
   */
  private getCharacterFrequency(text: string): Map<string, number> {
    const freq = new Map<string, number>()
    for (const char of text) {
      freq.set(char, (freq.get(char) || 0) + 1)
    }
    return freq
  }
  
  /**
   * Validate that solution is a valid English word
   */
  private async validateWord(word: string): Promise<APIValidationResult> {
    // Use WordsAPI for validation
    // In the future, this will fallback to local dictionary (SCRAM-007)
    return await this.wordsAPI.validateWord(word.trim())
  }
  
  /**
   * Update performance statistics
   */
  private updateStats(_type: string, duration: number): void {
    // Update rolling average for performance tracking
    const currentAvg = this.stats.averageTime
    const totalCount = this.stats.totalValidations
    
    if (totalCount === 1) {
      this.stats.averageTime = duration
    } else {
      // Rolling average: new_avg = old_avg + (new_value - old_avg) / count
      this.stats.averageTime = currentAvg + (duration - currentAvg) / totalCount
    }
  }
  
  /**
   * Get validation statistics for monitoring and debugging
   */
  getStats(): ValidationStats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics (useful for testing)
   */
  resetStats(): void {
    this.stats = {
      totalValidations: 0,
      correctSolutions: 0,
      letterErrors: 0,
      wordErrors: 0,
      averageTime: 0
    }
  }
  
  /**
   * Quick validation for multiple solutions (batch processing)
   */
  async validateMultiple(
    scrambled: string, 
    solutions: string[]
  ): Promise<AnagramValidationResult[]> {
    const promises = solutions.map(solution => 
      this.validateSolution(scrambled, solution)
    )
    
    return await Promise.all(promises)
  }
  
  /**
   * Check if a word could be a valid anagram (letter validation only)
   * Useful for real-time feedback before full validation
   */
  isValidAnagramStructure(scrambled: string, solution: string): boolean {
    try {
      const result = this.validateLetterUsage(scrambled, solution)
      return result.valid
    } catch {
      return false
    }
  }
}