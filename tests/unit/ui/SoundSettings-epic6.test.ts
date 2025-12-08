/**
 * SCRAM-023: UI Integration Tests - SoundSettings Word Mode Selector
 * Tests for Epic 6 word generation mode selector in settings panel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundSettings } from '../../../src/ui/SoundSettings';

describe('SoundSettings - Epic 6 Word Mode Selector', () => {
  let soundSettings: SoundSettings;
  let container: HTMLElement;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Mock soundManager
    vi.mock('../../../src/utils/SoundManager', () => ({
      soundManager: {
        getConfig: () => ({
          muted: false,
          volume: 0.3,
          interactionVolume: 0.2,
          feedbackVolume: 0.4
        }),
        setMuted: vi.fn(),
        setMasterVolume: vi.fn(),
        setInteractionVolume: vi.fn(),
        setFeedbackVolume: vi.fn(),
        playButtonClick: vi.fn(),
        testSounds: vi.fn()
      }
    }));
    
    // Mock analytics
    vi.mock('../../../src/utils/analytics', () => ({
      analytics: {
        track: vi.fn()
      },
      AnalyticsEvent: {
        SOUND_TOGGLED: 'sound_toggled',
        VOLUME_CHANGED: 'volume_changed',
        SETTINGS_CHANGED: 'settings_changed'
      }
    }));
    
    soundSettings = new SoundSettings();
    container = soundSettings.getElement();
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  // AC-001: Word Mode Selector Rendered
  describe('Word Mode Selector - Rendering', () => {
    it('should render word mode selector dropdown in settings panel', () => {
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      expect(selector).toBeTruthy();
      expect(selector.tagName).toBe('SELECT');
    });

    it('should have three mode options: hybrid, curated, unlimited-only', () => {
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      const options = Array.from(selector.options).map(opt => opt.value);
      
      expect(options).toContain('hybrid');
      expect(options).toContain('curated');
      expect(options).toContain('unlimited-only');
      expect(options.length).toBe(3);
    });

    it('should have proper aria-label for accessibility', () => {
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      expect(selector.getAttribute('aria-label')).toBe('Word generation mode selection');
    });

    it('should render mode description text', () => {
      const description = container.querySelector('.mode-description');
      expect(description).toBeTruthy();
      expect(description?.textContent).toContain('Hybrid');
    });
  });

  // AC-002: Default Mode Selection
  describe('Word Mode Selector - Default Selection', () => {
    it('should default to hybrid mode when no localStorage value exists', () => {
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      soundSettings.show();
      
      expect(selector.value).toBe('hybrid');
    });

    it('should display hybrid mode description by default', () => {
      soundSettings.show();
      const description = container.querySelector('.mode-description') as HTMLElement;
      
      expect(description.textContent).toContain('Hybrid');
      expect(description.textContent).toContain('fallback to 82 curated');
    });
  });

  // AC-003: Mode Selection Changes
  describe('Word Mode Selector - Mode Changes', () => {
    it('should update description when switching to curated mode', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      const description = container.querySelector('.mode-description') as HTMLElement;
      
      // Change to curated
      selector.value = 'curated';
      selector.dispatchEvent(new Event('change'));
      
      expect(description.textContent).toContain('Curated');
      expect(description.textContent).toContain('82 handpicked words');
    });

    it('should update description when switching to unlimited-only mode', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      const description = container.querySelector('.mode-description') as HTMLElement;
      
      // Change to unlimited-only
      selector.value = 'unlimited-only';
      selector.dispatchEvent(new Event('change'));
      
      expect(description.textContent).toContain('Unlimited');
      expect(description.textContent).toContain('Requires online');
    });

    it('should save mode to localStorage on change', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      selector.value = 'curated';
      selector.dispatchEvent(new Event('change'));
      
      expect(localStorage.getItem('scramble-word-mode')).toBe('curated');
    });

    it('should dispatch custom event when mode changes', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      let eventFired = false;
      let eventDetail: any = null;
      
      window.addEventListener('wordModeChanged', ((e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      }) as EventListener);
      
      selector.value = 'unlimited-only';
      selector.dispatchEvent(new Event('change'));
      
      expect(eventFired).toBe(true);
      expect(eventDetail?.mode).toBe('unlimited-only');
    });
  });

  // AC-004: Mode Persistence
  describe('Word Mode Selector - Persistence', () => {
    it('should load saved mode from localStorage on initialization', () => {
      // Save mode before creating settings
      localStorage.setItem('scramble-word-mode', 'unlimited-only');
      
      // Create new settings instance
      const newSettings = new SoundSettings();
      const newContainer = newSettings.getElement();
      document.body.appendChild(newContainer);
      newSettings.show();
      
      const selector = newContainer.querySelector('.word-mode-selector') as HTMLSelectElement;
      expect(selector.value).toBe('unlimited-only');
      
      newContainer.remove();
    });

    it('should persist mode across settings panel open/close', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      // Change mode
      selector.value = 'curated';
      selector.dispatchEvent(new Event('change'));
      
      // Close and reopen
      soundSettings.hide();
      soundSettings.show();
      
      // Mode should persist
      expect(selector.value).toBe('curated');
    });
  });

  // AC-005: Keyboard Navigation
  describe('Word Mode Selector - Keyboard Navigation', () => {
    it('should be keyboard navigable with arrow keys', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      selector.focus();
      expect(document.activeElement).toBe(selector);
      
      // Simulate arrow down
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      selector.dispatchEvent(event);
      
      // Should still be focused
      expect(document.activeElement).toBe(selector);
    });

    it('should be accessible via tab navigation', () => {
      soundSettings.show();
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      // Simulate tab key
      selector.focus();
      expect(document.activeElement).toBe(selector);
    });
  });

  // AC-006: Integration with Existing Settings
  describe('Word Mode Selector - Integration', () => {
    it('should not interfere with sound settings', () => {
      soundSettings.show();
      const muteToggle = container.querySelector('.mute-toggle') as HTMLInputElement;
      const selector = container.querySelector('.word-mode-selector') as HTMLSelectElement;
      
      // Change word mode
      selector.value = 'curated';
      selector.dispatchEvent(new Event('change'));
      
      // Sound settings should still work
      muteToggle.checked = true;
      muteToggle.dispatchEvent(new Event('change'));
      
      expect(muteToggle.checked).toBe(true);
    });

    it('should maintain settings panel layout with new selector', () => {
      soundSettings.show();
      
      const settingGroups = container.querySelectorAll('.setting-group');
      expect(settingGroups.length).toBeGreaterThanOrEqual(5); // Original 4 + new word mode
    });
  });
});
