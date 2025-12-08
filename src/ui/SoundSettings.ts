/**
 * Sound Settings Component - Volume Control for Calm Playground
 * SCRAM-013: Provides user control over audio experience
 */

import { soundManager } from '../utils/SoundManager.ts'
import type { SoundConfig } from '../utils/SoundManager.ts'
import { analytics, AnalyticsEvent } from '../utils/analytics.ts'

export class SoundSettings {
  private container: HTMLElement;
  private isVisible = false;

  constructor() {
    this.container = this.createSettingsPanel();
    this.updateDisplay();
    console.log('🎛️ Sound settings initialized');
  }

  private createSettingsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'sound-settings-panel';
    panel.setAttribute('aria-hidden', 'true');
    
    panel.innerHTML = `
      <div class="sound-settings-content">
        <h3 class="settings-title">🔊 Sound Settings</h3>
        
        <div class="setting-group">
          <label class="setting-label">
            <input type="checkbox" class="mute-toggle" aria-label="Mute all sounds">
            <span>Mute All Sounds</span>
          </label>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Master Volume</label>
          <input type="range" class="volume-slider" 
                 min="0" max="100" value="30" 
                 aria-label="Master volume control">
          <span class="volume-display">30%</span>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Button Sounds</label>
          <input type="range" class="interaction-volume-slider" 
                 min="0" max="100" value="20" 
                 aria-label="Button and typing sounds volume">
          <span class="interaction-volume-display">20%</span>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Feedback Sounds</label>
          <input type="range" class="feedback-volume-slider" 
                 min="0" max="100" value="40" 
                 aria-label="Success and error sounds volume">
          <span class="feedback-volume-display">40%</span>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Word Generation Mode</label>
          <select class="word-mode-selector" aria-label="Word generation mode selection">
            <option value="hybrid">Hybrid (Recommended)</option>
            <option value="curated">Curated Only</option>
            <option value="unlimited-only">Unlimited Only</option>
          </select>
          <div class="mode-description text-caption" style="margin-top: 8px; color: var(--dusty-blue); font-size: 0.75rem;">
            Hybrid: Try online words, fallback to 82 curated. Zero risk.
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="btn btn-secondary test-sounds-btn">Test Sounds</button>
          <button class="btn settings-close-btn">Close</button>
        </div>
      </div>
    `;
    
    this.setupEventListeners(panel);
    return panel;
  }

  private setupEventListeners(panel: HTMLElement): void {
    // Mute toggle
    const muteToggle = panel.querySelector('.mute-toggle') as HTMLInputElement;
    muteToggle.addEventListener('change', () => {
      soundManager.setMuted(muteToggle.checked);
      analytics.track(AnalyticsEvent.SOUND_TOGGLED, { 
        enabled: !muteToggle.checked,
        source: 'mute_toggle'
      });
      if (!muteToggle.checked) {
        soundManager.playButtonClick();
      }
    });

    // Master volume
    const volumeSlider = panel.querySelector('.volume-slider') as HTMLInputElement;
    const volumeDisplay = panel.querySelector('.volume-display') as HTMLElement;
    volumeSlider.addEventListener('input', () => {
      const value = parseInt(volumeSlider.value) / 100;
      soundManager.setMasterVolume(value);
      volumeDisplay.textContent = `${volumeSlider.value}%`;
      
      analytics.track(AnalyticsEvent.VOLUME_CHANGED, {
        volume: value,
        type: 'master'
      });
      
      // Debounced feedback
      this.debouncedVolumeTest(() => soundManager.playButtonClick());
    });

    // Interaction volume
    const interactionSlider = panel.querySelector('.interaction-volume-slider') as HTMLInputElement;
    const interactionDisplay = panel.querySelector('.interaction-volume-display') as HTMLElement;
    interactionSlider.addEventListener('input', () => {
      const value = parseInt(interactionSlider.value) / 100;
      soundManager.setInteractionVolume(value);
      interactionDisplay.textContent = `${interactionSlider.value}%`;
      
      this.debouncedVolumeTest(() => soundManager.playKeyPress());
    });

    // Feedback volume
    const feedbackSlider = panel.querySelector('.feedback-volume-slider') as HTMLInputElement;
    const feedbackDisplay = panel.querySelector('.feedback-volume-display') as HTMLElement;
    feedbackSlider.addEventListener('input', () => {
      const value = parseInt(feedbackSlider.value) / 100;
      soundManager.setFeedbackVolume(value);
      feedbackDisplay.textContent = `${feedbackSlider.value}%`;
      
      this.debouncedVolumeTest(() => soundManager.playCorrect());
    });

    // Test sounds button
    const testBtn = panel.querySelector('.test-sounds-btn') as HTMLButtonElement;
    testBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      soundManager.testSounds();
    });

    // Word mode selector
    const wordModeSelector = panel.querySelector('.word-mode-selector') as HTMLSelectElement;
    wordModeSelector.addEventListener('change', () => {
      const mode = wordModeSelector.value as 'curated' | 'hybrid' | 'unlimited-only';
      
      // Update mode description
      const modeDescription = panel.querySelector('.mode-description') as HTMLElement;
      if (mode === 'curated') {
        modeDescription.textContent = 'Curated: Uses only 82 handpicked words. Offline compatible.';
      } else if (mode === 'hybrid') {
        modeDescription.textContent = 'Hybrid: Try online words, fallback to 82 curated. Zero risk.';
      } else {
        modeDescription.textContent = 'Unlimited: Requires online connection. No curated fallback.';
      }
      
      // Save to localStorage
      localStorage.setItem('scramble-word-mode', mode);
      
      // Track analytics
      analytics.track(AnalyticsEvent.SETTINGS_CHANGED, {
        setting: 'word_mode',
        value: mode
      });
      
      // Dispatch custom event for GameUI to listen
      window.dispatchEvent(new CustomEvent('wordModeChanged', { detail: { mode } }));
      
      soundManager.playButtonClick();
    });
    
    // Close button
    const closeBtn = panel.querySelector('.settings-close-btn') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      this.hide();
    });
  }

  private debounceTimer: number | null = null;
  private debouncedVolumeTest(callback: () => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = window.setTimeout(() => {
      callback();
      this.debounceTimer = null;
    }, 150);
  }

  private updateDisplay(): void {
    const config = soundManager.getConfig();
    
    // Update mute toggle
    const muteToggle = this.container.querySelector('.mute-toggle') as HTMLInputElement;
    muteToggle.checked = config.muted;
    
    // Update volume sliders and displays
    const volumeSlider = this.container.querySelector('.volume-slider') as HTMLInputElement;
    const volumeDisplay = this.container.querySelector('.volume-display') as HTMLElement;
    volumeSlider.value = (config.volume * 100).toString();
    volumeDisplay.textContent = `${Math.round(config.volume * 100)}%`;
    
    const interactionSlider = this.container.querySelector('.interaction-volume-slider') as HTMLInputElement;
    const interactionDisplay = this.container.querySelector('.interaction-volume-display') as HTMLElement;
    interactionSlider.value = (config.interactionVolume * 100).toString();
    interactionDisplay.textContent = `${Math.round(config.interactionVolume * 100)}%`;
    
    const feedbackSlider = this.container.querySelector('.feedback-volume-slider') as HTMLInputElement;
    const feedbackDisplay = this.container.querySelector('.feedback-volume-display') as HTMLElement;
    feedbackSlider.value = (config.feedbackVolume * 100).toString();
    feedbackDisplay.textContent = `${Math.round(config.feedbackVolume * 100)}%`;
    
    // Update word mode selector
    const wordModeSelector = this.container.querySelector('.word-mode-selector') as HTMLSelectElement;
    const savedMode = localStorage.getItem('scramble-word-mode') || 'hybrid';
    wordModeSelector.value = savedMode;
    
    // Update mode description
    const modeDescription = this.container.querySelector('.mode-description') as HTMLElement;
    if (savedMode === 'curated') {
      modeDescription.textContent = 'Curated: Uses only 82 handpicked words. Offline compatible.';
    } else if (savedMode === 'hybrid') {
      modeDescription.textContent = 'Hybrid: Try online words, fallback to 82 curated. Zero risk.';
    } else {
      modeDescription.textContent = 'Unlimited: Requires online connection. No curated fallback.';
    }
  }

  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.container.setAttribute('aria-hidden', 'false');
      this.container.classList.add('visible');
      this.updateDisplay();
      
      // Focus first control
      const firstControl = this.container.querySelector('.mute-toggle') as HTMLElement;
      firstControl?.focus();
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.container.setAttribute('aria-hidden', 'true');
      this.container.classList.remove('visible');
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}