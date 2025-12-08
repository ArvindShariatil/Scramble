/**
 * Analytics & Insights System
 * Privacy-first gameplay analytics for Scramble Anagram Game
 * 
 * Core Design Principles:
 * - Local storage only (no external tracking)
 * - User privacy and control paramount
 * - Performance metrics for optimization
 * - Actionable insights for improvement
 */

export interface GameSession {
  id: string;
  startTime: number;
  endTime?: number;
  anagramsAttempted: number;
  anagramsCompleted: number;
  wordsSkipped: number;
  totalScore: number;
  averageResponseTime: number;
  soundEnabled: boolean;
  completedNaturally: boolean; // vs abandoned
}

export interface AnagramMetrics {
  word: string;
  scrambled: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attemptTime: number;
  solutionTime?: number;
  wasSkipped: boolean;
  inputErrors: number;
  hintUsed: boolean;
}

export interface PerformanceMetrics {
  loadTime: number;
  averageInputResponseTime: number;
  timerAccuracy: number; // How close timer is to expected intervals
  soundSystemLatency: number;
  renderingPerformance: number;
}

export interface UserPreferences {
  soundEnabled: boolean;
  volumeLevel: number;
  skipBehavior: 'encouraged' | 'neutral';
  difficultyPreference: string;
  sessionLength: 'short' | 'medium' | 'long';
}

export interface GameAnalytics {
  // Core Metrics
  totalSessions: number;
  totalPlayTime: number; // milliseconds
  totalAnagramsAttempted: number;
  totalAnagramsCompleted: number;
  totalWordsSkipped: number;
  totalScore: number;

  // Performance Analytics
  averageSessionDuration: number;
  averageSolveTime: number;
  successRate: number; // percentage
  skipRate: number; // percentage
  
  // Difficulty Analysis
  difficultyBreakdown: {
    easy: { attempts: number; completions: number; avgTime: number; skipRate: number };
    medium: { attempts: number; completions: number; avgTime: number; skipRate: number };
    hard: { attempts: number; completions: number; avgTime: number; skipRate: number };
  };

  // User Experience Metrics
  inputErrorRate: number; // errors per successful input
  featureUsage: {
    soundToggled: number;
    settingsOpened: number;
    hintsRequested: number;
    keyboardShortcuts: number;
  };

  // Performance Insights
  performance: PerformanceMetrics;
  
  // Privacy & Settings
  analyticsEnabled: boolean;
  dataRetentionDays: number;
  lastClearDate?: number;
  
  // Metadata
  firstSession: number;
  lastSession: number;
  version: string;
}

export const AnalyticsEvent = {
  // Session Events
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  SESSION_ABANDONED: 'session_abandoned',
  
  // Game Events
  ANAGRAM_PRESENTED: 'anagram_presented',
  ANAGRAM_ATTEMPTED: 'anagram_attempted',
  ANAGRAM_SOLVED: 'anagram_solved',
  ANAGRAM_SKIPPED: 'anagram_skipped',
  TIMER_TIMEOUT: 'timer_timeout',
  SOLUTION_REVEALED: 'solution_revealed',
  TIMEOUT_SOLUTION_DISMISSED_EARLY: 'timeout_solution_dismissed_early',
  HINT_REQUESTED: 'hint_requested',
  
  // Input Events
  INPUT_VALIDATION_SUCCESS: 'input_validation_success',
  INPUT_VALIDATION_ERROR: 'input_validation_error',
  INPUT_CLEARED: 'input_cleared',
  KEYBOARD_SHORTCUT_USED: 'keyboard_shortcut_used',
  
  // UI Events
  SOUND_TOGGLED: 'sound_toggled',
  VOLUME_CHANGED: 'volume_changed',
  SETTINGS_OPENED: 'settings_opened',
  SETTINGS_CHANGED: 'settings_changed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  DATA_EXPORTED: 'data_exported',
  DATA_CLEARED: 'data_cleared',
  
  // Epic 6 Events
  WORD_MODE_CHANGED: 'word_mode_changed',
  OFFLINE_DETECTED: 'offline_detected',
  ONLINE_DETECTED: 'online_detected',
  
  // Performance Events
  LOAD_TIME_MEASURED: 'load_time_measured',
  INPUT_RESPONSE_TIME: 'input_response_time',
  TIMER_ACCURACY_CHECK: 'timer_accuracy_check',
  SOUND_LATENCY_MEASURED: 'sound_latency_measured',
  RENDER_PERFORMANCE_CHECK: 'render_performance_check'
} as const;

export type AnalyticsEvent = typeof AnalyticsEvent[keyof typeof AnalyticsEvent];

interface EventData {
  timestamp?: number;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Privacy-First Analytics Engine
 * Collects gameplay insights while respecting user privacy
 */
export class Analytics {
  private data: GameAnalytics;
  private currentSession: GameSession | null = null;
  private enabled: boolean = true;
  private timingMarkers: Map<string, number> = new Map();
  private storageKey = 'scramble-analytics';
  private privacyStorageKey = 'scramble-privacy-settings';

  constructor() {
    try {
      this.data = this.loadAnalytics();
      this.enabled = this.getPrivacySetting('analyticsEnabled', true);
      
      // Set up automatic session cleanup
      this.cleanupOldData();
      
      // Listen for page unload to end session gracefully
      window.addEventListener('beforeunload', () => {
        this.endCurrentSession();
      });

      console.log('🔍 Analytics initialized - Privacy-first local tracking active');
    } catch (error) {
      console.warn('Analytics initialization failed, using defaults:', error);
      this.data = this.createDefaultAnalytics();
      this.enabled = true;
    }
  }

  /**
   * Track a gameplay or interaction event
   */
  track(event: AnalyticsEvent, eventData: EventData = {}): void {
    if (!this.enabled) return;

    try {
      const data = {
        ...eventData,
        timestamp: Date.now(),
        sessionId: this.currentSession?.id
      };

      switch (event) {
        case AnalyticsEvent.SESSION_STARTED:
          this.startNewSession(data);
          break;
          
        case AnalyticsEvent.ANAGRAM_PRESENTED:
          this.trackAnagramPresented(data);
          break;
          
        case AnalyticsEvent.ANAGRAM_SOLVED:
          this.trackAnagramSolved(data);
          break;
          
        case AnalyticsEvent.ANAGRAM_SKIPPED:
          this.trackAnagramSkipped(data);
          break;
          
        case AnalyticsEvent.INPUT_VALIDATION_ERROR:
          this.trackInputError(data);
          break;
          
        case AnalyticsEvent.SOUND_TOGGLED:
          this.trackSoundToggle(data);
          break;
          
        case AnalyticsEvent.SETTINGS_OPENED:
          this.data.featureUsage.settingsOpened++;
          break;
          
        case AnalyticsEvent.KEYBOARD_SHORTCUT_USED:
          this.data.featureUsage.keyboardShortcuts++;
          break;
          
        default:
          // Generic event tracking
          this.trackGenericEvent(event, data);
      }

      this.saveAnalytics();
    } catch (error) {
      console.warn('Analytics tracking error (non-critical):', error);
    }
  }

  /**
   * Measure performance of a function execution
   */
  measurePerformance<T>(label: string, fn: () => T): T {
    if (!this.enabled) return fn();

    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordPerformanceMetric(label, duration);
    return result;
  }

  /**
   * Start timing a process
   */
  startTiming(label: string): void {
    if (!this.enabled) return;
    this.timingMarkers.set(label, performance.now());
  }

  /**
   * End timing and record duration
   */
  endTiming(label: string): number {
    if (!this.enabled) return 0;
    
    const startTime = this.timingMarkers.get(label);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.timingMarkers.delete(label);
    this.recordPerformanceMetric(label, duration);
    
    return duration;
  }

  /**
   * Get comprehensive analytics insights
   */
  getInsights(): GameAnalytics {
    this.calculateDerivedMetrics();
    return { ...this.data };
  }

  /**
   * Export analytics data as JSON for user download
   */
  exportData(): string {
    const exportData = {
      analytics: this.getInsights(),
      privacySettings: this.getPrivacySettings(),
      exportDate: new Date().toISOString(),
      note: "This data is stored locally on your device only"
    };
    
    this.track(AnalyticsEvent.DATA_EXPORTED);
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all analytics data (user privacy control)
   */
  clearAllData(): void {
    try {
      this.data = this.createDefaultAnalytics();
      this.currentSession = null;
      this.data.lastClearDate = Date.now();
      
      localStorage.removeItem(this.storageKey);
      this.saveAnalytics();
      
      console.log('📊 Analytics data cleared by user');
    } catch (error) {
      console.warn('Analytics clear data error (non-critical):', error);
    }
  }

  /**
   * Enable or disable analytics collection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.data.analyticsEnabled = enabled;
    this.setPrivacySetting('analyticsEnabled', enabled);
    
    if (!enabled) {
      this.endCurrentSession();
    }
    
    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'} by user`);
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a new game session
   */
  private startNewSession(data: EventData): void {
    // End previous session if exists
    this.endCurrentSession();
    
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      anagramsAttempted: 0,
      anagramsCompleted: 0,
      wordsSkipped: 0,
      totalScore: 0,
      averageResponseTime: 0,
      soundEnabled: data.soundEnabled || false,
      completedNaturally: false
    };

    this.data.totalSessions++;
    this.data.lastSession = Date.now();
    
    if (this.data.firstSession === 0) {
      this.data.firstSession = Date.now();
    }
  }

  /**
   * End current session gracefully
   */
  endCurrentSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.completedNaturally = true;
    
    const sessionDuration = this.currentSession.endTime - this.currentSession.startTime;
    this.data.totalPlayTime += sessionDuration;
    
    this.currentSession = null;
    this.saveAnalytics();
  }

  /**
   * Track anagram presentation
   */
  private trackAnagramPresented(data: EventData): void {
    if (this.currentSession) {
      this.currentSession.anagramsAttempted++;
      this.data.totalAnagramsAttempted++;
      
      // Track difficulty breakdown
      const difficulty = data.difficulty as keyof typeof this.data.difficultyBreakdown;
      if (difficulty && this.data.difficultyBreakdown[difficulty]) {
        this.data.difficultyBreakdown[difficulty].attempts++;
      }
    }
  }

  /**
   * Track successful anagram solution
   */
  private trackAnagramSolved(data: EventData): void {
    if (this.currentSession) {
      this.currentSession.anagramsCompleted++;
      this.data.totalAnagramsCompleted++;
      
      if (data.score) {
        this.currentSession.totalScore += data.score;
        this.data.totalScore += data.score;
      }

      // Track difficulty completions
      const difficulty = data.difficulty as keyof typeof this.data.difficultyBreakdown;
      if (difficulty && this.data.difficultyBreakdown[difficulty]) {
        this.data.difficultyBreakdown[difficulty].completions++;
        
        if (data.solveTime) {
          const current = this.data.difficultyBreakdown[difficulty];
          current.avgTime = (current.avgTime * (current.completions - 1) + data.solveTime) / current.completions;
        }
      }
    }
  }

  /**
   * Track anagram skip events
   */
  private trackAnagramSkipped(data: EventData): void {
    if (this.currentSession) {
      this.currentSession.wordsSkipped++;
      this.data.totalWordsSkipped++;
      
      // Update difficulty skip rates
      const difficulty = data.difficulty as keyof typeof this.data.difficultyBreakdown;
      if (difficulty && this.data.difficultyBreakdown[difficulty]) {
        const diffData = this.data.difficultyBreakdown[difficulty];
        diffData.skipRate = (diffData.attempts > 0) 
          ? ((this.data.totalWordsSkipped / this.data.totalAnagramsAttempted) * 100) 
          : 0;
      }
    }
  }

  /**
   * Track input validation errors
   */
  private trackInputError(data: EventData): void {
    // Calculate input error rate
    const totalInputs = this.data.totalAnagramsCompleted + (data.errorCount || 1);
    this.data.inputErrorRate = (data.errorCount || 1) / totalInputs;
  }

  /**
   * Track sound toggle events
   */
  private trackSoundToggle(data: EventData): void {
    this.data.featureUsage.soundToggled++;
    
    if (this.currentSession) {
      this.currentSession.soundEnabled = data.enabled || false;
    }
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetric(label: string, duration: number): void {
    switch (label) {
      case 'load_time':
        this.data.performance.loadTime = duration;
        break;
      case 'input_response':
        this.data.performance.averageInputResponseTime = duration;
        break;
      case 'timer_accuracy':
        this.data.performance.timerAccuracy = duration;
        break;
      case 'sound_latency':
        this.data.performance.soundSystemLatency = duration;
        break;
      case 'render_performance':
        this.data.performance.renderingPerformance = duration;
        break;
    }
  }

  /**
   * Update running average metrics
   */
  private updateAverageMetric(metric: string, newValue: number): void {
    const count = Math.max(this.data.totalSessions, 1);
    // Update specific performance metrics
    if (metric === 'averageInputResponseTime') {
      this.data.performance.averageInputResponseTime = newValue;
    }
  }

  /**
   * Calculate derived metrics from raw data
   */
  private calculateDerivedMetrics(): void {
    // Success rate
    this.data.successRate = this.data.totalAnagramsAttempted > 0 
      ? (this.data.totalAnagramsCompleted / this.data.totalAnagramsAttempted) * 100 
      : 0;

    // Skip rate  
    this.data.skipRate = this.data.totalAnagramsAttempted > 0
      ? (this.data.totalWordsSkipped / this.data.totalAnagramsAttempted) * 100
      : 0;

    // Average session duration
    this.data.averageSessionDuration = this.data.totalSessions > 0
      ? this.data.totalPlayTime / this.data.totalSessions
      : 0;

    // Average solve time (approximate)
    this.data.averageSolveTime = this.data.totalAnagramsCompleted > 0
      ? (this.data.totalPlayTime * 0.8) / this.data.totalAnagramsCompleted // Estimate 80% of time spent solving
      : 0;
  }

  /**
   * Track generic events
   */
  private trackGenericEvent(event: AnalyticsEvent, _data: EventData): void {
    // Store generic events for feature usage analysis
    const eventKey = event.toString();
    if (!this.data.featureUsage[eventKey as keyof typeof this.data.featureUsage]) {
      (this.data.featureUsage as any)[eventKey] = 0;
    }
    (this.data.featureUsage as any)[eventKey]++;
  }

  /**
   * Load analytics from localStorage
   */
  private loadAnalytics(): GameAnalytics {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migrate old data format if needed
        return this.migrateDataFormat(parsed);
      }
    } catch (error) {
      console.warn('Failed to load analytics (creating new):', error);
    }
    
    return this.createDefaultAnalytics();
  }

  /**
   * Save analytics to localStorage
   */
  private saveAnalytics(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save analytics:', error);
    }
  }

  /**
   * Create default analytics structure
   */
  private createDefaultAnalytics(): GameAnalytics {
    return {
      totalSessions: 0,
      totalPlayTime: 0,
      totalAnagramsAttempted: 0,
      totalAnagramsCompleted: 0,
      totalWordsSkipped: 0,
      totalScore: 0,
      
      averageSessionDuration: 0,
      averageSolveTime: 0,
      successRate: 0,
      skipRate: 0,
      
      difficultyBreakdown: {
        easy: { attempts: 0, completions: 0, avgTime: 0, skipRate: 0 },
        medium: { attempts: 0, completions: 0, avgTime: 0, skipRate: 0 },
        hard: { attempts: 0, completions: 0, avgTime: 0, skipRate: 0 }
      },
      
      inputErrorRate: 0,
      featureUsage: {
        soundToggled: 0,
        settingsOpened: 0,
        hintsRequested: 0,
        keyboardShortcuts: 0
      },
      
      performance: {
        loadTime: 0,
        averageInputResponseTime: 0,
        timerAccuracy: 100,
        soundSystemLatency: 0,
        renderingPerformance: 0
      },
      
      analyticsEnabled: true,
      dataRetentionDays: 90,
      
      firstSession: 0,
      lastSession: 0,
      version: '1.0.0'
    };
  }

  /**
   * Migrate old data format to new structure
   */
  private migrateDataFormat(oldData: any): GameAnalytics {
    const defaultData = this.createDefaultAnalytics();
    
    // Merge old data with default structure
    return {
      ...defaultData,
      ...oldData,
      version: '1.0.0'
    };
  }

  /**
   * Clean up old analytics data based on retention policy
   */
  private cleanupOldData(): void {
    const retentionMs = this.data.dataRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - retentionMs;
    
    if (this.data.firstSession < cutoffDate) {
      console.log('📊 Cleaning up old analytics data (privacy retention)');
      // Reset data but keep current session
      const currentSession = this.currentSession;
      this.clearAllData();
      this.currentSession = currentSession;
    }
  }

  /**
   * Privacy settings management
   */
  private getPrivacySetting(key: string, defaultValue: any): any {
    try {
      const settings = localStorage.getItem(this.privacyStorageKey);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed[key] !== undefined ? parsed[key] : defaultValue;
      }
    } catch (error) {
      console.warn('Failed to load privacy settings:', error);
    }
    return defaultValue;
  }

  private setPrivacySetting(key: string, value: any): void {
    try {
      let settings = {};
      const existing = localStorage.getItem(this.privacyStorageKey);
      if (existing) {
        settings = JSON.parse(existing);
      }
      
      (settings as any)[key] = value;
      localStorage.setItem(this.privacyStorageKey, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save privacy setting:', error);
    }
  }

  private getPrivacySettings(): any {
    try {
      const settings = localStorage.getItem(this.privacyStorageKey);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      return {};
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();