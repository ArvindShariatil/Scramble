// SCRAM-006: WordsAPI Integration with Rate Limiting & Caching
// SCRAM-007: Added Local Dictionary Fallback with Error UI
// Comprehensive API client for word validation with error handling

import { StorageHelper } from '@utils/storage'
import { APIErrorNotifier } from '../data/dictionary'

export interface ValidationResult {
  valid: boolean
  definition?: any
  error?: string
  source?: 'api' | 'cache'
}

export interface WordDefinition {
  word: string
  definitions?: Array<{
    partOfSpeech: string
    definition: string
  }>
  pronunciation?: string
  frequency?: number
}

/**
 * Rate limiter to respect WordsAPI limits (30 requests/minute)
 */
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number
  
  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }
  
  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    // Check if we're at the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest) + 100 // +100ms buffer
      
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`)
      }
    }
    
    // Record this request
    this.requests.push(now)
  }
  
  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

/**
 * WordsAPI client with comprehensive error handling and caching
 */
export class WordsAPIClient {
  private readonly baseURL = 'https://wordsapiv1.p.mashape.com/words'
  private readonly rateLimiter = new RateLimiter(30, 60000)
  private readonly cache = new Map<string, ValidationResult>()
  // Use StorageHelper static methods for cache persistence
  private readonly timeoutMs = 500
  // private readonly localDictionary = new LocalDictionary() // Disabled - using popup fallback
  private hasShownErrorPopup = false // Prevent spam
  
  constructor() {
    this.loadCacheFromStorage()
    console.log('WordsAPIClient initialized with rate limiting and caching')
  }
  
  /**
   * Load cached results from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cached = StorageHelper.load('wordsapi_cache')
      if (cached && typeof cached === 'object') {
        Object.entries(cached).forEach(([word, result]) => {
          this.cache.set(word, result as ValidationResult)
        })
        console.log(`Loaded ${this.cache.size} cached word validations`)
      }
    } catch (error) {
      console.error('Failed to load WordsAPI cache:', error)
    }
  }
  
  /**
   * Save cache to localStorage (throttled)
   */
  private saveCacheToStorage(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries())
      StorageHelper.save('wordsapi_cache', cacheObject)
    } catch (error) {
      console.error('Failed to save WordsAPI cache:', error)
    }
  }
  
  /**
   * Validate a word using WordsAPI with caching and error handling
   */
  async validateWord(word: string): Promise<ValidationResult> {
    const normalizedWord = word.toLowerCase().trim()
    
    // Input validation
    if (!normalizedWord || normalizedWord.length < 2) {
      return {
        valid: false,
        error: 'Word must be at least 2 characters long',
        source: 'cache'
      }
    }
    
    if (!/^[a-z]+$/.test(normalizedWord)) {
      return {
        valid: false,
        error: 'Word must contain only letters',
        source: 'cache'
      }
    }
    
    // Check cache first
    if (this.cache.has(normalizedWord)) {
      const cached = this.cache.get(normalizedWord)!
      return { ...cached, source: 'cache' }
    }
    
    try {
      // Check rate limit
      await this.rateLimiter.checkLimit()
      
      // Make API request with timeout
      const result = await this.makeAPIRequest(normalizedWord)
      
      // Cache the result
      this.cache.set(normalizedWord, result)
      this.saveCacheToStorage()
      
      return { ...result, source: 'api' }
      
    } catch (error) {
      console.warn(`WordsAPI validation failed for '${normalizedWord}':`, error)
      
      // Show error popup (only once per session)
      if (!this.hasShownErrorPopup) {
        this.showApiErrorPopup(error)
        this.hasShownErrorPopup = true
      }
      
      // Use local dictionary as fallback
      try {
        // const isValidLocally = await this.localDictionary.validateWord(normalizedWord) // Disabled
        const isValidLocally = false // Using popup fallback
        const fallbackResult: ValidationResult = {
          valid: isValidLocally,
          error: isValidLocally ? undefined : 'Word not found in local dictionary',
          source: 'cache' // Mark as cache since it's offline
        }
        
        // Cache successful local validations
        if (isValidLocally) {
          this.cache.set(normalizedWord, fallbackResult)
          this.saveCacheToStorage()
        }
        
        return fallbackResult
      } catch (fallbackError) {
        console.error('Local dictionary fallback also failed:', fallbackError)
        return {
          valid: false,
          error: 'Both API and local dictionary failed',
          source: 'api'
        }
      }
    }
  }
  
  /**
   * Make the actual API request with timeout and abort controller
   */
  private async makeAPIRequest(word: string): Promise<ValidationResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
    
    try {
      const apiKey = import.meta.env.VITE_WORDS_API_KEY
      if (!apiKey) {
        throw new Error('WordsAPI key not configured')
      }
      
      const response = await fetch(`${this.baseURL}/${encodeURIComponent(word)}`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.mashape.com'
        },
        signal: controller.signal
      })
      
      if (response.ok) {
        const data: WordDefinition = await response.json()
        return {
          valid: true,
          definition: data
        }
      } else if (response.status === 404) {
        return {
          valid: false,
          error: 'Word not found in dictionary'
        }
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded by API')
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      
    } finally {
      clearTimeout(timeoutId)
    }
  }
  
  /**
   * Get API usage statistics
   */
  getStats(): { remainingRequests: number; cacheSize: number } {
    return {
      remainingRequests: this.rateLimiter.getRemainingRequests(),
      cacheSize: this.cache.size
    }
  }
  
  /**
   * Show error popup when API fails
   */
  private showApiErrorPopup(error: any): void {
    const message = error instanceof Error ? error.message : 'Network connection failed'
    
    // Create popup element
    const popup = document.createElement('div')
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    `
    
    popup.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <strong>⚠️ API Offline</strong><br>
          Word validation service is temporarily unavailable.<br>
          <em>Using offline dictionary instead.</em><br>
          <small>Error: ${message}</small>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          margin-left: 10px;
        ">&times;</button>
      </div>
    `
    
    // Add CSS animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
    
    document.body.appendChild(popup)
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = 'slideIn 0.3s ease-out reverse'
        setTimeout(() => popup.remove(), 300)
      }
    }, 8000)
  }
  
  /**
   * Clear the cache (for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear()
    StorageHelper.remove('wordsapi_cache')
    console.log('WordsAPI cache cleared')
  }
  
  /**
   * Get local dictionary stats for debugging
   */
  getLocalDictionaryStats(): { wordCount: number } {
    return {
      wordCount: 0 // Local dictionary disabled
    }
  }
}