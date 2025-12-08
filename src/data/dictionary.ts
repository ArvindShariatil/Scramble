// API Error Notification System for SCRAM-007
// This module handles WordsAPI unavailability with user-friendly popups

/**
 * Interface for API error popup notifications
 */
export interface APIErrorNotification {
  isVisible: boolean;
  retryCount: number;
  lastAttempt: number;
}

/**
 * API Error Notifier - Shows popup when WordsAPI is unavailable
 * Allows players to continue with manual validation
 */
export class APIErrorNotifier {
  private popupElement: HTMLElement | null = null;
  private isAPIUnavailable = false;
  private retryCount = 0;
  private onRetry?: () => Promise<void>;
  private onDismiss?: () => void;

  constructor(callbacks?: {
    onRetry?: () => Promise<void>;
    onDismiss?: () => void;
  }) {
    this.onRetry = callbacks?.onRetry;
    this.onDismiss = callbacks?.onDismiss;
  }

  /**
   * Show API error popup with retry and continue options
   */
  showAPIErrorPopup(): void {
    if (this.popupElement) return; // Already showing

    this.isAPIUnavailable = true;
    this.retryCount++;

    this.popupElement = document.createElement('div');
    this.popupElement.className = 'api-error-popup';
    this.popupElement.setAttribute('role', 'dialog');
    this.popupElement.setAttribute('aria-labelledby', 'api-error-title');
    
    this.popupElement.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <div class="popup-header">
            <h3 id="api-error-title">⚠️ Word Validation Unavailable</h3>
          </div>
          <div class="popup-body">
            <p>The word dictionary service is currently unavailable.</p>
            <p><strong>You can continue playing</strong> - any properly formed anagram will be accepted.</p>
            <p class="retry-info">Retry attempt: ${this.retryCount}</p>
          </div>
          <div class="popup-actions">
            <button class="retry-btn" onclick="window.apiErrorNotifier?.retry()">
              🔄 Retry Connection
            </button>
            <button class="continue-btn" onclick="window.apiErrorNotifier?.dismiss()">
              ✓ Continue Playing
            </button>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles if not already present
    this.addPopupStyles();
    
    document.body.appendChild(this.popupElement);
    
    // Set global reference for button callbacks
    (window as any).apiErrorNotifier = this;
    
    console.log(`API Error popup shown (attempt ${this.retryCount})`);
  }

  /**
   * Hide API error popup
   */
  hideAPIErrorPopup(): void {
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
      this.isAPIUnavailable = false;
      
      // Clean up global reference
      if ((window as any).apiErrorNotifier === this) {
        (window as any).apiErrorNotifier = undefined;
      }
      
      console.log('API Error popup hidden - API restored');
    }
  }

  /**
   * Handle retry button click
   */
  async retry(): Promise<void> {
    console.log('Retrying API connection...');
    
    if (this.onRetry) {
      try {
        await this.onRetry();
        // If retry succeeds, popup will be hidden by the success handler
      } catch (error) {
        console.log('Retry failed, keeping popup visible');
        // Update retry count in existing popup
        const retryInfo = this.popupElement?.querySelector('.retry-info');
        if (retryInfo) {
          this.retryCount++;
          retryInfo.textContent = `Retry attempt: ${this.retryCount}`;
        }
      }
    }
  }

  /**
   * Handle dismiss button click
   */
  dismiss(): void {
    console.log('Player dismissed API error - continuing with manual validation');
    this.hideAPIErrorPopup();
    
    if (this.onDismiss) {
      this.onDismiss();
    }
  }

  /**
   * Check if API is currently marked as unavailable
   */
  isShowingError(): boolean {
    return this.isAPIUnavailable;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Reset retry count (call when API is restored)
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Add CSS styles for the popup
   */
  private addPopupStyles(): void {
    const existingStyles = document.getElementById('api-error-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'api-error-styles';
    styles.textContent = `
      .api-error-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      
      .popup-overlay {
        background: rgba(0, 0, 0, 0.7);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      
      .popup-content {
        background: white;
        border-radius: 12px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: popupSlideIn 0.3s ease-out;
      }
      
      @keyframes popupSlideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .popup-header {
        padding: 1.5rem 1.5rem 0;
        text-align: center;
      }
      
      .popup-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #d97706;
      }
      
      .popup-body {
        padding: 1rem 1.5rem;
        color: #374151;
        line-height: 1.5;
      }
      
      .popup-body p {
        margin: 0.5rem 0;
      }
      
      .retry-info {
        font-size: 0.875rem;
        color: #6b7280;
        font-style: italic;
      }
      
      .popup-actions {
        padding: 1rem 1.5rem 1.5rem;
        display: flex;
        gap: 0.75rem;
        justify-content: center;
      }
      
      .popup-actions button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 44px; /* Touch-friendly */
      }
      
      .retry-btn {
        background: #3b82f6;
        color: white;
      }
      
      .retry-btn:hover {
        background: #2563eb;
      }
      
      .continue-btn {
        background: #10b981;
        color: white;
      }
      
      .continue-btn:hover {
        background: #059669;
      }
      
      @media (max-width: 480px) {
        .popup-content {
          margin: 1rem;
        }
        
        .popup-actions {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}