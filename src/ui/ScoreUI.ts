/**
 * Score UI Component - Real-time score display and breakdown
 * 
 * Provides visual feedback for scoring with breakdown details,
 * streak indicators, and statistics display.
 */

import type { GameStore } from '@game/GameStore';
import type { ScoreBreakdown } from '@game/ScoreCalculator';

export interface ScoreUIConfig {
  containerId: string;
  gameStore: GameStore;
  showBreakdown?: boolean;
}

export class ScoreUI {
  private container: HTMLElement;
  private gameStore: GameStore;
  private showBreakdown: boolean;
  private unsubscribe: (() => void) | null = null;

  constructor(config: ScoreUIConfig) {
    const container = document.getElementById(config.containerId);
    if (!container) {
      throw new Error(`Score container element not found: ${config.containerId}`);
    }
    
    this.container = container;
    this.gameStore = config.gameStore;
    this.showBreakdown = config.showBreakdown ?? true;
    
    this.initialize();
    this.subscribeToStateChanges();
  }

  /**
   * Initialize the score UI structure and styles
   */
  private initialize(): void {
    this.container.innerHTML = `
      <div class="score-display">
        <div class="current-score">
          <div class="score-number">0</div>
          <div class="score-label">Score</div>
        </div>
        
        <div class="streak-display" style="display: none;">
          <div class="streak-number">0</div>
          <div class="streak-label">Streak</div>
          <div class="streak-indicator"></div>
        </div>
        
        <div class="score-breakdown hidden">
          <div class="breakdown-title">Last Score:</div>
          <div class="breakdown-details"></div>
        </div>
        
        <div class="score-stats" style="display: none;">
          <div class="stat-item">
            <span class="stat-label">Best Streak:</span>
            <span class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Accuracy:</span>
            <span class="stat-value">0%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg Score:</span>
            <span class="stat-value">0</span>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
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
    const stats = this.gameStore.getScoreStats();

    // Update current score
    const scoreNumber = this.container.querySelector('.score-number') as HTMLElement;
    if (scoreNumber) {
      scoreNumber.textContent = state.score.toString();
      this.animateScoreChange(scoreNumber);
    }

    // Update streak display
    const streakNumber = this.container.querySelector('.streak-number') as HTMLElement;
    const streakIndicator = this.container.querySelector('.streak-indicator') as HTMLElement;
    
    if (streakNumber && streakIndicator) {
      streakNumber.textContent = state.streak.toString();
      this.updateStreakIndicator(streakIndicator, state.streak);
    }

    // Update score breakdown if available
    if (this.showBreakdown && state.lastScoreBreakdown) {
      this.updateScoreBreakdown(state.lastScoreBreakdown);
    }

    // Update statistics
    this.updateStats(stats);
  }

  /**
   * Update streak indicator with visual feedback
   */
  private updateStreakIndicator(indicator: HTMLElement, streak: number): void {
    const calculator = this.gameStore.getScoreCalculator();
    const streakTier = calculator.getStreakTier(streak);
    
    // Remove existing classes
    indicator.classList.remove('streak-none', 'streak-building', 'streak-hot', 'streak-legendary');
    
    // Add current tier class
    indicator.classList.add(`streak-${streakTier.tier}`);
    indicator.textContent = streakTier.description;
  }

  /**
   * Update score breakdown display
   */
  private updateScoreBreakdown(breakdown: any): void {
    const breakdownContainer = this.container.querySelector('.score-breakdown') as HTMLElement;
    const breakdownDetails = this.container.querySelector('.breakdown-details') as HTMLElement;
    
    if (breakdownContainer && breakdownDetails) {
      breakdownContainer.classList.remove('hidden');
      
      const calculator = this.gameStore.getScoreCalculator();
      const formatted = calculator.formatScoreBreakdown(breakdown as ScoreBreakdown);
      
      breakdownDetails.innerHTML = `<div class="breakdown-text">${formatted}</div>`;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        breakdownContainer.classList.add('hidden');
      }, 3000);
    }
  }

  /**
   * Update statistics display
   */
  private updateStats(stats: any): void {
    const statItems = this.container.querySelectorAll('.stat-item');
    
    statItems.forEach((item, index) => {
      const valueElement = item.querySelector('.stat-value') as HTMLElement;
      if (valueElement) {
        switch (index) {
          case 0: // Best Streak
            valueElement.textContent = stats.bestStreak.toString();
            break;
          case 1: // Accuracy
            valueElement.textContent = `${Math.round(stats.accuracy)}%`;
            break;
          case 2: // Average Score
            valueElement.textContent = Math.round(stats.averageScore).toString();
            break;
        }
      }
    });
  }

  /**
   * Animate score change for visual feedback
   */
  private animateScoreChange(element: HTMLElement): void {
    element.classList.add('score-pulse');
    setTimeout(() => {
      element.classList.remove('score-pulse');
    }, 500);
  }

  /**
   * Add CSS styles for score component
   */
  private addStyles(): void {
    const styleId = 'score-ui-styles';
    
    if (document.getElementById(styleId)) return;

    const styles = `
      .score-display {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .current-score, .streak-display {
        display: inline-block;
        text-align: center;
        margin: 0 16px 16px 0;
        padding: 12px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        min-width: 80px;
      }

      .score-number, .streak-number {
        font-size: 32px;
        font-weight: bold;
        color: #1f2937;
        line-height: 1;
      }

      .score-label, .streak-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }

      .streak-indicator {
        font-size: 10px;
        font-weight: 500;
        margin-top: 4px;
        height: 12px;
      }

      .streak-none { color: #9ca3af; }
      .streak-building { color: #3b82f6; }
      .streak-hot { color: #f59e0b; }
      .streak-legendary { color: #dc2626; font-weight: bold; }

      .score-breakdown {
        margin: 16px 0;
        padding: 12px;
        background: #ecfdf5;
        border: 1px solid #10b981;
        border-radius: 6px;
        transition: opacity 0.3s ease;
      }

      .score-breakdown.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .breakdown-title {
        font-size: 12px;
        color: #047857;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .breakdown-text {
        font-size: 14px;
        color: #065f46;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .score-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: white;
        border-radius: 4px;
        font-size: 14px;
      }

      .stat-label {
        color: #6b7280;
      }

      .stat-value {
        font-weight: 600;
        color: #1f2937;
      }

      .score-pulse {
        animation: score-pulse 0.5s ease-in-out;
      }

      @keyframes score-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      @media (max-width: 480px) {
        .score-display {
          padding: 12px;
        }
        
        .current-score, .streak-display {
          margin: 0 8px 12px 0;
          min-width: 70px;
        }
        
        .score-number, .streak-number {
          font-size: 24px;
        }
        
        .score-stats {
          grid-template-columns: 1fr;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Show potential score preview
   */
  showPotentialScore(solution: string): void {
    const potential = this.gameStore.getPotentialScore(solution);
    const calculator = this.gameStore.getScoreCalculator();
    
    // Create temporary preview element
    const preview = document.createElement('div');
    preview.className = 'potential-score-preview';
    preview.innerHTML = `
      <div class="potential-title">Potential Score:</div>
      <div class="potential-details">${calculator.formatScoreBreakdown(potential)}</div>
    `;
    
    this.container.appendChild(preview);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, 2000);
  }

  /**
   * Destroy the score UI and cleanup
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}