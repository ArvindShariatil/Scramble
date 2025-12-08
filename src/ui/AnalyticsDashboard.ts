/**
 * Analytics Dashboard
 * Developer insights and user privacy controls for Scramble Game analytics
 */

import { analytics, AnalyticsEvent, type GameAnalytics } from '../utils/analytics.js';

export class AnalyticsDashboard {
  private isVisible: boolean = false;
  private element: HTMLElement | null = null;

  constructor() {
    this.createDashboard();
    this.setupKeyboardShortcuts();
  }

  /**
   * Toggle analytics dashboard visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show analytics dashboard
   */
  show(): void {
    if (!this.element) return;
    
    this.updateDashboardContent();
    this.element.classList.add('visible');
    document.body.classList.add('analytics-open');
    this.isVisible = true;
    
    analytics.track(AnalyticsEvent.ANALYTICS_VIEWED);
    console.log('📊 Analytics Dashboard opened');
  }

  /**
   * Hide analytics dashboard
   */
  hide(): void {
    if (!this.element) return;
    
    this.element.classList.remove('visible');
    document.body.classList.remove('analytics-open');
    this.isVisible = false;
  }

  /**
   * Create dashboard HTML structure
   */
  private createDashboard(): void {
    this.element = document.createElement('div');
    this.element.className = 'analytics-dashboard';
    this.element.innerHTML = `
      <div class="analytics-overlay">
        <div class="analytics-content">
          <div class="analytics-header">
            <h2>📊 Analytics & Privacy Dashboard</h2>
            <button class="close-btn" title="Close Dashboard (Shift+F12)">&times;</button>
          </div>
          
          <div class="analytics-body">
            <div class="analytics-section privacy-section">
              <h3>🔒 Privacy Controls</h3>
              <div class="privacy-info">
                <p><strong>Your privacy is protected:</strong></p>
                <ul>
                  <li>✅ All data stored locally on your device only</li>
                  <li>✅ No external servers or tracking</li>
                  <li>✅ No personal information collected</li>
                  <li>✅ You control your data completely</li>
                </ul>
              </div>
              
              <div class="privacy-controls">
                <label class="privacy-toggle">
                  <input type="checkbox" class="analytics-enabled-toggle" checked>
                  <span>Enable Analytics Collection</span>
                </label>
                
                <div class="privacy-actions">
                  <button class="btn btn-secondary export-btn">📤 Export My Data</button>
                  <button class="btn btn-warning clear-btn">🗑️ Clear All Data</button>
                </div>
              </div>
            </div>

            <div class="analytics-section gameplay-section">
              <h3>🎮 Gameplay Statistics</h3>
              <div class="stats-grid" id="gameplay-stats">
                <!-- Populated dynamically -->
              </div>
            </div>

            <div class="analytics-section performance-section">
              <h3>⚡ Performance Metrics</h3>
              <div class="stats-grid" id="performance-stats">
                <!-- Populated dynamically -->
              </div>
            </div>

            <div class="analytics-section difficulty-section">
              <h3>📈 Difficulty Analysis</h3>
              <div class="difficulty-breakdown" id="difficulty-stats">
                <!-- Populated dynamically -->
              </div>
            </div>

            <div class="analytics-section features-section">
              <h3>🛠️ Feature Usage</h3>
              <div class="stats-grid" id="feature-stats">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>

          <div class="analytics-footer">
            <p class="data-info">
              Data stored locally • Auto-deleted after 90 days • 
              <span class="last-updated">Last updated: <span id="last-update-time">--</span></span>
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for dashboard interactions
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // Close button
    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click to close
    const overlay = this.element.querySelector('.analytics-overlay');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
      }
    });

    // Analytics toggle
    const toggle = this.element.querySelector('.analytics-enabled-toggle') as HTMLInputElement;
    toggle?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      analytics.setEnabled(enabled);
      this.updateDashboardContent();
    });

    // Export data button
    const exportBtn = this.element.querySelector('.export-btn');
    exportBtn?.addEventListener('click', () => this.exportData());

    // Clear data button
    const clearBtn = this.element.querySelector('.clear-btn');
    clearBtn?.addEventListener('click', () => this.clearData());

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Set up keyboard shortcuts for dashboard
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Shift + F12 to toggle dashboard
      if (e.key === 'F12' && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Update dashboard content with current analytics data
   */
  private updateDashboardContent(): void {
    if (!this.element) return;

    const data = analytics.getInsights();
    
    // Update analytics toggle state
    const toggle = this.element.querySelector('.analytics-enabled-toggle') as HTMLInputElement;
    if (toggle) {
      toggle.checked = analytics.isEnabled();
    }

    // Update gameplay statistics
    this.updateGameplayStats(data);
    
    // Update performance metrics
    this.updatePerformanceStats(data);
    
    // Update difficulty breakdown
    this.updateDifficultyStats(data);
    
    // Update feature usage
    this.updateFeatureStats(data);
    
    // Update last updated time
    const lastUpdateEl = this.element.querySelector('#last-update-time');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = new Date().toLocaleString();
    }
  }

  /**
   * Update gameplay statistics section
   */
  private updateGameplayStats(data: GameAnalytics): void {
    const gameplayEl = this.element?.querySelector('#gameplay-stats');
    if (!gameplayEl) return;

    const sessionDurationMins = Math.round(data.averageSessionDuration / 60000);
    const avgSolveTimeSec = Math.round(data.averageSolveTime / 1000);
    const totalPlayHours = Math.round(data.totalPlayTime / 3600000 * 10) / 10;

    gameplayEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${data.totalSessions}</div>
        <div class="stat-label">Total Sessions</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPlayHours}h</div>
        <div class="stat-label">Total Play Time</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${sessionDurationMins}min</div>
        <div class="stat-label">Avg Session</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.totalAnagramsCompleted}</div>
        <div class="stat-label">Words Solved</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.round(data.successRate)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${avgSolveTimeSec}s</div>
        <div class="stat-label">Avg Solve Time</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.totalWordsSkipped}</div>
        <div class="stat-label">Words Skipped</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.round(data.skipRate)}%</div>
        <div class="stat-label">Skip Rate</div>
      </div>
    `;
  }

  /**
   * Update performance statistics section
   */
  private updatePerformanceStats(data: GameAnalytics): void {
    const performanceEl = this.element?.querySelector('#performance-stats');
    if (!performanceEl) return;

    const loadTimeMs = Math.round(data.performance.loadTime);
    const inputResponseMs = Math.round(data.performance.averageInputResponseTime);
    const soundLatencyMs = Math.round(data.performance.soundSystemLatency);
    const timerAccuracy = Math.round(data.performance.timerAccuracy);

    performanceEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${loadTimeMs}ms</div>
        <div class="stat-label">Load Time</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${inputResponseMs}ms</div>
        <div class="stat-label">Input Response</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${soundLatencyMs}ms</div>
        <div class="stat-label">Sound Latency</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${timerAccuracy}%</div>
        <div class="stat-label">Timer Accuracy</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.round(data.inputErrorRate * 100)}%</div>
        <div class="stat-label">Input Error Rate</div>
      </div>
    `;
  }

  /**
   * Update difficulty breakdown section
   */
  private updateDifficultyStats(data: GameAnalytics): void {
    const difficultyEl = this.element?.querySelector('#difficulty-stats');
    if (!difficultyEl) return;

    const difficulties = ['easy', 'medium', 'hard'] as const;
    
    difficultyEl.innerHTML = difficulties.map(difficulty => {
      const diff = data.difficultyBreakdown[difficulty];
      const successRate = diff.attempts > 0 ? Math.round((diff.completions / diff.attempts) * 100) : 0;
      const avgTimeSeconds = Math.round(diff.avgTime / 1000);
      
      return `
        <div class="difficulty-item">
          <h4>${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h4>
          <div class="difficulty-stats">
            <span>Attempts: ${diff.attempts}</span>
            <span>Success: ${successRate}%</span>
            <span>Avg Time: ${avgTimeSeconds}s</span>
            <span>Skip Rate: ${Math.round(diff.skipRate)}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update feature usage section
   */
  private updateFeatureStats(data: GameAnalytics): void {
    const featureEl = this.element?.querySelector('#feature-stats');
    if (!featureEl) return;

    featureEl.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${data.featureUsage.soundToggled}</div>
        <div class="stat-label">Sound Toggles</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.featureUsage.settingsOpened}</div>
        <div class="stat-label">Settings Opened</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.featureUsage.keyboardShortcuts}</div>
        <div class="stat-label">Shortcuts Used</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.featureUsage.hintsRequested}</div>
        <div class="stat-label">Hints Requested</div>
      </div>
    `;
  }

  /**
   * Export analytics data for user download
   */
  private exportData(): void {
    try {
      const data = analytics.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `scramble-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showNotification('Analytics data exported successfully! 📁', 'success');
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      this.showNotification('Failed to export data. Please try again.', 'error');
    }
  }

  /**
   * Clear all analytics data after confirmation
   */
  private clearData(): void {
    const confirmation = confirm(
      'Are you sure you want to clear all analytics data?\n\n' +
      'This will permanently delete:\n' +
      '• All gameplay statistics\n' +
      '• Performance metrics\n' +
      '• Usage patterns\n\n' +
      'This action cannot be undone.'
    );

    if (confirmation) {
      analytics.clearAllData();
      this.updateDashboardContent();
      this.showNotification('All analytics data cleared! 🗑️', 'success');
    }
  }

  /**
   * Show notification message
   */
  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `analytics-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('visible'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  /**
   * Get summary statistics for quick access
   */
  getSummaryStats(): { sessions: number; successRate: number; totalTime: string } {
    const data = analytics.getInsights();
    const totalHours = Math.round(data.totalPlayTime / 3600000 * 10) / 10;
    
    return {
      sessions: data.totalSessions,
      successRate: Math.round(data.successRate),
      totalTime: `${totalHours}h`
    };
  }
}

// Export singleton instance
export const analyticsDashboard = new AnalyticsDashboard();