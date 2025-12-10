# Sprint Artifact: SCRAM-016 - Display Solution on Timer Timeout

**Epic:** Epic 5 - Enhanced User Experience & Feedback  
**Story:** SCRAM-016  
**Priority:** High  
**Story Points:** 3  
**Status:** 📋 Planned  
**Assignee:** TBD  
**Sprint:** v2.0 (Future Release)

---

## Story Summary

**As a player, I want to see the correct answer when the timer runs out so I can learn from missed opportunities and improve my vocabulary.**

### Current Behavior (Issue)
When the 60-second timer runs out:
- Game immediately skips to the next anagram
- Player never sees what the correct answer was
- Learning opportunity is lost
- Player may feel frustrated not knowing the solution

### Desired Behavior (Solution)
When the 60-second timer runs out:
1. Game pauses and displays "Time's Up!" message
2. Shows the scrambled letters (for reference)
3. Reveals the correct answer prominently
4. Displays category hint or context
5. Shows encouraging message
6. After 3 seconds, automatically proceeds to next anagram
7. Timer resets and new round begins

---

## Business Value

### Learning Enhancement
- **Educational Value:** Players learn vocabulary even when they don't solve in time
- **Retention:** Seeing solutions improves word recognition and memory
- **Reduced Frustration:** Curiosity is satisfied, not left wondering

### Player Engagement
- **Satisfaction:** Players feel they're progressing even on difficult words
- **Motivation:** Encouraging messages keep morale high
- **Completion Rate:** Less likely to quit due to frustration

### Analytics Benefits
- Track which words timeout most frequently
- Identify difficulty spikes in anagram sets
- Understand learning patterns and optimize difficulty curve

---

## Acceptance Criteria

### AC1: Solution Display Trigger
- ✅ When timer reaches 0, game pauses immediately
- ✅ Solution overlay appears within 100ms of timeout
- ✅ Game state transitions to 'timeout-reveal'
- ✅ Timer stops and doesn't continue counting negative

### AC2: Solution Display Duration
- ✅ Solution displays for exactly 3 seconds (±100ms)
- ✅ Display duration is consistent across all browsers
- ✅ Timer accuracy verified through automated tests
- ✅ No premature dismissal or hanging display

### AC3: Educational Context
- ✅ Scrambled letters shown for reference
- ✅ Correct answer displayed in bold, large font
- ✅ Category hint shown (e.g., "Animal: HORSE")
- ✅ Encouraging message displayed (randomized)
- ✅ Visual hierarchy: clear progression from scramble → solution

### AC4: Visual Polish
- ✅ Smooth fade-in animation (300ms)
- ✅ Slide-up effect for content reveal
- ✅ Distinct styling from success/error states
- ✅ Smooth fade-out transition (300ms)
- ✅ No UI flicker or glitches

### AC5: Analytics Tracking
- ✅ Track TIMER_TIMEOUT event with:
  - Scrambled word
  - Correct solution
  - Difficulty level
  - Time spent (always 60s for timeout)
  - Session context
- ✅ Data properly formatted for analytics dashboard
- ✅ Event fires exactly once per timeout

### AC6: Game Flow Integrity
- ✅ Timeout doesn't count as a "skip" (preserves skip counter)
- ✅ Streak counter resets (timeout = incorrect answer)
- ✅ Score remains unchanged (no penalty)
- ✅ Game state remains consistent
- ✅ No duplicate anagrams after timeout

### AC7: Auto-Progression
- ✅ After 3 seconds, overlay automatically dismisses
- ✅ New anagram loads immediately
- ✅ Timer resets to 60 seconds
- ✅ Timer starts automatically for new round
- ✅ Input field is ready for user interaction

### AC8: Accessibility
- ✅ Screen reader announces "Time's up" message
- ✅ Screen reader reads solution with proper context
- ✅ Keyboard users can dismiss early with Escape key (bonus)
- ✅ Color contrast meets WCAG AA standards
- ✅ Focus management works correctly

---

## Technical Implementation

### File Changes Required

#### 1. GameStore.ts
**Location:** `scramble-game/src/game/GameStore.ts`

**Changes:**
```typescript
// Add new game status state
type GameStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'timeout-reveal';

// Update handleTimeout method
private handleTimeout(): void {
  const currentAnagram = this.state.currentAnagram;
  const solution = this.state.solution;
  const anagramData = this.getCurrentAnagramData();
  
  // Update state to timeout-reveal
  this.updateState({
    gameStatus: 'timeout-reveal',
    timerStatus: 'finished'
  });
  
  // Track analytics
  analytics.track(AnalyticsEvent.TIMER_TIMEOUT, {
    scrambled: currentAnagram,
    solution: solution,
    difficulty: this.state.difficulty,
    category: anagramData?.category,
    timeSpent: 60
  });
  
  // Notify UI subscribers
  this.notifySubscribers();
  
  // Auto-proceed after 3 seconds
  setTimeout(() => {
    this.proceedToNextAnagram();
  }, 3000);
}

// Add new method for auto-progression
private proceedToNextAnagram(): void {
  // Reset streak (timeout = incorrect)
  this.updateState({ streak: 0 });
  
  // Generate new anagram
  this.generateNewAnagram();
  
  // Reset and start timer
  this.resetTimer();
  this.startTimer();
  
  // Update state to playing
  this.updateState({ gameStatus: 'playing' });
}

// Helper to get current anagram data
private getCurrentAnagramData(): AnagramSet | undefined {
  return ANAGRAM_SETS[this.state.difficulty]?.find(
    a => a.scrambled === this.state.currentAnagram
  );
}
```

#### 2. GameUI.ts
**Location:** `scramble-game/src/ui/GameUI.ts`

**Changes:**
```typescript
// Add to render method - listen for timeout-reveal state
private setupStateListener(): void {
  this.gameStore.subscribe((state) => {
    if (state.gameStatus === 'timeout-reveal') {
      this.showTimeoutSolution(
        state.currentAnagram,
        state.solution,
        this.getCurrentCategory()
      );
    }
    // ... other state handling
  });
}

// New method to display solution
private showTimeoutSolution(
  scrambled: string, 
  solution: string, 
  category?: string
): void {
  // Play timeout sound
  soundManager.playTimeout();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'solution-overlay timeout-reveal';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('aria-atomic', 'true');
  
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
  
  overlay.innerHTML = `
    <div class="solution-content">
      <h3 class="timeout-header">⏰ Time's Up!</h3>
      <div class="scrambled-reference">
        <span class="label">Scrambled:</span>
        <span class="letters">${scrambled}</span>
      </div>
      <div class="solution-arrow" aria-hidden="true">↓</div>
      <div class="solution-answer">
        <span class="label">Answer:</span>
        <span class="answer-text">${solution}</span>
      </div>
      ${category ? `
        <div class="solution-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">Category: ${category}</span>
        </div>
      ` : ''}
      <p class="encouragement">${randomEncouragement}</p>
      <div class="auto-progress">
        <span class="progress-text">Next puzzle in 3 seconds...</span>
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
    }
  };
  document.addEventListener('keydown', dismissHandler);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    this.dismissSolutionOverlay(overlay);
    document.removeEventListener('keydown', dismissHandler);
  }, 3000);
}

// Helper method for dismissal
private dismissSolutionOverlay(overlay: HTMLElement): void {
  overlay.classList.add('fade-out');
  setTimeout(() => {
    overlay.remove();
  }, 300);
}

// Helper to get category from current anagram
private getCurrentCategory(): string | undefined {
  const state = this.gameStore.getState();
  const anagramData = ANAGRAM_SETS[state.difficulty]?.find(
    a => a.scrambled === state.currentAnagram
  );
  return anagramData?.category;
}
```

#### 3. style.css
**Location:** `scramble-game/src/style.css`

**Add new styles:**
```css
/* ============================================
   TIMEOUT SOLUTION OVERLAY
   ============================================ */

.solution-overlay.timeout-reveal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.solution-overlay.visible {
  opacity: 1;
}

.solution-overlay.fade-out {
  opacity: 0;
}

.solution-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: slideUpBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  color: white;
}

@keyframes slideUpBounce {
  0% {
    transform: translateY(100px) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.timeout-header {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: #ffe66d;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.scrambled-reference {
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.scrambled-reference .label {
  display: block;
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.scrambled-reference .letters {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  font-family: 'Courier New', monospace;
}

.solution-arrow {
  font-size: 2rem;
  margin: 1rem 0;
  opacity: 0.6;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

.solution-answer {
  background: rgba(255, 255, 255, 0.95);
  color: #2d3436;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.solution-answer .label {
  display: block;
  font-size: 0.9rem;
  color: #636e72;
  margin-bottom: 0.5rem;
}

.solution-answer .answer-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #00b894;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  display: block;
  animation: popIn 0.3s ease-out 0.3s backwards;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.solution-hint {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.hint-icon {
  font-size: 1.2rem;
}

.hint-text {
  font-size: 0.95rem;
  font-weight: 500;
}

.encouragement {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0;
  color: #ffe66d;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.auto-progress {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-text {
  display: block;
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.2);
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  background: #ffe66d;
  height: 100%;
  width: 0;
  animation: progressFill 3s linear;
}

@keyframes progressFill {
  to {
    width: 100%;
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .solution-content {
    padding: 2rem 1.5rem;
  }
  
  .timeout-header {
    font-size: 1.5rem;
  }
  
  .solution-answer .answer-text {
    font-size: 2rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .solution-overlay.timeout-reveal {
    background: rgba(0, 0, 0, 0.95);
  }
  
  .solution-content {
    border: 2px solid white;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .solution-content {
    animation: none;
  }
  
  .solution-arrow {
    animation: none;
  }
  
  .progress-fill {
    animation: none;
    width: 100%;
  }
}
```

#### 4. analytics.ts
**Location:** `scramble-game/src/utils/analytics.ts`

**Add new event type:**
```typescript
export enum AnalyticsEvent {
  // ... existing events
  TIMER_TIMEOUT = 'timer_timeout',
  SOLUTION_REVEALED = 'solution_revealed',
  EARLY_DISMISS = 'timeout_solution_dismissed_early'
}
```

#### 5. SoundManager.ts
**Location:** `scramble-game/src/utils/SoundManager.ts`

**Add timeout sound:**
```typescript
// Add new sound effect for timeout
playTimeout(): void {
  if (!this.enabled) return;
  
  // Gentle, not punishing sound
  const oscillator = this.audioContext.createOscillator();
  const gainNode = this.audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(this.audioContext.destination);
  
  oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    200, 
    this.audioContext.currentTime + 0.3
  );
  
  gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01, 
    this.audioContext.currentTime + 0.3
  );
  
  oscillator.start();
  oscillator.stop(this.audioContext.currentTime + 0.3);
}
```

---

## Testing Strategy

### Unit Tests

**File:** `tests/unit/game/GameStore.test.ts`

```typescript
describe('GameStore - Timer Timeout with Solution Display', () => {
  it('should transition to timeout-reveal state when timer expires', () => {
    const store = new GameStore();
    store.startGame();
    
    // Simulate timeout
    jest.advanceTimersByTime(60000);
    
    expect(store.getState().gameStatus).toBe('timeout-reveal');
    expect(store.getState().timerStatus).toBe('finished');
  });
  
  it('should auto-proceed to next anagram after 3 seconds', async () => {
    const store = new GameStore();
    const initialAnagram = store.getState().currentAnagram;
    
    store.startGame();
    jest.advanceTimersByTime(60000); // Trigger timeout
    jest.advanceTimersByTime(3000);  // Wait for auto-proceed
    
    expect(store.getState().currentAnagram).not.toBe(initialAnagram);
    expect(store.getState().gameStatus).toBe('playing');
  });
  
  it('should reset streak on timeout', () => {
    const store = new GameStore();
    store.updateState({ streak: 5 });
    
    store.startGame();
    jest.advanceTimersByTime(60000); // Trigger timeout
    jest.advanceTimersByTime(3000);  // Auto-proceed
    
    expect(store.getState().streak).toBe(0);
  });
  
  it('should not count timeout as a skip', () => {
    const store = new GameStore();
    const initialSkipCount = store.getSkipCount();
    
    store.startGame();
    jest.advanceTimersByTime(60000); // Trigger timeout
    
    expect(store.getSkipCount()).toBe(initialSkipCount);
  });
});
```

### Integration Tests

**File:** `tests/integration/timeout-flow.test.ts`

```typescript
describe('Timeout Solution Display - Integration', () => {
  it('should display solution overlay when timer expires', async () => {
    const { gameUI } = setupGame();
    
    // Wait for timeout
    await waitFor(() => {
      expect(screen.getByText(/Time's Up!/i)).toBeInTheDocument();
    }, { timeout: 61000 });
    
    // Check solution is displayed
    expect(screen.getByText(/Answer:/i)).toBeInTheDocument();
  });
  
  it('should auto-dismiss after 3 seconds and load new anagram', async () => {
    const { gameUI } = setupGame();
    
    await waitFor(() => {
      expect(screen.getByText(/Time's Up!/i)).toBeInTheDocument();
    }, { timeout: 61000 });
    
    // Wait for auto-dismiss
    await waitFor(() => {
      expect(screen.queryByText(/Time's Up!/i)).not.toBeInTheDocument();
    }, { timeout: 3500 });
    
    // New anagram should be loaded
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
```

### Accessibility Tests

```typescript
describe('Timeout Solution - Accessibility', () => {
  it('should announce timeout to screen readers', async () => {
    render(<GameUI />);
    
    await waitForTimeout();
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent(/Time's Up!/i);
  });
  
  it('should be dismissible with Escape key', async () => {
    render(<GameUI />);
    
    await waitForTimeout();
    expect(screen.getByText(/Time's Up!/i)).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText(/Time's Up!/i)).not.toBeInTheDocument();
    });
  });
});
```

---

## User Stories & Scenarios

### Scenario 1: Beginner Learning
**User:** Sarah, new player  
**Context:** First time playing, struggling with 5-letter word  

**Flow:**
1. Sarah tries different combinations for "SROHE"
2. Timer reaches 10 seconds - she feels pressure
3. Timer expires at 0
4. "Time's Up!" overlay appears
5. She sees: SROHE → HORSE with "Animal" category
6. "Keep going! You've got this! 💪" encourages her
7. After 3 seconds, new puzzle appears
8. She now knows HORSE and feels less frustrated

**Outcome:** ✅ Learning achieved, motivation maintained

### Scenario 2: Experienced Player Pattern Learning
**User:** Mike, regular player  
**Context:** Playing medium difficulty, hitting timeout occasionally  

**Flow:**
1. Mike encounters difficult anagram
2. Timeout occurs on "THGIR"
3. Solution reveals: RIGHT
4. Mike recognizes pattern (IGHT words)
5. Uses this knowledge for future puzzles
6. Timeout rate decreases over time

**Outcome:** ✅ Pattern recognition improved, skill development

### Scenario 3: Accessibility User
**User:** Jane, screen reader user  
**Context:** Using NVDA screen reader  

**Flow:**
1. Timer expires
2. Screen reader announces "Alert: Time's Up!"
3. Screen reader reads "Scrambled: SROHE"
4. Screen reader reads "Answer: HORSE"
5. Screen reader reads "Category: Animal"
6. Jane hears encouragement message
7. She presses Escape to proceed early if desired

**Outcome:** ✅ Full experience accessible, no barriers

---

## Analytics & Metrics

### Events to Track

```typescript
// Timeout event
{
  event: 'timer_timeout',
  scrambled: 'SROHE',
  solution: 'HORSE',
  difficulty: 2,
  category: 'animals',
  timeSpent: 60,
  sessionId: 'uuid',
  timestamp: 1234567890
}

// Early dismissal
{
  event: 'timeout_solution_dismissed_early',
  timeShown: 1.2, // seconds
  method: 'escape_key',
  sessionId: 'uuid'
}
```

### KPIs to Monitor

1. **Timeout Rate**
   - Target: <30% of total puzzles
   - Measure: timeouts / total_puzzles
   - Action: If >40%, review difficulty curve

2. **Solution View Duration**
   - Target: 85%+ views complete 3 seconds
   - Measure: avg_view_duration
   - Action: If <2s average, investigate early dismissals

3. **Learning Effectiveness**
   - Target: 15%+ improvement on repeated timeout words
   - Measure: success_rate_after_timeout_exposure
   - Action: Validate educational hypothesis

4. **User Satisfaction**
   - Target: Net Promoter Score increase
   - Measure: survey_responses
   - Action: Gather qualitative feedback

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timer accuracy drift | Low | Medium | Use high-precision timing, test extensively |
| Memory leak from timeouts | Low | High | Implement cleanup, use weak references |
| Animation performance | Medium | Low | Use CSS animations, test on low-end devices |
| State inconsistency | Low | High | Add state validation, comprehensive testing |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 3s feels too long | Medium | Medium | Make configurable, gather user feedback |
| Overlay blocks UI | Low | High | Ensure clean state, test thoroughly |
| Encouragement feels patronizing | Low | Low | Test messaging with users, provide variety |

---

## Rollout Strategy

### Phase 1: Development (Week 1)
- Day 1-2: Implement core timeout handling
- Day 3-4: Build solution overlay UI
- Day 5: Add analytics and testing

### Phase 2: Testing (Week 2)
- Unit tests (80%+ coverage target)
- Integration tests
- Accessibility audit
- Cross-browser testing
- User acceptance testing (5+ testers)

### Phase 3: Beta Release (Week 3)
- Deploy to 10% of users
- Monitor analytics closely
- Gather feedback
- Fix any issues

### Phase 4: Full Release (Week 4)
- Deploy to all users
- Monitor performance
- Iterate based on data

---

## Success Criteria

### Must Have ✅
- [ ] Solution displays when timer expires
- [ ] 3-second duration accurate
- [ ] Auto-progression works reliably
- [ ] Analytics tracking functional
- [ ] Accessibility compliant (WCAG AA)
- [ ] No performance degradation
- [ ] All unit tests passing

### Should Have 🎯
- [ ] Early dismissal with Escape key
- [ ] Smooth animations
- [ ] Encouraging messages
- [ ] Category hints displayed
- [ ] Progress indicator shown

### Nice to Have 💡
- [ ] Sound effect for timeout
- [ ] Configurable display duration
- [ ] "Learn More" button (future)
- [ ] Word definition display (future)

---

## Dependencies

### Blocking Dependencies
- None (all required systems implemented in Epic 1)

### Related Stories
- SCRAM-004: Timer System (dependency)
- SCRAM-012: Skip Functionality (related)
- SCRAM-014: Analytics (integration point)

### External Dependencies
- None

---

## Documentation Updates

### Files to Update
1. `README.md` - Add feature description
2. `UI-FINAL-STATE.md` - Document solution overlay
3. `architecture.md` - Update state machine diagram
4. `prd.md` - Update feature list

### User-Facing Documentation
- Add "How It Works" section explaining timeout behavior
- Update FAQ with timeout questions
- Add screenshot of solution overlay

---

## Team Notes

### Questions for Stakeholders
- Q: Is 3 seconds the right duration? Should it be configurable?
- Q: Should we add word definitions in the solution display?
- Q: Do we want A/B test different encouragement message styles?

### Developer Notes
- Keep solution display logic separate from skip logic
- Consider extracting overlay component for reuse
- Monitor performance on mobile devices
- Test with various word lengths (4-11 letters)

### Design Notes
- Ensure overlay is visually distinct from other modals
- Use brand colors consistently
- Consider dark mode support
- Test color contrast ratios

---

**Status:** Ready for Development Approval  
**Next Step:** Schedule sprint planning meeting  
**Estimated Completion:** 1 sprint (2 weeks with testing)
