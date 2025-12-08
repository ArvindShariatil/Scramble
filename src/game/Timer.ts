/**
 * Timer Class - Precise 60-second countdown with event callbacks
 * 
 * Provides accurate timing for game rounds with visual feedback support.
 * Includes pause/resume functionality and callback system for game integration.
 */

export interface TimerCallbacks {
  onTick: (timeRemaining: number) => void;
  onTimeout: () => void;
  onStatusChange?: (status: TimerStatus) => void;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerConfig {
  duration: number; // in seconds
  callbacks: TimerCallbacks;
}

export class Timer {
  private remaining: number;
  private duration: number;
  private intervalId: number | null = null;
  private callbacks: TimerCallbacks;
  private status: TimerStatus = 'idle';
  private startTime: number | null = null;
  private pausedTime: number = 0;

  constructor(config: TimerConfig) {
    this.duration = config.duration;
    this.remaining = config.duration;
    this.callbacks = config.callbacks;
  }

  /**
   * Start the countdown timer
   */
  start(): void {
    if (this.status === 'running') return;
    
    this.startTime = Date.now() - (this.pausedTime * 1000);
    this.status = 'running';
    this.callbacks.onStatusChange?.(this.status);
    
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 100); // Check every 100ms for better accuracy
    
    // Immediate first tick
    this.tick();
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (this.status !== 'running') return;
    
    this.clearInterval();
    this.pausedTime = this.duration - this.remaining;
    this.status = 'paused';
    this.callbacks.onStatusChange?.(this.status);
  }

  /**
   * Resume the paused timer
   */
  resume(): void {
    if (this.status !== 'paused') return;
    this.start();
  }

  /**
   * Reset timer to initial state
   */
  reset(newDuration?: number): void {
    this.clearInterval();
    
    if (newDuration !== undefined) {
      this.duration = newDuration;
    }
    
    this.remaining = this.duration;
    this.pausedTime = 0;
    this.startTime = null;
    this.status = 'idle';
    this.callbacks.onStatusChange?.(this.status);
    this.callbacks.onTick(this.remaining);
  }

  /**
   * Stop and reset the timer
   */
  stop(): void {
    this.clearInterval();
    this.status = 'idle';
    this.callbacks.onStatusChange?.(this.status);
  }

  /**
   * Get current status
   */
  getStatus(): TimerStatus {
    return this.status;
  }

  /**
   * Get remaining time in seconds
   */
  getRemaining(): number {
    return this.remaining;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsed(): number {
    return this.duration - this.remaining;
  }

  /**
   * Get progress as percentage (0-100)
   */
  getProgress(): number {
    if (this.duration === 0) return 100;
    return ((this.duration - this.remaining) / this.duration) * 100;
  }

  /**
   * Check if timer is in final 10 seconds (for visual effects)
   */
  isInFinalCountdown(): boolean {
    return this.remaining <= 10 && this.remaining > 0;
  }

  /**
   * Get color state based on remaining time
   */
  getColorState(): 'green' | 'yellow' | 'red' {
    const progress = this.getProgress();
    
    if (progress < 50) return 'green';      // First 30 seconds
    if (progress < 85) return 'yellow';     // Next 21 seconds  
    return 'red';                           // Final 9 seconds
  }

  /**
   * Internal tick method for countdown logic
   */
  private tick(): void {
    if (!this.startTime) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.remaining = Math.max(0, this.duration - elapsed);
    
    // Round to nearest tenth for display
    const displayTime = Math.round(this.remaining * 10) / 10;
    
    try {
      this.callbacks.onTick(displayTime);
    } catch (error) {
      console.error('Timer onTick callback error:', error);
    }
    
    if (this.remaining <= 0) {
      this.clearInterval();
      this.status = 'finished';
      
      try {
        this.callbacks.onStatusChange?.(this.status);
      } catch (error) {
        console.error('Timer onStatusChange callback error:', error);
      }
      
      try {
        this.callbacks.onTimeout();
      } catch (error) {
        console.error('Timer onTimeout callback error:', error);
      }
    }
  }

  /**
   * Clear the interval timer
   */
  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Cleanup method for proper disposal
   */
  destroy(): void {
    this.clearInterval();
    this.status = 'idle';
  }
}

/**
 * Utility function to format time for display
 */
export function formatTime(seconds: number): string {
  if (seconds < 10 && seconds > 0) {
    return seconds.toFixed(1); // Show decimal for final seconds
  }
  return Math.ceil(seconds).toString();
}

/**
 * Utility function to get timer color class
 */
export function getTimerColorClass(timer: Timer): string {
  const colorState = timer.getColorState();
  const isUrgent = timer.isInFinalCountdown();
  
  let classes = [`timer-${colorState}`];
  
  if (isUrgent) {
    classes.push('timer-urgent');
  }
  
  return classes.join(' ');
}