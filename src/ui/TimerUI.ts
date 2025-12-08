/**
 * Timer UI Component - Enhanced Visual Timer with Calm Playground Design
 * SCRAM-011: Circular timer visualization with gentle color transitions
 * 
 * Provides smooth, anxiety-free visual feedback matching Sally's design system.
 * Features circular progress ring with time-based color transitions.
 * Integrates with GameStore for reactive updates.
 */

import type { GameStore } from '@game/GameStore';
import type { Timer } from '@game/Timer';
import { formatTime, getTimerColorClass } from '@game/Timer';
import { soundManager } from '../utils/SoundManager.ts';

export interface TimerUIConfig {
  containerId: string;
  gameStore: GameStore;
}

export class TimerUI {
  private container: HTMLElement;
  private gameStore: GameStore;
  private timer: Timer | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(config: TimerUIConfig) {
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`Timer container element not found: ${config.containerId}`);
    }
    
    this.container = container;
    this.gameStore = config.gameStore;
    this.timer = this.gameStore.getTimer();
    
    this.initialize();
    this.subscribeToStateChanges();
  }

  /**
   * Initialize the timer UI structure and styles
   */
  private initialize(): void {
    this.container.innerHTML = `
      <div class="timer-visualization">
        <svg class="timer-circle" width="120" height="120" viewBox="0 0 120 120">
          <circle class="timer-background" 
                  cx="60" cy="60" r="54" 
                  fill="none" stroke="var(--warm-cream)" 
                  stroke-width="8" opacity="0.3"/>
          <circle class="timer-progress" 
                  cx="60" cy="60" r="54"
                  fill="none" stroke="var(--sage-green)" 
                  stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="339.292" stroke-dashoffset="0"
                  transform="rotate(-90 60 60)"/>
        </svg>
        <div class="timer-display" aria-live="polite" aria-atomic="true">
          <span class="timer-text">1:00</span>
        </div>
      </div>
    `;

    // Add CSS styles for timer
    this.addStyles();
    
    // Set initial state
    this.updateDisplay();
  }

  /**
   * Subscribe to game state changes for reactive updates
   */
  private subscribeToStateChanges(): void {
    this.unsubscribe = this.gameStore.subscribe(() => {
      this.updateDisplay();
    });
  }

  /**
   * Update the visual display based on current state
   */
  private updateDisplay(): void {
    const state = this.gameStore.getState();
    const progressElement = this.container.querySelector('.timer-progress') as SVGCircleElement;
    const textElement = this.container.querySelector('.timer-text') as HTMLElement;
    const visualizationElement = this.container.querySelector('.timer-visualization') as HTMLElement;

    if (!progressElement || !textElement || !visualizationElement) return;

    // Update time display
    textElement.textContent = this.formatTimeDisplay(state.timeRemaining);

    // Update progress circle animation
    if (this.timer) {
      const progress = this.timer.getProgress();
      const circumference = 2 * Math.PI * 54; // radius = 54
      const offset = circumference * (1 - progress / 100);
      
      progressElement.style.strokeDashoffset = offset.toString();
    }

    // Update color state with smooth transitions
    this.updateTimerColors(state.timeRemaining, progressElement, visualizationElement);

    // Screen reader announcements at key intervals
    this.announceTimeIfNeeded(state.timeRemaining);
  }

  /**
   * Format time display for better readability
   */
  private formatTimeDisplay(seconds: number): string {
    if (seconds <= 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Update timer colors based on remaining time with smooth transitions
   */
  private updateTimerColors(timeRemaining: number, progressElement: SVGCircleElement, containerElement: HTMLElement): void {
    // Remove existing color classes
    containerElement.classList.remove('timer-calm', 'timer-aware', 'timer-focus', 'timer-final');
    
    let colorClass = '';
    let strokeColor = '';
    
    if (timeRemaining > 30) {
      // Calm state: Sage green (60-31s)
      colorClass = 'timer-calm';
      strokeColor = 'var(--sage-green)';
    } else if (timeRemaining > 10) {
      // Aware state: Dusty blue (30-11s)  
      colorClass = 'timer-aware';
      strokeColor = 'var(--dusty-blue)';
    } else if (timeRemaining > 5) {
      // Focus state: Muted coral (10-6s)
      colorClass = 'timer-focus';
      strokeColor = 'var(--muted-coral)';
    } else if (timeRemaining > 0) {
      // Final state: Gentle warning (5-0s)
      colorClass = 'timer-final';
      strokeColor = 'var(--muted-coral)';
    }
    
    containerElement.classList.add(colorClass);
    progressElement.style.stroke = strokeColor;
  }

  /**
   * Provide screen reader announcements at key intervals
   */
  private announceTimeIfNeeded(timeRemaining: number): void {
    const announceIntervals = [30, 10, 5, 3, 2, 1];
    
    if (announceIntervals.includes(timeRemaining)) {
      const textElement = this.container.querySelector('.timer-text') as HTMLElement;
      if (textElement) {
        // Briefly update aria-label for screen reader announcement
        textElement.setAttribute('aria-label', `${timeRemaining} seconds remaining`);
        
        // Play subtle audio warning at key moments
        if (timeRemaining === 10 || timeRemaining === 5) {
          soundManager.playTimerWarning();
        }
        
        // Reset after announcement
        setTimeout(() => {
          textElement.removeAttribute('aria-label');
        }, 1000);
      }
    }
  }

  /**
   * Add CSS styles for enhanced timer component with Calm Playground design
   */
  private addStyles(): void {
    const styleId = 'timer-ui-styles';
    
    // Don't add styles if they already exist
    if (document.getElementById(styleId)) return;

    const styles = `
      /* Enhanced Timer Visualization (SCRAM-011) */
      .timer-visualization {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timer-circle {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }

      .timer-progress {
        transition: stroke 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                    stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .timer-display {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 2;
      }

      .timer-text {
        font-size: clamp(32px, 5vw, 48px) !important;
        font-weight: 600;
        color: var(--charcoal-gray);
        font-family: var(--font-family);
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        transition: color 0.5s ease;
      }

      /* Color State Animations - Sally's Calm Playground */
      .timer-calm .timer-progress {
        stroke: var(--sage-green);
      }
      
      .timer-calm .timer-text {
        color: var(--sage-green);
      }

      .timer-aware .timer-progress {
        stroke: var(--dusty-blue);
      }
      
      .timer-aware .timer-text {
        color: var(--dusty-blue);
      }

      .timer-focus .timer-progress {
        stroke: var(--muted-coral);
      }
      
      .timer-focus .timer-text {
        color: var(--muted-coral);
      }

      .timer-final .timer-progress {
        stroke: var(--muted-coral);
        animation: gentle-pulse 1.5s ease-in-out infinite alternate;
      }
      
      .timer-final .timer-text {
        color: var(--muted-coral);
        animation: gentle-pulse 1.5s ease-in-out infinite alternate;
      }

      /* Gentle pulse animation for final countdown */
      @keyframes gentle-pulse {
        from { 
          opacity: 0.8; 
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        to { 
          opacity: 1; 
          filter: drop-shadow(0 2px 8px rgba(232, 165, 152, 0.3));
        }
      }

      /* Reduced motion preference support */
      @media (prefers-reduced-motion: reduce) {
        .timer-progress {
          transition: stroke 0.5s ease;
        }
        
        .timer-final .timer-progress,
        .timer-final .timer-text {
          animation: none;
        }
        
        .timer-visualization {
          filter: none;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .timer-text {
          text-shadow: none;
          font-weight: 700;
        }
        
        .timer-progress {
          stroke-width: 10;
        }
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        .timer-visualization {
          width: 100px;
          height: 100px;
        }
        
        .timer-text {
          font-size: clamp(32px, 5vw, 48px) !important;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Destroy the timer UI and cleanup
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}