/**
 * EnhancedInput - Advanced Text Input with Real-time Validation
 * SCRAM-010: Provides intelligent input feedback and validation
 * SCRAM-013: Enhanced with gentle audio feedback
 * Implements Sally's "Calm Playground" interaction design
 */

import { soundManager } from '../utils/SoundManager.ts'
import { analytics, AnalyticsEvent } from '../utils/analytics.ts'

export interface InputState {
  value: string;
  isValid: boolean;
  isComplete: boolean;
  characterCount: number;
  expectedLength: number;
  remainingLetters: string[];
  validationMessage: string;
}

export interface InputConfig {
  scrambledLetters: string[];
  expectedLength: number;
  placeholder?: string;
  onStateChange?: (state: InputState) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
}

export class EnhancedInput {
  private inputElement: HTMLInputElement;
  private feedbackContainer: HTMLElement;
  private letterIndicator: HTMLElement;
  private config: InputConfig;
  private currentState: InputState;

  constructor(config: InputConfig) {
    this.config = config;
    this.currentState = this.getInitialState();
    
    this.inputElement = this.createInputElement();
    this.feedbackContainer = this.createFeedbackContainer();
    this.letterIndicator = this.createLetterIndicator();
    
    this.setupEventListeners();
    this.updateDisplay();
    
    console.log('🎯 EnhancedInput initialized with validation');
  }

  private getInitialState(): InputState {
    return {
      value: '',
      isValid: false,
      isComplete: false,
      characterCount: 0,
      expectedLength: this.config.expectedLength,
      remainingLetters: [...this.config.scrambledLetters],
      validationMessage: `0/${this.config.expectedLength} letters`
    };
  }

  private createInputElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'answer-input enhanced-input';
    input.placeholder = this.config.placeholder || 'Type your answer...';
    input.setAttribute('aria-label', 'Enter your anagram solution with real-time feedback');
    input.setAttribute('aria-describedby', 'input-feedback letter-indicator');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.maxLength = Math.max(25, this.config.expectedLength * 3); // Allow much more flexibility for longer words
    
    return input;
  }

  private createFeedbackContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'input-feedback';
    container.className = 'input-feedback';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'status');
    
    return container;
  }

  private createLetterIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.id = 'letter-indicator';
    indicator.className = 'letter-indicator';
    indicator.innerHTML = `
      <div class="text-caption" style="margin-bottom: 4px; color: #4A4A4A; font-size: 1rem; font-weight: 600;">
        Available Letters
      </div>
      <div class="available-letters"></div>
    `;
    
    return indicator;
  }

  private setupEventListeners(): void {
    // Real-time input validation
    this.inputElement.addEventListener('input', (e) => {
      this.handleInput((e.target as HTMLInputElement).value);
    });

    // Keyboard shortcuts
    this.inputElement.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });

    // Focus state management
    this.inputElement.addEventListener('focus', () => {
      this.inputElement.classList.add('focused');
      soundManager.playInputFocus();
    });

    this.inputElement.addEventListener('blur', () => {
      this.inputElement.classList.remove('focused');
    });

    // Prevent invalid characters
    this.inputElement.addEventListener('keypress', (e) => {
      this.handleKeypress(e);
    });
  }

  private handleInput(value: string): void {
    // Performance measurement for input response time
    analytics.startTiming('input_response');
    
    // Clean and validate input
    const cleanValue = value.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Track input errors if cleaning was needed
    if (cleanValue !== value) {
      analytics.track(AnalyticsEvent.INPUT_VALIDATION_ERROR, {
        originalInput: value,
        cleanedInput: cleanValue,
        errorCount: value.length - cleanValue.length
      });
      this.inputElement.value = cleanValue;
    }
    
    // Play typing sound for valid input
    if (cleanValue.length > this.currentState.value.length) {
      soundManager.playKeyPress();
    }

    // Calculate new state
    const newState = this.calculateState(cleanValue);
    
    // Play feedback sounds for state changes
    if (!this.currentState.isComplete && newState.isComplete) {
      // Completed word
      soundManager.playCorrect();
      analytics.track(AnalyticsEvent.INPUT_VALIDATION_SUCCESS, {
        inputLength: newState.value.length,
        isComplete: true
      });
    } else if (this.currentState.isValid && !newState.isValid && newState.value.length > 0) {
      // Became invalid
      soundManager.playIncorrect();
    }
    
    // Update current state
    this.currentState = newState;
    
    // Update display
    this.updateDisplay();
    
    // End performance timing
    analytics.endTiming('input_response');
    
    // Notify parent component
    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }
  }

  private calculateState(value: string): InputState {
    const characterCount = value.length;
    const isComplete = characterCount === this.config.expectedLength;
    
    // Validate letters against scrambled set and calculate remaining
    const scrambledSet = this.config.scrambledLetters.map(l => l.toUpperCase());
    const usedLetters = value.toUpperCase().split('');
    
    // Track which indices have been used
    const usedIndices = new Set<number>();
    let isValid = true;
    
    // Match each used letter to a scrambled letter (greedy, left-to-right)
    for (const usedLetter of usedLetters) {
      let found = false;
      for (let i = 0; i < scrambledSet.length; i++) {
        if (!usedIndices.has(i) && scrambledSet[i] === usedLetter) {
          usedIndices.add(i);
          found = true;
          break;
        }
      }
      if (!found) {
        isValid = false;
        break;
      }
    }
    
    // Calculate remaining letters (preserve original order from scrambled word)
    const remainingLetters: string[] = [];
    for (let i = 0; i < scrambledSet.length; i++) {
      if (!usedIndices.has(i)) {
        remainingLetters.push(scrambledSet[i]);
      }
    }
    
    // Generate validation message
    let validationMessage = `${characterCount}/${this.config.expectedLength} letters`;
    
    if (!isValid && characterCount > 0) {
      validationMessage = 'Some letters not available';
    } else if (isComplete && isValid) {
      validationMessage = 'Ready to submit! ✨';
    } else if (characterCount > this.config.expectedLength) {
      validationMessage = 'Too many letters';
    }
    
    return {
      value,
      isValid,
      isComplete: isComplete && isValid,
      characterCount,
      expectedLength: this.config.expectedLength,
      remainingLetters,
      validationMessage
    };
  }

  private updateDisplay(): void {
    const state = this.currentState;
    
    // Update input classes
    this.inputElement.classList.remove('valid', 'invalid', 'complete');
    
    if (state.characterCount > 0) {
      if (state.isComplete) {
        this.inputElement.classList.add('complete');
      } else if (state.isValid) {
        this.inputElement.classList.add('valid');
      } else {
        this.inputElement.classList.add('invalid');
      }
    }
    
    // Update feedback message
    this.feedbackContainer.textContent = state.validationMessage;
    this.feedbackContainer.className = 'input-feedback';
    
    if (state.isComplete) {
      this.feedbackContainer.classList.add('complete');
    } else if (!state.isValid && state.characterCount > 0) {
      this.feedbackContainer.classList.add('invalid');
    } else if (state.isValid && state.characterCount > 0) {
      this.feedbackContainer.classList.add('valid');
    }
    
    // Update available letters display
    this.updateLetterIndicator();
  }

  private updateLetterIndicator(): void {
    const availableLettersContainer = this.letterIndicator.querySelector('.available-letters');
    if (!availableLettersContainer) return;
    
    const uniqueLetters = [...new Set(this.currentState.remainingLetters)].sort();
    
    availableLettersContainer.innerHTML = uniqueLetters
      .map(letter => {
        const count = this.currentState.remainingLetters.filter(l => l === letter).length;
        return `<span class="letter-chip" data-letter="${letter}">
          ${letter}${count > 1 ? `<sub>${count}</sub>` : ''}
        </span>`;
      })
      .join('');
  }

  private handleKeyboard(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Enter':
        if (this.currentState.isComplete && this.config.onSubmit) {
          e.preventDefault();
          soundManager.playComplete();
          this.config.onSubmit(this.currentState.value);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.clear();
        break;
        
      case 'Backspace':
        // Allow normal backspace behavior
        break;
        
      default:
        // Additional validation happens in keypress
        break;
    }
  }

  private handleKeypress(e: KeyboardEvent): void {
    const char = e.key.toUpperCase();
    
    // Allow control keys
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    
    // Allow backspace, delete, etc.
    if (char.length !== 1) {
      return;
    }
    
    // Only allow letters
    if (!/[A-Z]/.test(char)) {
      e.preventDefault();
      return;
    }
    
    // Check if letter is available
    const currentValue = this.inputElement.value + char;
    const testState = this.calculateState(currentValue);
    
    if (!testState.isValid) {
      e.preventDefault();
      
      // Provide haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }

  public getValue(): string {
    return this.currentState.value;
  }

  public getState(): InputState {
    return { ...this.currentState };
  }

  public clear(): void {
    this.inputElement.value = '';
    this.currentState = this.getInitialState();
    this.updateDisplay();
    
    if (this.config.onClear) {
      this.config.onClear();
    }
  }

  public focus(): void {
    this.inputElement.focus();
  }

  public getElements(): { input: HTMLElement; feedback: HTMLElement; indicator: HTMLElement } {
    return {
      input: this.inputElement,
      feedback: this.feedbackContainer,
      indicator: this.letterIndicator
    };
  }

  public updateScrambledLetters(letters: string[]): void {
    this.config.scrambledLetters = letters;
    this.config.expectedLength = letters.length;
    
    // Recalculate state with new letters
    this.currentState = this.calculateState(this.inputElement.value);
    this.updateDisplay();
  }

  /**
   * Update the input configuration
   */
  public updateConfig(newConfig: Partial<InputConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recalculate state with new configuration
    this.currentState = this.calculateState(this.inputElement.value);
    this.updateDisplay();
  }

}