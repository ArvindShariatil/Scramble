/**
 * SoundManager - Gentle Audio System for Calm Playground
 * SCRAM-013: Provides subtle, delightful audio feedback
 * 
 * Generates soft, warm tones using Web Audio API for immediate availability
 * No external files needed - all sounds generated programmatically
 */

export interface SoundConfig {
  volume: number;
  muted: boolean;
  interactionVolume: number;
  feedbackVolume: number;
  ambientVolume: number;
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private config: SoundConfig = {
    volume: 0.3,
    muted: false,
    interactionVolume: 0.2,
    feedbackVolume: 0.4,
    ambientVolume: 0.1
  };
  private isSupported = false;

  constructor() {
    this.initializeAudioContext();
    this.loadConfig();
    console.log('🔊 SoundManager initialized - Calm Playground audio');
  }

  private initializeAudioContext(): void {
    try {
      // Create AudioContext with user gesture handling
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isSupported = true;
      
      // Handle browser autoplay policies
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume();
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      }
    } catch (error) {
      console.warn('Audio not supported or available:', error);
      this.isSupported = false;
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('scramble_sound_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Could not load sound config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('scramble_sound_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Could not save sound config:', error);
    }
  }

  /**
   * Generate and play a gentle tone
   */
  private async playTone(
    frequency: number, 
    duration: number, 
    volume: number,
    type: OscillatorType = 'sine'
  ): Promise<void> {
    if (!this.isSupported || !this.audioContext || this.config.muted) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      // Gentle envelope for warm sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * this.config.volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Play interaction sounds (typing, clicks)
   */
  public async playKeyPress(): Promise<void> {
    // Soft, warm key press sound
    await this.playTone(800, 0.1, this.config.interactionVolume);
  }

  public async playButtonClick(): Promise<void> {
    // Gentle button click sound
    await this.playTone(600, 0.15, this.config.interactionVolume);
  }

  public async playInputFocus(): Promise<void> {
    // Subtle focus indication
    await this.playTone(900, 0.08, this.config.interactionVolume * 0.5);
  }

  /**
   * Play feedback sounds (success, error, etc.)
   */
  public async playCorrect(): Promise<void> {
    // Gentle success chime - ascending tones
    await this.playTone(523, 0.15, this.config.feedbackVolume); // C5
    setTimeout(() => this.playTone(659, 0.15, this.config.feedbackVolume), 100); // E5
    setTimeout(() => this.playTone(784, 0.2, this.config.feedbackVolume), 200); // G5
  }

  public async playIncorrect(): Promise<void> {
    // Soft, encouraging tone - not harsh
    await this.playTone(400, 0.3, this.config.feedbackVolume * 0.6);
  }

  public async playSkip(): Promise<void> {
    // Smooth transition whoosh - descending tone
    await this.playTone(1000, 0.4, this.config.feedbackVolume * 0.7);
    setTimeout(() => this.playTone(600, 0.2, this.config.feedbackVolume * 0.5), 200);
  }

  public async playComplete(): Promise<void> {
    // Warm completion sound - major chord
    await this.playTone(523, 0.3, this.config.feedbackVolume); // C5
    setTimeout(() => this.playTone(659, 0.3, this.config.feedbackVolume), 50); // E5
    setTimeout(() => this.playTone(784, 0.4, this.config.feedbackVolume), 100); // G5
  }

  public async playTimerWarning(): Promise<void> {
    // Subtle timer awareness - gentle pulse
    await this.playTone(1200, 0.12, this.config.ambientVolume * 2);
  }

  public async playNewRound(): Promise<void> {
    // Fresh, optimistic sound
    await this.playTone(600, 0.2, this.config.feedbackVolume);
    setTimeout(() => this.playTone(800, 0.15, this.config.feedbackVolume), 150);
  }

  public async playTimeout(): Promise<void> {
    // Gentle, non-punishing timeout sound - descending chime
    await this.playTone(400, 0.25, this.config.feedbackVolume * 0.5);
    setTimeout(() => this.playTone(300, 0.3, this.config.feedbackVolume * 0.4), 150);
  }

  /**
   * Volume and configuration controls
   */
  public setMasterVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  public setMuted(muted: boolean): void {
    this.config.muted = muted;
    this.saveConfig();
  }

  public setInteractionVolume(volume: number): void {
    this.config.interactionVolume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  public setFeedbackVolume(volume: number): void {
    this.config.feedbackVolume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  public getConfig(): SoundConfig {
    return { ...this.config };
  }

  public isAudioSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Test all sounds for configuration
   */
  public async testSounds(): Promise<void> {
    console.log('🎵 Testing sound system...');
    
    await this.playKeyPress();
    setTimeout(() => this.playButtonClick(), 300);
    setTimeout(() => this.playCorrect(), 600);
    setTimeout(() => this.playIncorrect(), 1200);
    setTimeout(() => this.playSkip(), 1800);
    setTimeout(() => this.playComplete(), 2400);
    
    console.log('🎵 Sound test complete');
  }
}

// Global sound manager instance
export const soundManager = new SoundManager();