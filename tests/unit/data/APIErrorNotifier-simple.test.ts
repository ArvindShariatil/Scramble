/**
 * Simple Integration Tests for API Error Notification System (SCRAM-007)
 * Focused on core functionality without complex DOM mocking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIErrorNotifier } from '../../../src/data/dictionary';

describe('APIErrorNotifier - Core Functionality', () => {
  let notifier: APIErrorNotifier;

  beforeEach(() => {
    // Clean DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    notifier = new APIErrorNotifier({
      onRetry: async () => {
        console.log('Mock retry called');
      },
      onDismiss: () => {
        console.log('Mock dismiss called');
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    (window as any).apiErrorNotifier = undefined;
  });

  describe('Basic State Management', () => {
    it('should initialize with correct default state', () => {
      expect(notifier.isShowingError()).toBe(false);
      expect(notifier.getRetryCount()).toBe(0);
    });

    it('should update state when showing popup', () => {
      notifier.showAPIErrorPopup();
      
      expect(notifier.isShowingError()).toBe(true);
      expect(notifier.getRetryCount()).toBe(1);
    });

    it('should reset state when hiding popup', () => {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
      
      expect(notifier.isShowingError()).toBe(false);
    });

    it('should track retry count correctly', () => {
      expect(notifier.getRetryCount()).toBe(0);
      
      notifier.showAPIErrorPopup();
      expect(notifier.getRetryCount()).toBe(1);
      
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup();
      expect(notifier.getRetryCount()).toBe(2);
    });

    it('should reset retry count when requested', () => {
      notifier.showAPIErrorPopup(); // count = 1
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup(); // count = 2 (new popup increments)
      expect(notifier.getRetryCount()).toBe(2);
      
      notifier.resetRetryCount();
      expect(notifier.getRetryCount()).toBe(0);
    });
  });

  describe('DOM Interaction', () => {
    it('should create popup element when shown', () => {
      notifier.showAPIErrorPopup();
      
      const popup = document.querySelector('.api-error-popup');
      expect(popup).toBeTruthy();
    });

    it('should remove popup element when hidden', () => {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
      
      const popup = document.querySelector('.api-error-popup');
      expect(popup).toBeFalsy();
    });

    it('should add CSS styles only once', () => {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup();
      
      const styleElements = document.querySelectorAll('#api-error-styles');
      expect(styleElements).toHaveLength(1);
    });

    it('should include accessibility attributes', () => {
      notifier.showAPIErrorPopup();
      
      const popup = document.querySelector('.api-error-popup');
      expect(popup?.getAttribute('role')).toBe('dialog');
      expect(popup?.getAttribute('aria-labelledby')).toBe('api-error-title');
    });

    it('should not create multiple popups', () => {
      notifier.showAPIErrorPopup();
      notifier.showAPIErrorPopup();
      notifier.showAPIErrorPopup();
      
      const popups = document.querySelectorAll('.api-error-popup');
      expect(popups).toHaveLength(1);
    });
  });

  describe('Content Validation', () => {
    it('should display correct error message', () => {
      notifier.showAPIErrorPopup();
      
      const content = document.querySelector('.popup-content');
      expect(content?.textContent).toContain('Word Validation Unavailable');
      expect(content?.textContent).toContain('You can continue playing');
    });

    it('should show retry count in popup', () => {
      notifier.showAPIErrorPopup();
      
      const retryInfo = document.querySelector('.retry-info');
      expect(retryInfo?.textContent).toContain('Retry attempt: 1');
    });

    it('should include action buttons', () => {
      notifier.showAPIErrorPopup();
      
      const retryBtn = document.querySelector('.retry-btn');
      const continueBtn = document.querySelector('.continue-btn');
      
      expect(retryBtn).toBeTruthy();
      expect(continueBtn).toBeTruthy();
      expect(retryBtn?.textContent).toContain('Retry Connection');
      expect(continueBtn?.textContent).toContain('Continue Playing');
    });
  });

  describe('CSS Styles Validation', () => {
    it('should inject proper CSS for responsive design', () => {
      notifier.showAPIErrorPopup();
      
      const styles = document.getElementById('api-error-styles');
      expect(styles?.textContent).toContain('position: fixed');
      expect(styles?.textContent).toContain('z-index: 10000');
      expect(styles?.textContent).toContain('min-height: 44px');
      expect(styles?.textContent).toContain('@media (max-width: 480px)');
    });

    it('should include animation styles', () => {
      notifier.showAPIErrorPopup();
      
      const styles = document.getElementById('api-error-styles');
      expect(styles?.textContent).toContain('animation: popupSlideIn');
      expect(styles?.textContent).toContain('@keyframes popupSlideIn');
    });
  });
});

/**
 * Performance Tests for Critical Scenarios
 */
describe('APIErrorNotifier Performance', () => {
  let notifier: APIErrorNotifier;

  beforeEach(() => {
    notifier = new APIErrorNotifier();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('should show popup quickly', () => {
    const startTime = performance.now();
    
    notifier.showAPIErrorPopup();
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should hide popup quickly', () => {
    notifier.showAPIErrorPopup();
    
    const startTime = performance.now();
    notifier.hideAPIErrorPopup();
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(10);
  });

  it('should handle multiple show/hide cycles efficiently', () => {
    const startTime = performance.now();
    
    // Simulate rapid show/hide cycles
    for (let i = 0; i < 10; i++) {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
    
    // Should only have 1 stylesheet
    expect(document.querySelectorAll('#api-error-styles')).toHaveLength(1);
  });
});

/**
 * SCRAM-007 Acceptance Criteria Validation
 */
describe('SCRAM-007 Acceptance Criteria', () => {
  let notifier: APIErrorNotifier;

  beforeEach(() => {
    notifier = new APIErrorNotifier();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('AC1: Should display clear popup notification when WordsAPI is unavailable', () => {
    notifier.showAPIErrorPopup();
    
    const popup = document.querySelector('.api-error-popup');
    const title = document.querySelector('#api-error-title');
    
    expect(popup).toBeTruthy();
    expect(title?.textContent).toContain('Word Validation Unavailable');
    expect(notifier.isShowingError()).toBe(true);
  });

  it('AC2: Should allow players to continue with manual validation', () => {
    notifier.showAPIErrorPopup();
    
    const continueBtn = document.querySelector('.continue-btn');
    const message = document.querySelector('.popup-body');
    
    expect(continueBtn).toBeTruthy();
    expect(message?.textContent).toContain('You can continue playing');
    expect(message?.textContent).toContain('any properly formed anagram will be accepted');
  });

  it('AC3: Should show retry option to attempt API reconnection', () => {
    notifier.showAPIErrorPopup();
    
    const retryBtn = document.querySelector('.retry-btn');
    
    expect(retryBtn).toBeTruthy();
    expect(retryBtn?.textContent).toContain('Retry Connection');
  });

  it('AC4: Should persist notification state until API becomes available', () => {
    notifier.showAPIErrorPopup();
    
    expect(notifier.isShowingError()).toBe(true);
    
    // State persists until explicitly hidden
    expect(document.querySelector('.api-error-popup')).toBeTruthy();
    
    // Only hiding should clear state
    notifier.hideAPIErrorPopup();
    expect(notifier.isShowingError()).toBe(false);
  });

  it('AC5: Should provide graceful error handling without breaking game flow', () => {
    // Should not throw errors during normal operation
    expect(() => {
      notifier.showAPIErrorPopup();
      notifier.dismiss();
      notifier.resetRetryCount();
    }).not.toThrow();
    
    // Should handle multiple calls gracefully
    expect(() => {
      notifier.hideAPIErrorPopup();
      notifier.hideAPIErrorPopup();
    }).not.toThrow();
  });
});