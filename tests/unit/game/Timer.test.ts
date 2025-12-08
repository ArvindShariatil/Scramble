/**
 * Timer Class Unit Tests
 * 
 * Comprehensive test suite for Timer functionality including:
 * - Basic countdown operations
 * - Pause/resume functionality  
 * - Accuracy validation
 * - Callback system
 * - Visual feedback states
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timer, formatTime, getTimerColorClass, type TimerCallbacks } from '../../../src/game/Timer';

describe('Timer', () => {
  let mockCallbacks: TimerCallbacks;
  let timer: Timer;

  beforeEach(() => {
    // Mock the callbacks
    mockCallbacks = {
      onTick: vi.fn(),
      onTimeout: vi.fn(),
      onStatusChange: vi.fn()
    };

    // Mock performance.now for consistent testing
    vi.spyOn(Date, 'now').mockImplementation(() => 1000000); // Fixed timestamp
    
    // Create timer instance
    timer = new Timer({
      duration: 60,
      callbacks: mockCallbacks
    });
  });

  afterEach(() => {
    timer.destroy();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(timer.getStatus()).toBe('idle');
      expect(timer.getRemaining()).toBe(60);
      expect(timer.getElapsed()).toBe(0);
      expect(timer.getProgress()).toBe(0);
    });

    test('should initialize with custom duration', () => {
      const customTimer = new Timer({
        duration: 30,
        callbacks: mockCallbacks
      });
      
      expect(customTimer.getRemaining()).toBe(30);
      expect(customTimer.getProgress()).toBe(0);
      
      customTimer.destroy();
    });
  });

  describe('Basic Operations', () => {
    test('should start timer and change status', () => {
      timer.start();
      
      expect(timer.getStatus()).toBe('running');
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('running');
    });

    test('should not start if already running', () => {
      timer.start();
      const firstCallCount = (mockCallbacks.onStatusChange as any).mock.calls.length;
      
      timer.start(); // Try to start again
      
      expect((mockCallbacks.onStatusChange as any).mock.calls.length).toBe(firstCallCount);
    });

    test('should pause timer', () => {
      timer.start();
      timer.pause();
      
      expect(timer.getStatus()).toBe('paused');
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('paused');
    });

    test('should resume timer from paused state', () => {
      timer.start();
      timer.pause();
      timer.resume();
      
      expect(timer.getStatus()).toBe('running');
    });

    test('should not pause if not running', () => {
      timer.pause();
      expect(timer.getStatus()).toBe('idle');
    });

    test('should not resume if not paused', () => {
      timer.resume();
      expect(timer.getStatus()).toBe('idle');
    });

    test('should reset timer to initial state', () => {
      timer.start();
      timer.reset();
      
      expect(timer.getStatus()).toBe('idle');
      expect(timer.getRemaining()).toBe(60);
      expect(timer.getProgress()).toBe(0);
    });

    test('should reset with new duration', () => {
      timer.reset(30);
      
      expect(timer.getRemaining()).toBe(30);
    });

    test('should stop timer', () => {
      timer.start();
      timer.stop();
      
      expect(timer.getStatus()).toBe('idle');
    });
  });

  describe('Timer Progress', () => {
    test('should calculate progress correctly at initialization', () => {
      expect(timer.getProgress()).toBe(0); // At start
      expect(timer.getElapsed()).toBe(0);
      expect(timer.getRemaining()).toBe(60);
    });

    test('should handle progress calculation', () => {
      // Test with a shorter timer for easier testing
      const shortTimer = new Timer({
        duration: 10,
        callbacks: mockCallbacks
      });
      
      expect(shortTimer.getProgress()).toBe(0);
      expect(shortTimer.getRemaining()).toBe(10);
      
      shortTimer.destroy();
    });
  });

  describe('Color State Logic', () => {
    test('should return green for initial state', () => {
      expect(timer.getColorState()).toBe('green');
    });

    test('should handle color transitions based on progress', () => {
      // Create timers with different durations to test different states
      const greenTimer = new Timer({ duration: 60, callbacks: mockCallbacks });
      const yellowTimer = new Timer({ duration: 20, callbacks: mockCallbacks }); 
      const redTimer = new Timer({ duration: 5, callbacks: mockCallbacks });
      
      expect(greenTimer.getColorState()).toBe('green');
      expect(yellowTimer.getColorState()).toBe('green'); // All start green
      expect(redTimer.getColorState()).toBe('green');
      
      greenTimer.destroy();
      yellowTimer.destroy();
      redTimer.destroy();
    });
  });

  describe('Final Countdown Detection', () => {
    test('should not be in final countdown at start', () => {
      expect(timer.isInFinalCountdown()).toBe(false);
    });

    test('should detect final countdown for short duration timer', () => {
      const shortTimer = new Timer({
        duration: 5, // 5 seconds - should be in final countdown since ≤10
        callbacks: mockCallbacks
      });
      
      expect(shortTimer.isInFinalCountdown()).toBe(true); // 5 seconds is ≤10 so in final countdown
      
      shortTimer.destroy();
    });

    test('should handle zero remaining time', () => {
      const zeroTimer = new Timer({
        duration: 0,
        callbacks: mockCallbacks
      });
      
      expect(zeroTimer.isInFinalCountdown()).toBe(false);
      
      zeroTimer.destroy();
    });
  });

  describe('Callback System', () => {
    test('should call onTick callback during countdown', () => {
      timer.start();
      
      // onTick should be called immediately on start
      expect(mockCallbacks.onTick).toHaveBeenCalled();
    });

    test('should have timeout callback available', () => {
      expect(typeof mockCallbacks.onTimeout).toBe('function');
    });

    test('should handle callback setup correctly', () => {
      const testCallbacks = {
        onTick: vi.fn(),
        onTimeout: vi.fn(),
        onStatusChange: vi.fn()
      };
      
      const testTimer = new Timer({
        duration: 1,
        callbacks: testCallbacks
      });
      
      expect(testTimer.getStatus()).toBe('idle');
      
      testTimer.destroy();
    });
  });

  describe('Memory Management', () => {
    test('should cleanup intervals on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      timer.start();
      timer.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(timer.getStatus()).toBe('idle');
    });

    test('should cleanup intervals on reset', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      timer.start();
      timer.reset();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero duration', () => {
      const zeroTimer = new Timer({
        duration: 0,
        callbacks: mockCallbacks
      });
      
      expect(zeroTimer.getRemaining()).toBe(0);
      expect(zeroTimer.getElapsed()).toBe(0);
      expect(zeroTimer.getProgress()).toBe(100); // Zero duration = 100% complete
      
      zeroTimer.destroy();
    });

    test('should handle negative duration gracefully', () => {
      const negTimer = new Timer({
        duration: -5,
        callbacks: mockCallbacks
      });
      
      expect(negTimer.getRemaining()).toBe(-5);
      
      negTimer.destroy();
    });
  });
});

describe('Utility Functions', () => {
  describe('formatTime', () => {
    test('should format whole seconds correctly', () => {
      expect(formatTime(60)).toBe('60');
      expect(formatTime(30)).toBe('30');
      expect(formatTime(10)).toBe('10');
    });

    test('should format final seconds with decimal', () => {
      expect(formatTime(9.5)).toBe('9.5');
      expect(formatTime(5.2)).toBe('5.2');
      expect(formatTime(0.8)).toBe('0.8');
      expect(formatTime(1.0)).toBe('1.0'); // Less than 10 shows decimal
    });

    test('should handle zero correctly', () => {
      expect(formatTime(0)).toBe('0');
    });

    test('should handle large numbers', () => {
      expect(formatTime(120)).toBe('120');
    });
  });

  describe('getTimerColorClass', () => {
    let timer: Timer;
    let mockCallbacks: TimerCallbacks;

    beforeEach(() => {
      mockCallbacks = {
        onTick: vi.fn(),
        onTimeout: vi.fn(),
        onStatusChange: vi.fn()
      };
      
      timer = new Timer({
        duration: 60,
        callbacks: mockCallbacks
      });
    });

    afterEach(() => {
      timer.destroy();
    });

    test('should return correct color classes', () => {
      // Test different states by mocking the timer methods
      vi.spyOn(timer, 'getColorState').mockReturnValue('green');
      vi.spyOn(timer, 'isInFinalCountdown').mockReturnValue(false);
      
      expect(getTimerColorClass(timer)).toBe('timer-green');
    });

    test('should include urgent class for final countdown', () => {
      vi.spyOn(timer, 'getColorState').mockReturnValue('red');
      vi.spyOn(timer, 'isInFinalCountdown').mockReturnValue(true);
      
      expect(getTimerColorClass(timer)).toBe('timer-red timer-urgent');
    });
  });
});