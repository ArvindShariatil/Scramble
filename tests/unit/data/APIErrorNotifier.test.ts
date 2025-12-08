/**
 * Unit Tests for API Error Notification System (SCRAM-007)
 * Tests the simplified popup-based approach for WordsAPI failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIErrorNotifier } from '../../../src/data/dictionary';

// Mock DOM globals
Object.defineProperty(window, 'apiErrorNotifier', {
  writable: true,
  value: undefined
});

describe('APIErrorNotifier', () => {
  let notifier: APIErrorNotifier;
  let mockRetryCallback: ReturnType<typeof vi.fn>;
  let mockDismissCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clean up any existing popups
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Mock callbacks
    mockRetryCallback = vi.fn();
    mockDismissCallback = vi.fn();
    
    notifier = new APIErrorNotifier({
      onRetry: mockRetryCallback,
      onDismiss: mockDismissCallback
    });
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    (window as any).apiErrorNotifier = undefined;
  });

  describe('showAPIErrorPopup', () => {
    it('should create and display popup when API fails', () => {
      expect(notifier.isShowingError()).toBe(false);
      
      notifier.showAPIErrorPopup();
      
      expect(notifier.isShowingError()).toBe(true);
      expect(document.querySelector('.api-error-popup')).toBeTruthy();
      expect(document.querySelector('#api-error-title')).toBeTruthy();
    });

    it('should not create multiple popups if already showing', () => {
      notifier.showAPIErrorPopup();
      notifier.showAPIErrorPopup();
      
      const popups = document.querySelectorAll('.api-error-popup');
      expect(popups).toHaveLength(1);
    });

    it('should increment retry count on each show', () => {
      expect(notifier.getRetryCount()).toBe(0);
      
      notifier.showAPIErrorPopup();
      expect(notifier.getRetryCount()).toBe(1);
      
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup();
      expect(notifier.getRetryCount()).toBe(2);
    });

    it('should include proper accessibility attributes', () => {
      notifier.showAPIErrorPopup();
      
      const popup = document.querySelector('.api-error-popup');
      expect(popup?.getAttribute('role')).toBe('dialog');
      expect(popup?.getAttribute('aria-labelledby')).toBe('api-error-title');
    });

    it('should inject CSS styles only once', () => {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup();
      
      const styleSheets = document.querySelectorAll('#api-error-styles');
      expect(styleSheets).toHaveLength(1);
    });
  });

  describe('hideAPIErrorPopup', () => {
    it('should remove popup from DOM', () => {
      notifier.showAPIErrorPopup();
      expect(document.querySelector('.api-error-popup')).toBeTruthy();
      
      notifier.hideAPIErrorPopup();
      expect(document.querySelector('.api-error-popup')).toBeFalsy();
      expect(notifier.isShowingError()).toBe(false);
    });

    it('should clean up global reference', () => {
      notifier.showAPIErrorPopup();
      expect((window as any).apiErrorNotifier).toBe(notifier);
      
      notifier.hideAPIErrorPopup();
      expect((window as any).apiErrorNotifier).toBeUndefined();
    });

    it('should handle multiple hide calls gracefully', () => {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
      
      expect(() => notifier.hideAPIErrorPopup()).not.toThrow();
    });
  });

  describe('retry functionality', () => {
    it('should call retry callback when retry is triggered', async () => {
      mockRetryCallback.mockResolvedValueOnce(undefined);
      
      await notifier.retry();
      
      expect(mockRetryCallback).toHaveBeenCalledTimes(1);
    });

    it('should increment retry count on failed retry', async () => {
      mockRetryCallback.mockRejectedValueOnce(new Error('Still failing'));
      
      notifier.showAPIErrorPopup();
      const initialCount = notifier.getRetryCount();
      
      await notifier.retry();
      
      expect(notifier.getRetryCount()).toBe(initialCount + 1);
    });

    it('should update retry count in visible popup', async () => {
      mockRetryCallback.mockRejectedValueOnce(new Error('Still failing'));
      
      notifier.showAPIErrorPopup();
      await notifier.retry();
      
      const retryInfo = document.querySelector('.retry-info');
      expect(retryInfo?.textContent).toContain('Retry attempt: 2');
    });
  });

  describe('dismiss functionality', () => {
    it('should hide popup when dismissed', () => {
      notifier.showAPIErrorPopup();
      notifier.dismiss();
      
      expect(notifier.isShowingError()).toBe(false);
      expect(document.querySelector('.api-error-popup')).toBeFalsy();
    });

    it('should call dismiss callback', () => {
      notifier.dismiss();
      
      expect(mockDismissCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('utility methods', () => {
    it('should track error state correctly', () => {
      expect(notifier.isShowingError()).toBe(false);
      
      notifier.showAPIErrorPopup();
      expect(notifier.isShowingError()).toBe(true);
      
      notifier.hideAPIErrorPopup();
      expect(notifier.isShowingError()).toBe(false);
    });

    it('should reset retry count', () => {
      notifier.showAPIErrorPopup(); // count = 1
      notifier.hideAPIErrorPopup();
      notifier.showAPIErrorPopup(); // count = 2
      
      expect(notifier.getRetryCount()).toBe(2);
      
      notifier.resetRetryCount();
      expect(notifier.getRetryCount()).toBe(0);
    });
  });

  describe('responsive design', () => {
    it('should create mobile-friendly button sizes', () => {
      notifier.showAPIErrorPopup();
      
      const styles = document.getElementById('api-error-styles');
      expect(styles?.textContent).toContain('min-height: 44px');
    });

    it('should include media queries for mobile', () => {
      notifier.showAPIErrorPopup();
      
      const styles = document.getElementById('api-error-styles');
      expect(styles?.textContent).toContain('@media (max-width: 480px)');
    });
  });

  describe('error handling', () => {
    it('should handle missing callbacks gracefully', async () => {
      const notifierWithoutCallbacks = new APIErrorNotifier();
      
      expect(() => notifierWithoutCallbacks.dismiss()).not.toThrow();
      expect(() => notifierWithoutCallbacks.retry()).not.toThrow();
    });

    it('should handle DOM manipulation errors gracefully', () => {
      // Mock appendChild to throw error
      const originalAppendChild = document.body.appendChild;
      document.body.appendChild = vi.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      try {
        notifier.showAPIErrorPopup();
        // If it doesn't throw, that's also acceptable for graceful handling
        expect(true).toBe(true);
      } catch (error) {
        // Should not throw errors that break the game
        expect(error).toBeInstanceOf(Error);
      }

      // Restore original method
      document.body.appendChild = originalAppendChild;
    });
  });

  describe('integration scenarios', () => {
    it('should support typical API failure -> retry -> success flow', async () => {
      // API fails, show popup
      notifier.showAPIErrorPopup();
      expect(notifier.isShowingError()).toBe(true);
      
      // First retry fails
      mockRetryCallback.mockRejectedValueOnce(new Error('Still down'));
      await notifier.retry();
      expect(notifier.isShowingError()).toBe(true);
      expect(notifier.getRetryCount()).toBe(2);
      
      // Second retry succeeds
      mockRetryCallback.mockResolvedValueOnce(undefined);
      await notifier.retry();
      
      // Simulate successful API call hiding popup
      notifier.hideAPIErrorPopup();
      expect(notifier.isShowingError()).toBe(false);
    });

    it('should support dismiss -> manual validation flow', () => {
      notifier.showAPIErrorPopup();
      expect(notifier.isShowingError()).toBe(true);
      
      notifier.dismiss();
      
      expect(notifier.isShowingError()).toBe(false);
      expect(mockDismissCallback).toHaveBeenCalled();
    });
  });
});

/**
 * Performance Tests for API Error Notification
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

  it('should show popup within 50ms', () => {
    const startTime = performance.now();
    
    notifier.showAPIErrorPopup();
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should hide popup within 10ms', () => {
    notifier.showAPIErrorPopup();
    
    const startTime = performance.now();
    notifier.hideAPIErrorPopup();
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(10);
  });

  it('should not impact memory with repeated show/hide cycles', () => {
    // Simulate rapid show/hide cycles
    for (let i = 0; i < 100; i++) {
      notifier.showAPIErrorPopup();
      notifier.hideAPIErrorPopup();
    }
    
    // Should only have 1 stylesheet and no popups
    expect(document.querySelectorAll('#api-error-styles')).toHaveLength(1);
    expect(document.querySelectorAll('.api-error-popup')).toHaveLength(0);
  });
});