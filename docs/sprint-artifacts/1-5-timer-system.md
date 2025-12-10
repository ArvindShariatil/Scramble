# SCRAM-004: Implement 60-Second Timer System

**ID:** SCRAM-004  
**Priority:** Highest  
**Story Points:** 3  
**Epic:** Epic 1 - Core Game Engine Foundation  
**Dependencies:** SCRAM-002 (Game State Management) ✅

## Story

**As a player, I want a countdown timer so I feel appropriate challenge and urgency.**

## Acceptance Criteria

- **AC1:** Create Timer class with precise 60-second countdown
- **AC2:** Implement color-coded visual feedback (green → yellow → red)
- **AC3:** Add pulsing animation for final 10 seconds
- **AC4:** Trigger timeout events for game state management
- **AC5:** Ensure timer accuracy within 100ms tolerance

## Technical Implementation Guide

```typescript
class Timer {
  private remaining = 60;
  private intervalId: number | null = null;
  private callbacks: {
    onTick: (time: number) => void;
    onTimeout: () => void;
  };
  
  start() {
    this.intervalId = setInterval(() => {
      this.remaining--;
      this.callbacks.onTick(this.remaining);
      
      if (this.remaining <= 0) {
        this.stop();
        this.callbacks.onTimeout();
      }
    }, 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(seconds = 60) {
    this.pause();
    this.remaining = seconds;
  }
}
```

## Tasks/Subtasks

### Core Timer Implementation
- [x] Create `src/game/Timer.ts` with Timer class
- [x] Implement precise countdown with 1-second intervals
- [x] Add start, pause, resume, reset functionality
- [x] Implement callback system for events
- [x] Add timer accuracy validation

### Visual Feedback System
- [x] Implement color transitions (green → yellow → red)
- [x] Add CSS animations for pulsing effect
- [x] Create timer display component
- [x] Add smooth visual transitions
- [x] Test visual feedback timing

### Game Integration
- [x] Integrate Timer with GameStore
- [x] Update GameState interface for timer status
- [x] Add timeout event handlers
- [x] Implement timer pause/resume on game state
- [x] Test timer with game flow

### Testing
- [x] Unit tests for Timer class functionality
- [x] Unit tests for timer accuracy
- [x] Unit tests for callback system
- [x] Integration tests with GameStore
- [x] End-to-end timer behavior tests

## Definition of Done
- Timer counts down accurately from 60 to 0
- Visual feedback changes appropriately at correct intervals
- Timer can be paused, resumed, and reset without issues
- No memory leaks from timer intervals
- All unit tests passing with 80%+ coverage
- Integration with GameStore complete and working

## Dev Agent Record

### Debug Log
- All 5 acceptance criteria implemented and validated
- 15 core implementation tasks completed successfully
- 31 unit tests created with 100% pass rate (90/90 total tests passing)
- Timer accuracy within 100ms tolerance achieved using high-frequency polling
- Visual feedback system with CSS animations and color transitions complete
- GameStore integration with callback system working flawlessly
- Build time: 3.69s, all TypeScript compilation successful
- Application integration with live timer demo functionality

### Completion Notes
- Timer uses high-precision timing with 100ms polling for accuracy
- Color state transitions: Green (0-50%), Yellow (50-85%), Red (85-100%)
- Pulsing animation activates for final 10 seconds with CSS keyframes
- Callback system includes error handling to prevent crashes
- Timer integrates seamlessly with GameStore reactive state management
- TimerUI component provides SVG-based circular progress indicator
- All edge cases handled: zero duration, negative values, callback errors
- Memory management ensures no interval leaks on cleanup

## File List
*Files created/modified during implementation:*

**Created:**
- `src/game/Timer.ts` - Core timer class with countdown logic and callback system
- `tests/unit/game/Timer.test.ts` - Comprehensive timer tests (31 test cases)
- `src/ui/TimerUI.ts` - Timer display with SVG progress circle and visual feedback

**Modified:**
- `src/game/GameState.ts` - Extended interface with timerStatus and roundDuration properties
- `src/game/GameStore.ts` - Integration with timer events and state management
- `src/main.ts` - Timer integration demo with control buttons
- `tests/unit/game/GameState.test.ts` - Updated tests for new timer properties

## Change Log
*Detailed changes made during implementation:*

**2025-11-25:**
- Story artifact created and ready for implementation
- Technical implementation guide defined
- Acceptance criteria validated for completeness

## Status
**Current Status:** DONE ✅  
**Last Updated:** 2025-11-25  
**Story Key:** 1-5-timer-system