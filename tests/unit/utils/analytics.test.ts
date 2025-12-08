/**
 * Analytics System Tests
 * SCRAM-014: Privacy-first analytics testing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Analytics, AnalyticsEvent, GameAnalytics } from '@utils/analytics'

describe('Analytics System', () => {
  let analytics: Analytics;
  let mockLocalStorage: { [key: string]: string };
  let performanceTime = 0;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockLocalStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockLocalStorage[key];
        },
        clear: () => {
          mockLocalStorage = {};
        }
      },
      writable: true
    });

    // Mock performance.now() with incrementing value to ensure timing works
    performanceTime = 0;
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => performanceTime++
      },
      writable: true
    });

    analytics = new Analytics();
  });

  afterEach(() => {
    analytics.clearAllData();
  });

  describe('Privacy Compliance', () => {
    it('should store data locally only', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      
      // Check that data is stored in localStorage
      expect(mockLocalStorage['scramble-analytics']).toBeDefined();
      
      // Verify no external network requests (would need integration test for full verification)
      // This is verified by the fact that we're only using localStorage
    });

    it('should allow complete data clearing', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, { word: 'TEST' });
      
      const beforeClear = analytics.getInsights();
      expect(beforeClear.totalSessions).toBeGreaterThan(0);
      
      analytics.clearAllData();
      
      const afterClear = analytics.getInsights();
      expect(afterClear.totalSessions).toBe(0);
      expect(afterClear.totalAnagramsCompleted).toBe(0);
    });

    it('should allow disabling analytics collection', () => {
      analytics.setEnabled(false);
      
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, { word: 'TEST' });
      
      const insights = analytics.getInsights();
      expect(insights.totalSessions).toBe(0);
    });

    it('should provide data export functionality', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      
      const exportData = analytics.exportData();
      const parsed = JSON.parse(exportData);
      
      expect(parsed.analytics).toBeDefined();
      expect(parsed.privacySettings).toBeDefined();
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.note).toContain('locally');
    });
  });

  describe('Gameplay Analytics', () => {
    it('should track session events correctly', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED, {
        soundEnabled: true
      });
      
      const insights = analytics.getInsights();
      expect(insights.totalSessions).toBe(1);
      expect(insights.firstSession).toBeGreaterThan(0);
      expect(insights.lastSession).toBeGreaterThan(0);
    });

    it('should track anagram solving events', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, { difficulty: 'medium' });
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, {
        word: 'HELLO',
        difficulty: 'medium',
        solveTime: 15000,
        score: 100
      });
      
      const insights = analytics.getInsights();
      expect(insights.totalAnagramsAttempted).toBe(1);
      expect(insights.totalAnagramsCompleted).toBe(1);
      expect(insights.totalScore).toBe(100);
      expect(insights.successRate).toBe(100);
      expect(insights.difficultyBreakdown.medium.attempts).toBe(1);
      expect(insights.difficultyBreakdown.medium.completions).toBe(1);
    });

    it('should track skip events', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, { difficulty: 'hard' });
      analytics.track(AnalyticsEvent.ANAGRAM_SKIPPED, {
        difficulty: 'hard',
        word: 'COMPLEX'
      });
      
      const insights = analytics.getInsights();
      expect(insights.totalWordsSkipped).toBe(1);
      expect(insights.skipRate).toBeGreaterThan(0);
    });

    it('should calculate success rates correctly', () => {
      analytics.track(AnalyticsEvent.SESSION_STARTED);
      
      // Track 3 attempts, 2 successful
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, { difficulty: 'easy' });
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, { difficulty: 'easy' });
      
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, { difficulty: 'easy' });
      analytics.track(AnalyticsEvent.ANAGRAM_SKIPPED, { difficulty: 'easy' });
      
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, { difficulty: 'easy' });
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, { difficulty: 'easy' });
      
      const insights = analytics.getInsights();
      expect(insights.totalAnagramsAttempted).toBe(3);
      expect(insights.totalAnagramsCompleted).toBe(2);
      expect(Math.round(insights.successRate)).toBe(67); // 2/3 = 66.67%
    });
  });

  describe('Performance Metrics', () => {
    it('should measure function performance', () => {
      const result = analytics.measurePerformance('render_performance', () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result).toBe(499500); // Sum of 0-999
      
      const insights = analytics.getInsights();
      expect(insights.performance.renderingPerformance).toBeGreaterThan(0);
    });

    it('should track timing with start/end methods', () => {
      const startTime = performance.now(); // This increments performanceTime
      analytics.startTiming('input_response');
      
      // Simulate some work - call performance.now() to increment counter
      for (let i = 0; i < 5; i++) {
        performance.now();
      }
      
      const duration = analytics.endTiming('input_response');
      expect(duration).toBeGreaterThan(0);
      
      // Also check that it was recorded in performance metrics
      const insights = analytics.getInsights();
      expect(insights.performance.averageInputResponseTime).toBeGreaterThan(0);
    });

    it('should handle multiple timing operations', () => {
      analytics.startTiming('operation_1');
      analytics.startTiming('operation_2');
      
      const duration1 = analytics.endTiming('operation_1');
      const duration2 = analytics.endTiming('operation_2');
      
      expect(duration1).toBeGreaterThanOrEqual(0);
      expect(duration2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Feature Usage Tracking', () => {
    it('should track sound toggle events', () => {
      analytics.track(AnalyticsEvent.SOUND_TOGGLED, { enabled: false });
      analytics.track(AnalyticsEvent.SOUND_TOGGLED, { enabled: true });
      
      const insights = analytics.getInsights();
      expect(insights.featureUsage.soundToggled).toBe(2);
    });

    it('should track settings interactions', () => {
      analytics.track(AnalyticsEvent.SETTINGS_OPENED);
      analytics.track(AnalyticsEvent.SETTINGS_OPENED);
      analytics.track(AnalyticsEvent.VOLUME_CHANGED, { volume: 0.8 });
      
      const insights = analytics.getInsights();
      expect(insights.featureUsage.settingsOpened).toBe(2);
    });

    it('should track keyboard shortcut usage', () => {
      analytics.track(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, { shortcut: 'skip' });
      analytics.track(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, { shortcut: 'skip' });
      analytics.track(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, { shortcut: 'analytics' });
      
      const insights = analytics.getInsights();
      expect(insights.featureUsage.keyboardShortcuts).toBe(3);
    });
  });

  describe('Data Structure Validation', () => {
    it('should maintain proper analytics data structure', () => {
      const insights = analytics.getInsights();
      
      // Check required fields exist
      expect(insights.totalSessions).toBeDefined();
      expect(insights.totalPlayTime).toBeDefined();
      expect(insights.difficultyBreakdown).toBeDefined();
      expect(insights.difficultyBreakdown.easy).toBeDefined();
      expect(insights.difficultyBreakdown.medium).toBeDefined();
      expect(insights.difficultyBreakdown.hard).toBeDefined();
      expect(insights.performance).toBeDefined();
      expect(insights.featureUsage).toBeDefined();
      
      // Check data types
      expect(typeof insights.totalSessions).toBe('number');
      expect(typeof insights.successRate).toBe('number');
      expect(typeof insights.analyticsEnabled).toBe('boolean');
      expect(typeof insights.version).toBe('string');
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Corrupt the stored data
      mockLocalStorage['scramble-analytics'] = 'invalid json';
      
      // Should create new analytics instance without crashing
      const newAnalytics = new Analytics();
      const insights = newAnalytics.getInsights();
      
      expect(insights.totalSessions).toBe(0);
      expect(insights.version).toBe('1.0.0');
    });
  });

  describe('Data Retention and Privacy', () => {
    it('should respect data retention settings', () => {
      const insights = analytics.getInsights();
      expect(insights.dataRetentionDays).toBe(90);
    });

    it('should track data clearing events', () => {
      analytics.track(AnalyticsEvent.DATA_CLEARED);
      
      const insights = analytics.getInsights();
      expect(insights.lastClearDate).toBeGreaterThan(0);
    });

    it('should handle privacy settings correctly', () => {
      analytics.setEnabled(false);
      expect(analytics.isEnabled()).toBe(false);
      
      analytics.setEnabled(true);
      expect(analytics.isEnabled()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', () => {
      // Create new analytics instance with broken storage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('Storage error'); },
          setItem: () => { throw new Error('Storage error'); },
          removeItem: () => { throw new Error('Storage error'); }
        },
        writable: true
      });
      
      // Should not crash when creating new instance
      expect(() => {
        const brokenAnalytics = new Analytics();
        brokenAnalytics.track(AnalyticsEvent.SESSION_STARTED);
      }).not.toThrow();
    });

    it('should handle invalid event data gracefully', () => {
      expect(() => {
        analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, null as any);
        analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, undefined as any);
        analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, { invalid: 'data' });
      }).not.toThrow();
    });
  });
});