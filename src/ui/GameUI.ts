/**
 * GameUI - Responsive Game Layout Implementation
 * SCRAM-009: Create clean, intuitive interface that works on any device
 * SCRAM-010: Enhanced text input with real-time validation
 * Implements Sally's "Calm Playground" design system
 */

import { EnhancedInput } from './EnhancedInput.ts'
import type { InputConfig, InputState } from './EnhancedInput.ts'
import { soundManager } from '../utils/SoundManager.ts'
import { SoundSettings } from './SoundSettings.ts'
import { analytics, AnalyticsEvent } from '../utils/analytics.ts'
import { analyticsDashboard } from './AnalyticsDashboard.ts'
import type { AnagramSet } from '../data/anagrams.ts'
import { AnagramGeneratorV3 } from '../game/AnagramGenerator-v3.ts'

export type GameMode = 'streak' | 'learning' | 'party';

export class GameUI {
  private container: HTMLElement;
  private scrambledContainer: HTMLElement;
  private inputContainer: HTMLElement;
  private timerScoreContainer: HTMLElement;
  private actionsContainer: HTMLElement;
  private enhancedInput: EnhancedInput;
  private currentScrambledLetters: string[] = ['L', 'E', 'T', 'T', 'E', 'R'];
  private skipCount: number = 0;
  private maxSkips: number = 3;
  private soundSettings: SoundSettings;
  private currentTimer?: number;
  private timeRemaining: number = 60;
  private gamesPlayed: number = 0;
  private correctAnswers: number = 0;
  private currentStreak: number = 0;
  private bestStreak: number = 0;
  private totalScore: number = 0;
  private anagramGenerator: AnagramGeneratorV3;
  private currentAnagram: AnagramSet | null = null;
  
  // Game mode properties
  private gameMode: GameMode = 'streak';
  private currentDifficulty: number = 1;
  private selectedLearningDifficulty: number = 1;
  private modeModalShown: boolean = false;

  constructor() {
    console.log('🎨 GameUI initialized - Calm Playground design');
    
    // Start analytics session
    analytics.track(AnalyticsEvent.SESSION_STARTED, {
      soundEnabled: true, // Default assumption, will be updated by settings
      timestamp: Date.now()
    });
    
    this.container = this.createGameContainer();
    this.scrambledContainer = this.createScrambledContainer();
    this.inputContainer = this.createInputContainer();
    this.timerScoreContainer = this.createTimerScoreContainer();
    this.actionsContainer = this.createActionsContainer();
    this.enhancedInput = this.createEnhancedInput();
    this.soundSettings = new SoundSettings();
    
    // Initialize Epic 6 unlimited word generator (hybrid mode with API)
    this.anagramGenerator = new AnagramGeneratorV3(1);
    
    this.setupLayout();
    
    // Show game mode selection modal
    this.showGameModeModal();
    
    this.setupKeyboardShortcuts();
    this.setupOnlineOfflineDetection();
    this.setupWordModeChangeListener();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Skip shortcut (S key)
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        
        // Only trigger if not typing in input
        if (activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          this.handleSkip();
          analytics.track(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, { shortcut: 'skip' });
        }
      }
      
      // Analytics dashboard shortcut (Shift + F12)
      if (e.key === 'F12' && e.shiftKey) {
        e.preventDefault();
        analyticsDashboard.toggle();
        analytics.track(AnalyticsEvent.KEYBOARD_SHORTCUT_USED, { shortcut: 'analytics_dashboard' });
      }
    });
  }

  private createGameContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'game-container';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Scramble Anagram Game');
    return container;
  }

  private createScrambledContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'scrambled-container';
    container.innerHTML = `
      <div class="text-caption" style="margin-bottom: 12px; color: var(--dusty-blue);">
        Unscramble these letters to form a word
      </div>
      <div class="scrambled-letters" role="region" aria-label="Scrambled letters to solve">
        <div class="letters-row">
          <div class="letter-box">L</div>
          <div class="letter-box">E</div>
          <div class="letter-box">T</div>
          <div class="letter-box">T</div>
          <div class="letter-box">E</div>
          <div class="letter-box">R</div>
        </div>
      </div>
      <div class="hint-container" style="margin-top: 8px;">
        <div class="hint-text" style="color: var(--muted-coral); font-size: 0.875rem; font-weight: 500; text-align: center;">
          💡 Hint: Loading...
        </div>
        <div class="difficulty-badge" style="font-size: 0.75rem; padding: 4px 12px; border-radius: 12px; font-weight: 600; background: var(--sage-green); color: white; margin-top: 8px; display: inline-block; text-align: center; width: 100%;">
          ⭐ Level 1
        </div>
      </div>
    `;
    return container;
  }

  private createInputContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'input-container';
    return container;
  }

  private createEnhancedInput(): EnhancedInput {
    const config: InputConfig = {
      scrambledLetters: this.currentScrambledLetters,
      expectedLength: this.currentScrambledLetters.length,
      placeholder: 'Type your answer...',
      onStateChange: (state: InputState) => {
        this.handleInputStateChange(state);
      },
      onSubmit: (value: string) => {
        this.handleSubmit(value);
      },
      onClear: () => {
        console.log('🧹 Input cleared');
      }
    };

    const enhancedInput = new EnhancedInput(config);
    const elements = enhancedInput.getElements();
    
    // Add all elements to input container
    this.inputContainer.appendChild(elements.input);
    this.inputContainer.appendChild(elements.feedback);
    this.inputContainer.appendChild(elements.indicator);
    
    return enhancedInput;
  }

  private handleInputStateChange(state: InputState): void {
    // Update submit button state
    const submitBtn = this.actionsContainer.querySelector('.btn') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = !state.isComplete;
      submitBtn.classList.toggle('btn-ready', state.isComplete);
    }
    
    console.log('🎯 Input state:', {
      value: state.value,
      isValid: state.isValid,
      isComplete: state.isComplete,
      message: state.validationMessage
    });
  }

  private handleSubmit(value: string): void {
    console.log('🚀 Submitting answer:', value);
    
    // Analytics tracking for attempt
    analytics.track(AnalyticsEvent.ANAGRAM_ATTEMPTED, {
      word: this.getCurrentWord(),
      attempt: value.toUpperCase(),
      difficulty: this.getCurrentDifficulty(),
      timeElapsed: this.getElapsedTime()
    });
    
    // Validation logic - check if the attempt uses all letters correctly
    const isCorrect = this.validateAnswer(value);
    
    if (isCorrect) {
      // Update game statistics
      this.correctAnswers++;
      this.currentStreak++;
      this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
      const scoreEarned = this.calculateScore();
      this.totalScore += scoreEarned;
      
      // Update score display
      this.updateScoreDisplay();
      
      // Show success feedback with streak info
      const streakText = this.currentStreak > 1 ? ` 🔥 Streak: ${this.currentStreak}!` : '';
      this.showValidationFeedback(true, `Excellent! +${scoreEarned} points!${streakText} ✅`);
      
      // Analytics tracking for success
      analytics.track(AnalyticsEvent.ANAGRAM_SOLVED, {
        word: this.getCurrentWord(),
        difficulty: this.getCurrentDifficulty(),
        solveTime: this.getElapsedTime(),
        score: scoreEarned,
        streak: this.currentStreak
      });
      
      // Generate new anagram after brief success display
      setTimeout(async () => {
        await this.generateNewAnagram();
        this.resetGameState();
      }, 1500);
    } else {
      // Break streak on wrong answer
      this.currentStreak = 0;
      
      // Show error feedback but keep same anagram
      this.showValidationFeedback(false, 'Try again! You can do it! ❌');
    }
  }

  private createTimerScoreContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'timer-score-container';
    
    // Timer section with enhanced visualization
    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-display'; // For TimerUI integration
    timerContainer.className = 'timer-container timer-calm';
    timerContainer.innerHTML = `
      <div class="text-caption" style="margin-bottom: 4px;">Time</div>
      <div class="timer-display text-display">1:00</div>
    `;

    // Score section - simple box
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'score-container';
    scoreContainer.innerHTML = `
      <div class="score-number text-display">${this.totalScore}</div>
      <div class="text-caption" style="margin-top: 4px;">Score</div>
    `;

    container.appendChild(timerContainer);
    container.appendChild(scoreContainer);
    
    return container;
  }

  private createActionsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'actions-container';
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn';
    submitBtn.textContent = 'Submit';
    submitBtn.setAttribute('aria-label', 'Submit your answer');
    
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-secondary btn-skip';
    skipBtn.textContent = 'Skip';
    skipBtn.setAttribute('aria-label', 'Skip this anagram');
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.setAttribute('aria-label', 'Clear your input');
    
    // Clear functionality
    clearBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      this.enhancedInput.clear();
      this.enhancedInput.focus();
    });

    // Skip functionality
    skipBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      this.handleSkip();
    });

    // Submit functionality
    submitBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      if (this.enhancedInput.getState().isComplete) {
        this.handleSubmit(this.enhancedInput.getValue());
      }
    });

    container.appendChild(submitBtn);
    container.appendChild(clearBtn);
    container.appendChild(skipBtn);
    
    return container;
  }

  private setupLayout(): void {
    // Add sound settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn-secondary settings-btn';
    settingsBtn.innerHTML = '🔊';
    settingsBtn.setAttribute('aria-label', 'Sound settings');
    settingsBtn.addEventListener('click', () => {
      soundManager.playButtonClick();
      this.soundSettings.toggle();
      analytics.track(AnalyticsEvent.SETTINGS_OPENED);
    });
    
    // Mode badge (shows current word generation mode)
    const modeBadge = document.createElement('div');
    modeBadge.className = 'mode-badge';
    modeBadge.setAttribute('aria-label', 'Current word generation mode');
    const savedMode = localStorage.getItem('scramble-word-mode') || 'hybrid';
    modeBadge.textContent = savedMode === 'hybrid' ? '🔄 Hybrid' : savedMode === 'curated' ? '📚 Curated' : '🌐 Unlimited';
    modeBadge.title = savedMode === 'hybrid' 
      ? 'Hybrid mode: Online words with curated fallback' 
      : savedMode === 'curated' 
      ? 'Curated mode: 82 handpicked words only' 
      : 'Unlimited mode: Online words only';
    
    // Create footer with settings button and mode badge
    const gameFooter = document.createElement('div');
    gameFooter.className = 'game-footer';
    gameFooter.style.display = 'flex';
    gameFooter.style.justifyContent = 'space-between';
    gameFooter.style.alignItems = 'center';
    gameFooter.appendChild(settingsBtn);
    gameFooter.appendChild(modeBadge);
    
    // Create heading
    const heading = document.createElement('h1');
    heading.className = 'game-heading';
    heading.textContent = 'SCRAMBLE';
    
    // Create header container with heading
    const headerContainer = document.createElement('div');
    headerContainer.className = 'game-header-container';
    
    // Offline detection banner (hidden by default)
    const offlineBanner = document.createElement('div');
    offlineBanner.className = 'offline-banner';
    offlineBanner.setAttribute('aria-live', 'polite');
    offlineBanner.innerHTML = '📡 Offline - Using curated words';
    offlineBanner.style.display = 'none';
    
    // Loading indicator (hidden by default)
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.setAttribute('aria-live', 'polite');
    loadingIndicator.setAttribute('aria-label', 'Loading new word');
    loadingIndicator.innerHTML = '<div class="spinner"></div><span>Generating word...</span>';
    loadingIndicator.style.display = 'none';
    
    headerContainer.appendChild(heading);
    
    // Assemble the complete layout
    this.container.appendChild(headerContainer);
    this.container.appendChild(offlineBanner);
    this.container.appendChild(loadingIndicator);
    this.container.appendChild(this.timerScoreContainer);
    this.container.appendChild(this.scrambledContainer);
    this.container.appendChild(this.inputContainer);
    this.container.appendChild(this.actionsContainer);
    this.container.appendChild(gameFooter);
    
    // Add sound settings panel to body (modal)
    document.body.appendChild(this.soundSettings.getElement());
    
    // Auto-focus input for seamless UX
    setTimeout(() => {
      this.enhancedInput.focus();
    }, 100);
  }

  public render(): void {
    const app = document.querySelector('#app');
    if (app) {
      app.innerHTML = ''; // Clear existing content
      app.appendChild(this.container);
      console.log('🎨 Responsive game layout rendered successfully');
    }
  }

  public updateScrambledLetters(letters: string[]): void {
    this.currentScrambledLetters = letters;
    
    // Update visual display
    const scrambledLettersContainer = this.scrambledContainer.querySelector('.scrambled-letters');
    if (scrambledLettersContainer) {
      scrambledLettersContainer.innerHTML = letters
        .map(letter => `<div class="letter-box">${letter.toUpperCase()}</div>`)
        .join('');
    }
    
    // Update enhanced input validation
    this.enhancedInput.updateScrambledLetters(letters);
  }

  public getInputValue(): string {
    return this.enhancedInput.getValue();
  }

  public clearInput(): void {
    this.enhancedInput.clear();
  }

  public focusInput(): void {
    this.enhancedInput.focus();
  }

  public getInputState(): InputState {
    return this.enhancedInput.getState();
  }

  public updateTimerState(timeRemaining: number): void {
    const timerContainer = this.timerScoreContainer.querySelector('.timer-container');
    if (!timerContainer) return;

    // Remove existing timer state classes
    timerContainer.classList.remove('timer-calm', 'timer-aware', 'timer-focus', 'timer-final');
    
    // Add appropriate state class based on time remaining
    if (timeRemaining > 30) {
      timerContainer.classList.add('timer-calm');
    } else if (timeRemaining > 10) {
      timerContainer.classList.add('timer-aware');
    } else if (timeRemaining > 5) {
      timerContainer.classList.add('timer-focus');
    } else if (timeRemaining > 0) {
      timerContainer.classList.add('timer-final');
    }
  }

  public handleSkip(): void {
    // Check skip limits
    if (this.skipCount >= this.maxSkips) {
      this.showSkipLimitReached();
      return;
    }

    // Analytics tracking
    analytics.track(AnalyticsEvent.ANAGRAM_SKIPPED, {
      difficulty: this.getCurrentDifficulty(),
      skipCount: this.skipCount + 1,
      maxSkips: this.maxSkips,
      word: this.getCurrentWord()
    });

    // Increment skip count
    this.skipCount++;
    
    // Show encouraging feedback
    this.showSkipFeedback();
    
    // Generate new anagram
    setTimeout(async () => {
      await this.generateNewAnagram();
      this.resetGameState();
    }, 500); // Brief delay for smooth transition
    
    console.log(`🎯 Anagram skipped (${this.skipCount}/${this.maxSkips})`);
  }

  private showSkipFeedback(): void {
    // Play skip sound
    soundManager.playSkip();
    
    const messages = [
      'Fresh puzzle incoming! ✨',
      'New challenge awaits! 🎯', 
      'Let\'s try another one! 🌟',
      'Different letters, new possibilities! 🎨'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create feedback notification
    const feedback = document.createElement('div');
    feedback.className = 'skip-feedback';
    feedback.textContent = randomMessage;
    feedback.setAttribute('aria-live', 'polite');
    
    this.actionsContainer.style.position = 'relative';
    this.actionsContainer.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }

  private showSkipLimitReached(): void {
    const feedback = document.createElement('div');
    feedback.className = 'skip-feedback skip-limit';
    feedback.textContent = 'No skips remaining - you\'ve got this! 💪';
    feedback.setAttribute('aria-live', 'polite');
    
    this.actionsContainer.style.position = 'relative';
    this.actionsContainer.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }



  public getSkipStatus(): { count: number; remaining: number; maxSkips: number } {
    return {
      count: this.skipCount,
      remaining: this.maxSkips - this.skipCount,
      maxSkips: this.maxSkips
    };
  }

  public resetSkipCount(): void {
    this.skipCount = 0;
    
    // Update skip button appearance
    const skipBtn = this.actionsContainer.querySelector('.btn-skip') as HTMLButtonElement;
    if (skipBtn) {
      skipBtn.classList.remove('limited');
      skipBtn.textContent = 'Skip';
    }
  }

  /**
   * Initialize the timer display
   */
  private initializeTimer(): void {
    this.startNewTimer();
  }

  private startNewTimer(): void {
    try {
      // Clear any existing timer
      if (this.currentTimer !== undefined) {
        clearInterval(this.currentTimer);
      }
      
      // Start a 60-second countdown timer
      this.timeRemaining = 60;
      
      const timerDisplay = this.container.querySelector('.timer-display');
      if (!timerDisplay) return;
      
      // Update immediately
      this.updateTimerDisplay();
      
      // Set up interval for countdown
      this.currentTimer = setInterval(() => {
        this.timeRemaining--;
        this.updateTimerDisplay();
        
        if (this.timeRemaining <= 0) {
          if (this.currentTimer !== undefined) {
            clearInterval(this.currentTimer);
          }
          this.handleTimeUp();
        }
      }, 1000);
      
    } catch (error) {
      console.warn('Timer initialization failed:', error);
    }
  }

  private updateTimerDisplay(): void {
    const timerDisplay = this.container.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update timer state based on time remaining
    const timerContainer = this.container.querySelector('.timer-container');
    if (timerContainer) {
      timerContainer.className = 'timer-container';
      
      if (this.timeRemaining > 45) {
        timerContainer.classList.add('timer-calm');
      } else if (this.timeRemaining > 20) {
        timerContainer.classList.add('timer-aware');
      } else if (this.timeRemaining > 10) {
        timerContainer.classList.add('timer-focus');
      } else {
        timerContainer.classList.add('timer-final');
      }
    }
  }

  /**
   * Handle when time runs out
   */
  private handleTimeUp(): void {
    // Show the solution before moving to next anagram
    this.showTimeoutSolution();
  }

  /**
   * Display the solution when timer runs out (SCRAM-016)
   */
  private showTimeoutSolution(): void {
    if (!this.currentAnagram) return;

    // Play timeout sound
    soundManager.playTimeout();

    // Track analytics
    analytics.track(AnalyticsEvent.TIMER_TIMEOUT, {
      scrambled: this.currentAnagram.scrambled,
      solution: this.currentAnagram.solution,
      difficulty: this.getCurrentDifficulty(),
      category: this.currentAnagram.category,
      timeSpent: 60
    });

    // Encouraging messages pool
    const encouragements = [
      "Keep going! You've got this! 💪",
      "Learning happens with practice! 🌟",
      "Every puzzle makes you stronger! 🎯",
      "Don't give up, champion! ⭐",
      "Progress over perfection! 🚀"
    ];

    const randomEncouragement = encouragements[
      Math.floor(Math.random() * encouragements.length)
    ];

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'solution-overlay timeout-reveal';
    overlay.setAttribute('role', 'alert');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.setAttribute('aria-atomic', 'true');

    overlay.innerHTML = `
      <div class="solution-content">
        <h3 class="timeout-header">⏰ Time's Up!</h3>
        <div class="scrambled-reference">
          <span class="label">Scrambled:</span>
          <span class="letters">${this.currentAnagram.scrambled}</span>
        </div>
        <div class="solution-arrow" aria-hidden="true">↓</div>
        <div class="solution-answer">
          <span class="label">Answer:</span>
          <span class="answer-text">${this.currentAnagram.solution}</span>
        </div>
        ${this.currentAnagram.category ? `
          <div class="solution-hint">
            <span class="hint-icon">💡</span>
            <span class="hint-text">Category: ${this.currentAnagram.category}</span>
          </div>
        ` : ''}
        <p class="encouragement">${randomEncouragement}</p>
        <div class="auto-progress">
          <span class="progress-text">Next puzzle in 5 seconds...</span>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(overlay);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Allow early dismissal with Escape key
    const dismissHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.dismissSolutionOverlay(overlay);
        document.removeEventListener('keydown', dismissHandler);
        analytics.track(AnalyticsEvent.TIMEOUT_SOLUTION_DISMISSED_EARLY, {
          timeShown: 'early',
          method: 'escape_key'
        });
      }
    };
    document.addEventListener('keydown', dismissHandler);

    // Auto-remove after 5 seconds and proceed
    setTimeout(async () => {
      this.dismissSolutionOverlay(overlay);
      document.removeEventListener('keydown', dismissHandler);
      
      // Proceed to next anagram
      await this.generateNewAnagram();
      this.resetGameState();
    }, 5000);
  }

  /**
   * Helper method to dismiss solution overlay
   */
  private dismissSolutionOverlay(overlay: HTMLElement): void {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }

  /**
   * Validate if the submitted answer is correct
   */
  private validateAnswer(attempt: string): boolean {
    const normalizedAttempt = attempt.toUpperCase().trim();
    const expectedWord = this.getCurrentWord().toUpperCase().trim();
    
    console.log(`🔍 Validation: "${normalizedAttempt}" === "${expectedWord}"`);
    
    // Case-insensitive comparison
    return normalizedAttempt === expectedWord;
  }

  /**
   * Show visual validation feedback
   */
  private showValidationFeedback(isCorrect: boolean, message: string): void {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.validation-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `validation-feedback ${isCorrect ? 'success' : 'error'}`;
    feedback.innerHTML = `
      <div class="feedback-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="feedback-message">${message}</div>
    `;

    // Add to input container
    this.inputContainer.appendChild(feedback);

    // Play appropriate sound
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }

    // Remove feedback after delay
    setTimeout(() => {
      feedback.classList.add('fade-out');
      setTimeout(() => feedback.remove(), 300);
    }, isCorrect ? 1200 : 2000);
  }

  /**
   * Generate a new anagram using Epic 6 API (frequency-based difficulty)
   */
  private async generateNewAnagram(): Promise<void> {
    let targetDifficulty: 1 | 2 | 3 | 4 | 5;
    
    // Determine difficulty based on game mode
    switch (this.gameMode) {
      case 'streak':
        // Progressive difficulty: starts at 1, increases every 3 correct answers
        targetDifficulty = Math.min(5, 1 + Math.floor(this.correctAnswers / 3)) as 1 | 2 | 3 | 4 | 5;
        this.currentDifficulty = targetDifficulty;
        break;
      
      case 'learning':
        // Fixed difficulty selected by user
        targetDifficulty = this.selectedLearningDifficulty as 1 | 2 | 3 | 4 | 5;
        this.currentDifficulty = targetDifficulty;
        break;
      
      case 'party':
        // Random difficulty for variety and excitement!
        targetDifficulty = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
        this.currentDifficulty = targetDifficulty;
        break;
      
      default:
        targetDifficulty = 1;
    }
    
    try {
      console.log(`🎲 Requesting anagram at difficulty ${targetDifficulty} (mode: ${this.gameMode})`);
      
      // Get anagram from Epic 6 generator (API with cache + curated fallback)
      const anagram = await this.anagramGenerator.getAnagram({
        difficulty: targetDifficulty,
        excludeUsed: true
      });
      
      console.log(`📦 Received anagram:`, anagram);
      
      if (!anagram) {
        console.error('❌ Failed to generate anagram');
        return;
      }
      
      // Validate anagram has scrambled letters
      if (!anagram.scrambled || anagram.scrambled.trim().length === 0) {
        console.error('❌ Invalid anagram - no scrambled letters:', anagram);
        return;
      }
      
      this.currentAnagram = anagram;
      
      // Set the scrambled letters
      this.currentScrambledLetters = this.currentAnagram.scrambled.split('');
      
      // Defensive check - ensure we have letters
      if (this.currentScrambledLetters.length === 0) {
        console.error('❌ No scrambled letters after split:', this.currentAnagram.scrambled);
        return;
      }
      
      console.log(`📝 Scrambled letters array:`, this.currentScrambledLetters);
      
      this.updateScrambledDisplay();
      
      // Update enhanced input configuration
      this.enhancedInput.updateConfig({
        scrambledLetters: this.currentScrambledLetters,
        expectedLength: this.currentScrambledLetters.length
      });
      
      // Restart timer for new anagram
      this.startNewTimer();
      
      // Track new anagram presented
      analytics.track(AnalyticsEvent.ANAGRAM_PRESENTED, {
        word: this.currentAnagram.solution,
        difficulty: this.getCurrentDifficulty(),
        source: (anagram as any).source || 'unknown'
      });
      
      console.log(`🎯 New anagram: ${this.currentAnagram.scrambled} (Solution: ${this.currentAnagram.solution}, Difficulty: ${targetDifficulty})`);
      
    } catch (error) {
      console.error('❌ Error generating anagram:', error);
      // Show user-friendly error
      this.showValidationFeedback(false, 'Unable to generate word. Please check your connection.');
    }
  }

  /**
   * Update the scrambled letters display
   */
  private updateScrambledDisplay(): void {
    const letterContainer = this.scrambledContainer.querySelector('.scrambled-letters');
    if (!letterContainer) {
      console.error('❌ Letter container not found');
      return;
    }
    
    if (!this.currentScrambledLetters || this.currentScrambledLetters.length === 0) {
      console.error('❌ No scrambled letters to display');
      return;
    }
    
    const lettersHTML = this.currentScrambledLetters
      .map(letter => {
        // Ensure letter is not empty
        const displayLetter = letter && letter.trim() ? letter : '?';
        return `<div class="letter-box">${displayLetter}</div>`;
      })
      .join('');
    
    letterContainer.innerHTML = `
      <div class="letters-row">
        ${lettersHTML}
      </div>
    `;
    
    console.log(`✅ Display updated with ${this.currentScrambledLetters.length} letters`);
    
    // Update hint text
    this.updateHintDisplay();
  }

  /**
   * Update hint display with current anagram hint
   */
  private updateHintDisplay(): void {
    const hintText = this.scrambledContainer.querySelector('.hint-text');
    if (hintText && this.currentAnagram) {
      // Use contextual hint from API
      const hint = this.currentAnagram.hints.category;
      
      // Show contextual hint without letter count
      hintText.textContent = `💡 Hint: ${hint}`;
    }
    
    // Update difficulty badge
    this.updateDifficultyBadge();
  }

  /**
   * Update difficulty badge to show current word difficulty
   */
  private updateDifficultyBadge(): void {
    const badge = this.scrambledContainer.querySelector('.difficulty-badge');
    if (!badge || !this.currentAnagram) return;
    
    const difficulty = this.currentAnagram.difficulty;
    const stars = '⭐'.repeat(difficulty);
    
    // Difficulty labels
    const labels: Record<number, string> = {
      1: 'Beginner',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Expert'
    };
    
    const label = labels[difficulty] || 'Unknown';
    
    // Color coding by difficulty
    const colors: Record<number, string> = {
      1: 'var(--sage-green)',      // Calm green
      2: '#90B77D',                // Light green
      3: '#E8C078',                // Warm yellow
      4: '#D4A574',                // Orange
      5: '#D4A5A5'                 // Soft red
    };
    
    const bgColor = colors[difficulty] || 'var(--sage-green)';
    
    badge.textContent = `${stars} ${label}`;
    (badge as HTMLElement).style.background = bgColor;
  }

  /**
   * Reset game state for new anagram
   */
  private resetGameState(): void {
    this.enhancedInput.clear();
    this.enhancedInput.focus();
  }

  /**
   * Update score display
   */
  private updateScoreDisplay(): void {
    const scoreNumber = this.container.querySelector('.score-number');
    if (scoreNumber) {
      scoreNumber.textContent = this.totalScore.toString();
    }
  }

  // Analytics utility methods
  private getCurrentWord(): string {
    return this.currentAnagram?.solution || 'UNKNOWN';
  }

  private getCurrentDifficulty(): 'easy' | 'medium' | 'hard' {
    if (!this.currentAnagram) return 'medium';
    
    const difficulty = this.currentAnagram.difficulty;
    if (difficulty <= 2) return 'easy';
    if (difficulty <= 4) return 'medium';
    return 'hard';
  }

  private getElapsedTime(): number {
    return (60 - this.timeRemaining) * 1000; // Convert to milliseconds
  }

  private calculateScore(): number {
    const baseScore = 100;
    const timeBonus = Math.max(0, this.timeRemaining * 2); // 2 points per remaining second
    const difficultyMultiplier = this.getCurrentDifficulty() === 'hard' ? 1.5 : 
                                this.getCurrentDifficulty() === 'medium' ? 1.2 : 1.0;
    const streakBonus = this.currentStreak > 1 ? (this.currentStreak - 1) * 10 : 0;
    
    return Math.round((baseScore + timeBonus + streakBonus) * difficultyMultiplier);
  }

  /**
   * Show loading indicator (for API word generation >100ms)
   */
  public showLoading(): void {
    const loadingIndicator = this.container.querySelector('.loading-indicator') as HTMLElement;
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
      loadingIndicator.setAttribute('aria-busy', 'true');
    }
  }

  /**
   * Hide loading indicator
   */
  public hideLoading(): void {
    const loadingIndicator = this.container.querySelector('.loading-indicator') as HTMLElement;
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
      loadingIndicator.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Update mode badge based on current word generation mode
   */
  private updateModeBadge(): void {
    const modeBadge = this.container.querySelector('.mode-badge') as HTMLElement;
    if (!modeBadge) return;
    
    const mode = localStorage.getItem('scramble-word-mode') || 'hybrid';
    
    if (mode === 'hybrid') {
      modeBadge.textContent = '🔄 Hybrid';
      modeBadge.title = 'Hybrid mode: Online words with curated fallback';
    } else if (mode === 'curated') {
      modeBadge.textContent = '📚 Curated';
      modeBadge.title = 'Curated mode: 82 handpicked words only';
    } else {
      modeBadge.textContent = '🌐 Unlimited';
      modeBadge.title = 'Unlimited mode: Online words only';
    }
  }

  /**
   * Show game mode selection modal
   */
  private showGameModeModal(): void {
    if (this.modeModalShown) return;
    
    const modal = document.createElement('div');
    modal.className = 'game-mode-modal';
    modal.innerHTML = `
      <div class="game-mode-modal-content">
        <h2 style="color: var(--soft-lavender); margin-bottom: 8px;">🎮 Choose Your Game Mode</h2>
        <p style="color: var(--dusty-blue); margin-bottom: 24px; font-size: 0.9rem;">
          Select how you want to play Scramble
        </p>
        
        <div class="game-mode-options">
          <button class="game-mode-option" data-mode="streak">
            <div class="mode-icon">📈</div>
            <div class="mode-title">Streak Mode</div>
            <div class="mode-description">
              Progressive difficulty - starts easy, gets harder as you succeed!
              <br><span style="color: var(--muted-coral);">Perfect for challenges</span>
            </div>
          </button>
          
          <button class="game-mode-option" data-mode="learning">
            <div class="mode-icon">🎓</div>
            <div class="mode-title">Learning Mode</div>
            <div class="mode-description">
              Choose your difficulty level and practice consistently
              <br><span style="color: var(--muted-coral);">Great for skill building</span>
            </div>
          </button>
          
          <button class="game-mode-option" data-mode="party">
            <div class="mode-icon">🎉</div>
            <div class="mode-title">Party Mode</div>
            <div class="mode-description">
              Random difficulties, fast-paced action, bonus points!
              <br><span style="color: var(--muted-coral);">Maximum fun & variety</span>
            </div>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click handlers for mode selection
    const modeButtons = modal.querySelectorAll('.game-mode-option');
    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode') as GameMode;
        
        // If learning mode, show difficulty selector
        if (mode === 'learning') {
          this.showDifficultySelector(modal);
        } else {
          this.startGameWithMode(mode);
          modal.remove();
        }
      });
    });
    
    this.modeModalShown = true;
  }

  /**
   * Show difficulty selector for learning mode
   */
  private showDifficultySelector(modal: HTMLElement): void {
    const content = modal.querySelector('.game-mode-modal-content');
    if (!content) return;
    
    content.innerHTML = `
      <h2 style="color: var(--soft-lavender); margin-bottom: 8px;">🎓 Learning Mode</h2>
      <p style="color: var(--dusty-blue); margin-bottom: 24px; font-size: 0.9rem;">
        Select your difficulty level
      </p>
      
      <div class="difficulty-selector">
        <button class="difficulty-option" data-difficulty="1">
          <div class="difficulty-icon">⭐</div>
          <div class="difficulty-name">Beginner</div>
          <div class="difficulty-desc">Common everyday words</div>
        </button>
        
        <button class="difficulty-option" data-difficulty="2">
          <div class="difficulty-icon">⭐⭐</div>
          <div class="difficulty-name">Easy</div>
          <div class="difficulty-desc">Familiar words</div>
        </button>
        
        <button class="difficulty-option" data-difficulty="3">
          <div class="difficulty-icon">⭐⭐⭐</div>
          <div class="difficulty-name">Medium</div>
          <div class="difficulty-desc">Moderate vocabulary</div>
        </button>
        
        <button class="difficulty-option" data-difficulty="4">
          <div class="difficulty-icon">⭐⭐⭐⭐</div>
          <div class="difficulty-name">Hard</div>
          <div class="difficulty-desc">Less common words</div>
        </button>
        
        <button class="difficulty-option" data-difficulty="5">
          <div class="difficulty-icon">⭐⭐⭐⭐⭐</div>
          <div class="difficulty-name">Expert</div>
          <div class="difficulty-desc">Rare & challenging words</div>
        </button>
      </div>
      
      <button class="back-button" style="margin-top: 16px;">← Back to Modes</button>
    `;
    
    // Add click handlers for difficulty selection
    const difficultyButtons = content.querySelectorAll('.difficulty-option');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const difficulty = parseInt(button.getAttribute('data-difficulty') || '1');
        this.selectedLearningDifficulty = difficulty;
        this.startGameWithMode('learning');
        modal.remove();
      });
    });
    
    // Back button handler
    const backButton = content.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.modeModalShown = false;
        modal.remove();
        this.showGameModeModal();
      });
    }
  }

  /**
   * Start game with selected mode
   */
  private async startGameWithMode(mode: GameMode): Promise<void> {
    this.gameMode = mode;
    
    // Set timer based on mode
    switch (mode) {
      case 'party':
        this.timeRemaining = 30; // Faster pace for party mode!
        break;
      case 'streak':
      case 'learning':
      default:
        this.timeRemaining = 60;
    }
    
    // Initialize game
    await this.generateNewAnagram();
    this.initializeTimer();
    
    // Track mode selection
    analytics.track(AnalyticsEvent.SETTINGS_CHANGED, {
      setting: 'game_mode',
      value: mode,
      difficulty: mode === 'learning' ? this.selectedLearningDifficulty : 'dynamic'
    });
    
    console.log(`🎮 Game started in ${mode} mode`);
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineOfflineDetection(): void {
    const offlineBanner = this.container.querySelector('.offline-banner') as HTMLElement;
    if (!offlineBanner) return;
    
    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        offlineBanner.style.display = 'block';
        analytics.track(AnalyticsEvent.OFFLINE_DETECTED, {
          timestamp: Date.now()
        });
      } else {
        offlineBanner.style.display = 'none';
      }
    };
    
    // Check initial state
    updateOnlineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      offlineBanner.style.display = 'none';
      analytics.track(AnalyticsEvent.ONLINE_DETECTED, {
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('offline', () => {
      offlineBanner.style.display = 'block';
      analytics.track(AnalyticsEvent.OFFLINE_DETECTED, {
        timestamp: Date.now()
      });
    });
  }

  /**
   * Listen for word mode changes from settings panel
   */
  private setupWordModeChangeListener(): void {
    window.addEventListener('wordModeChanged', ((event: CustomEvent) => {
      const { mode } = event.detail;
      console.log('🔄 Word mode changed to:', mode);
      
      // Update mode badge
      this.updateModeBadge();
      
      // Track analytics
      analytics.track(AnalyticsEvent.WORD_MODE_CHANGED, {
        mode,
        timestamp: Date.now()
      });
    }) as EventListener);
  }
}