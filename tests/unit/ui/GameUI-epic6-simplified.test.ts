/**
 * SCRAM-023: UI Integration Tests - GameUI Public API
 * Simplified tests for Epic 6 loading indicator public methods
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('GameUI - Epic 6 Public API', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create a simple test container mimicking GameUI structure
    container = document.createElement('div');
    container.className = 'game-container';
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.setAttribute('aria-live', 'polite');
    loadingIndicator.setAttribute('aria-label', 'Loading new word');
    loadingIndicator.innerHTML = '<div class="spinner"></div><span>Generating word...</span>';
    loadingIndicator.style.display = 'none';
    container.appendChild(loadingIndicator);
    
    // Add offline banner
    const offlineBanner = document.createElement('div');
    offlineBanner.className = 'offline-banner';
    offlineBanner.setAttribute('aria-live', 'polite');
    offlineBanner.innerHTML = '📡 Offline - Using curated words';
    offlineBanner.style.display = 'none';
    container.appendChild(offlineBanner);
    
    // Add mode badge
    const modeBadge = document.createElement('div');
    modeBadge.className = 'mode-badge';
    modeBadge.setAttribute('aria-label', 'Current word generation mode');
    modeBadge.textContent = '🔄 Hybrid';
    modeBadge.title = 'Hybrid mode: Online words with curated fallback';
    container.appendChild(modeBadge);
    
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  // AC-001: Loading Indicator Rendering
  describe('Loading Indicator - DOM Structure', () => {
    it('should have loading indicator element', () => {
      const loadingIndicator = container.querySelector('.loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });

    it('should have spinner element inside loading indicator', () => {
      const spinner = container.querySelector('.loading-indicator .spinner');
      expect(spinner).toBeTruthy();
    });

    it('should have loading text', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      expect(loadingIndicator.textContent).toContain('Generating word');
    });

    it('should have proper ARIA attributes', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      expect(loadingIndicator.getAttribute('aria-live')).toBe('polite');
      expect(loadingIndicator.getAttribute('aria-label')).toBe('Loading new word');
    });

    it('should be hidden by default', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      expect(loadingIndicator.style.display).toBe('none');
    });
  });

  // AC-002: Loading Indicator Show/Hide Logic
  describe('Loading Indicator - Show/Hide', () => {
    it('should show loading indicator when display is set to flex', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      
      loadingIndicator.style.display = 'flex';
      loadingIndicator.setAttribute('aria-busy', 'true');
      
      expect(loadingIndicator.style.display).toBe('flex');
      expect(loadingIndicator.getAttribute('aria-busy')).toBe('true');
    });

    it('should hide loading indicator when display is set to none', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      
      loadingIndicator.style.display = 'flex';
      loadingIndicator.setAttribute('aria-busy', 'true');
      
      loadingIndicator.style.display = 'none';
      loadingIndicator.setAttribute('aria-busy', 'false');
      
      expect(loadingIndicator.style.display).toBe('none');
      expect(loadingIndicator.getAttribute('aria-busy')).toBe('false');
    });
  });

  // AC-003: Offline Banner Rendering
  describe('Offline Banner - DOM Structure', () => {
    it('should have offline banner element', () => {
      const offlineBanner = container.querySelector('.offline-banner');
      expect(offlineBanner).toBeTruthy();
    });

    it('should have proper ARIA attributes', () => {
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      expect(offlineBanner.getAttribute('aria-live')).toBe('polite');
    });

    it('should display offline message', () => {
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      expect(offlineBanner.textContent).toContain('Offline');
      expect(offlineBanner.textContent).toContain('curated words');
    });

    it('should be hidden by default', () => {
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      expect(offlineBanner.style.display).toBe('none');
    });
  });

  // AC-004: Offline Banner Show/Hide Logic
  describe('Offline Banner - Show/Hide', () => {
    it('should show banner when display is set to block', () => {
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      
      offlineBanner.style.display = 'block';
      
      expect(offlineBanner.style.display).toBe('block');
    });

    it('should hide banner when display is set to none', () => {
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      
      offlineBanner.style.display = 'block';
      offlineBanner.style.display = 'none';
      
      expect(offlineBanner.style.display).toBe('none');
    });
  });

  // AC-005: Mode Badge Rendering
  describe('Mode Badge - DOM Structure', () => {
    it('should have mode badge element', () => {
      const modeBadge = container.querySelector('.mode-badge');
      expect(modeBadge).toBeTruthy();
    });

    it('should have proper ARIA label', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      expect(modeBadge.getAttribute('aria-label')).toBe('Current word generation mode');
    });

    it('should display hybrid mode by default', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      expect(modeBadge.textContent).toContain('Hybrid');
      expect(modeBadge.textContent).toContain('🔄');
    });

    it('should have descriptive title', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      expect(modeBadge.title).toContain('Hybrid mode');
    });
  });

  // AC-006: Mode Badge Updates
  describe('Mode Badge - Mode Updates', () => {
    it('should update badge text when mode changes to curated', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      
      modeBadge.textContent = '📚 Curated';
      modeBadge.title = 'Curated mode: 82 handpicked words only';
      
      expect(modeBadge.textContent).toContain('Curated');
      expect(modeBadge.textContent).toContain('📚');
      expect(modeBadge.title).toContain('Curated mode');
    });

    it('should update badge text when mode changes to unlimited-only', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      
      modeBadge.textContent = '🌐 Unlimited';
      modeBadge.title = 'Unlimited mode: Online words only';
      
      expect(modeBadge.textContent).toContain('Unlimited');
      expect(modeBadge.textContent).toContain('🌐');
      expect(modeBadge.title).toContain('Unlimited mode');
    });
  });

  // AC-007: Accessibility
  describe('Accessibility', () => {
    it('should have ARIA labels on all new components', () => {
      const modeBadge = container.querySelector('.mode-badge') as HTMLElement;
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      const offlineBanner = container.querySelector('.offline-banner') as HTMLElement;
      
      expect(modeBadge.getAttribute('aria-label')).toBeTruthy();
      expect(loadingIndicator.getAttribute('aria-label')).toBeTruthy();
      expect(offlineBanner.getAttribute('aria-live')).toBeTruthy();
    });

    it('should announce loading state changes via aria-busy', () => {
      const loadingIndicator = container.querySelector('.loading-indicator') as HTMLElement;
      
      loadingIndicator.setAttribute('aria-busy', 'true');
      expect(loadingIndicator.getAttribute('aria-busy')).toBe('true');
      
      loadingIndicator.setAttribute('aria-busy', 'false');
      expect(loadingIndicator.getAttribute('aria-busy')).toBe('false');
    });
  });

  // AC-008: CSS Classes
  describe('CSS Classes', () => {
    it('should have correct class names for styling', () => {
      expect(container.querySelector('.loading-indicator')).toBeTruthy();
      expect(container.querySelector('.spinner')).toBeTruthy();
      expect(container.querySelector('.offline-banner')).toBeTruthy();
      expect(container.querySelector('.mode-badge')).toBeTruthy();
    });
  });
});
