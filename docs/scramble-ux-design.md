# Scramble UX Design Specification
**Author:** Sally (UX Designer)  
**Date:** 2025-11-25  
**Project:** Scramble Anagram Game  
**Version:** 1.0 - Calm Playground Experience

---

## Design Vision

**Emotional Goal:** Calm focus with playful curiosity  
**Visual Style:** Pastel relaxation, minimal UI, breathing room  
**User Philosophy:** Interface becomes invisible, word discovery shines

---

## Color Palette - "Calm Playground"

### Primary Colors
- **Sage Green:** `#B8D4C2` - Primary brand, calm focus state
- **Warm Cream:** `#F7F3E9` - Background, non-competing canvas  
- **Soft White:** `#FEFEFE` - Input fields, cards, clean contrast

### Accent Colors  
- **Muted Coral:** `#E8A598` - Success states, gentle celebration
- **Dusty Blue:** `#A8B8C8` - Secondary actions, subtle information
- **Gentle Gray:** `#8B9196` - Text secondary, borders

### Timer Progression (Emotional Arc)
- **60-40s:** Sage Green `#B8D4C2` - "You've got time, think clearly"
- **40-15s:** Soft Amber `#E8C078` - "Gentle focus now" 
- **15-0s:** Warm Rose `#D4A5A5` - "Focused urgency" (never harsh red)

---

## Typography Scale

### Primary Font
**Inter** (Google Fonts) - Clean, readable, works across all sizes
- **Display (Scrambled Letters):** 32px-48px, font-weight: 600
- **Body (Input, UI):** 16px-18px, font-weight: 400  
- **Caption (Counter, Timer):** 14px, font-weight: 500

### Accessibility Requirements
- Minimum contrast ratio: 4.5:1 for all text
- Scalable from 12px to 24px without breaking layout
- Dyslexia-friendly letter spacing: +0.02em

---

## SCRAM-009: Responsive Game Layout

### Design Philosophy: "Calm Playground Structure"

The layout should feel like a peaceful workspace where the mind can play with letters. Every element has intentional placement and generous breathing room.

### Visual Hierarchy (Priority Order)
1. **Scrambled Letters** - The puzzle (primary focus)
2. **Input Field** - The canvas for solutions  
3. **Timer/Score** - Contextual information (present but not intrusive)
4. **Actions** - Support tools (accessible but secondary)

### Layout Grid System

#### Mobile (375px - 768px)
```
┌─────────────────────┐
│    Scrambled        │ ← Hero area, 40% height
│     LETTERS         │
├─────────────────────┤  
│   Input Field       │ ← Natural focus, 20% height
├─────────────────────┤
│ Timer  │   Score    │ ← Split info, 15% height  
├─────────────────────┤
│ Submit │   Skip     │ ← Action buttons, 15% height
├─────────────────────┤
│     Gentle          │ ← Breathing room, 10%
└─────────────────────┘
```

#### Tablet/Desktop (768px+)
```
┌───────────────────────────────┐
│        Scrambled Letters      │ ← Centered hero
│          (Larger)             │
├─────────────┬─────────────────┤
│ Input Field │ Timer   Score   │ ← Side-by-side efficiency  
├─────────────┼─────────────────┤
│Submit  Skip │   Hints/Stats   │ ← Expanded actions
└─────────────┴─────────────────┘
```

### Component Specifications

#### Scrambled Letters Display
- **Background:** Soft card with subtle shadow `box-shadow: 0 2px 8px rgba(184, 212, 194, 0.15)`
- **Letter Styling:** Individual letter boxes with gentle borders
- **Spacing:** 8px between letters, generous padding (24px vertical)
- **Animation:** Subtle fade-in when new anagram loads (300ms ease)

```css
.scrambled-container {
  background: var(--soft-white);
  border-radius: 16px;
  padding: 24px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(184, 212, 194, 0.15);
}

.letter-box {
  display: inline-block;
  background: var(--warm-cream);
  border: 1px solid var(--dusty-blue);
  border-radius: 8px;
  padding: 12px;
  margin: 4px;
  font-size: 24px;
  font-weight: 600;
  color: var(--gentle-gray);
  min-width: 48px;
  text-align: center;
}
```

#### Responsive Breakpoints
- **Mobile:** 375px - 767px (single column, stacked)
- **Tablet:** 768px - 1023px (hybrid layout)  
- **Desktop:** 1024px+ (side-by-side efficiency)

#### Touch Targets (Accessibility)
- All interactive elements minimum 44x44px
- Adequate spacing between tap targets (8px minimum)
- Clear visual feedback on hover/tap states

### Dark Mode Considerations

#### Dark Palette  
- **Background:** `#1A1B1E` - Deep charcoal
- **Cards:** `#252629` - Elevated surfaces
- **Text Primary:** `#E8E9EA` - High contrast
- **Sage Green Dark:** `#8FA99C` - Adjusted for contrast
- **Accent adjustments:** Slightly brighter for visibility

#### Implementation Strategy
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1A1B1E;
    --card-bg: #252629;
    --text-primary: #E8E9EA;
    --sage-green: #8FA99C;
  }
}
```

### Success Metrics
- **Layout loads in <100ms** (perceived performance)
- **No horizontal scrolling** at any supported width
- **Touch targets meet accessibility guidelines** (44px minimum)  
- **Theme switch works** without page reload
- **Responsive breakpoints feel natural** (no awkward in-between states)

---

## Design Rationale

### Why This Layout Works for Anagram Solving

1. **Cognitive Load Management:** Single focus point reduces mental overhead
2. **Visual Flow:** Eyes naturally move from puzzle → input → context → actions  
3. **Spatial Memory:** Consistent positioning builds user confidence
4. **Breathing Room:** Generous spacing reduces visual stress during thinking
5. **Accessibility First:** High contrast, large touch targets, scalable text

### Emotional Design Decisions

- **Soft shadows instead of hard borders** - Creates depth without aggression
- **Rounded corners throughout** - Feels approachable, not corporate
- **Gentle color transitions** - Timer progression feels natural, not alarming
- **Generous padding** - Interface doesn't feel cramped or rushed
- **Subtle animations** - Enhance feedback without distraction

---

## SCRAM-010: Text Input with Real-time Feedback

### Design Philosophy: "Extension of Thought"

The input field is where mind meets game - it should feel like the most natural thing in the world. When inspiration strikes, fingers should flow without friction.

### Emotional Journey Mapping

#### The Discovery Moment
- **Player sees:** "AERT" scrambled
- **Mind sparks:** "Wait... TEAR!"
- **Fingers move:** Natural, confident typing
- **Interface responds:** "Yes! Keep going!"

#### The Feedback Loop
1. **Type 'T'** → Character count updates: "1/4 letters"
2. **Type 'E'** → Gentle visual confirmation
3. **Type 'A'** → Getting close feedback
4. **Type 'R'** → Auto-validation fires OR submit ready

### Input Field Specifications

#### Visual Design
```css
.answer-input {
  /* Base styling - feels like premium paper */
  background: var(--soft-white);
  border: 2px solid var(--sage-green);
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 20px;
  font-weight: 500;
  color: var(--gentle-gray);
  
  /* Generous sizing */
  width: 100%;
  max-width: 320px;
  min-height: 56px;
  
  /* Subtle depth */
  box-shadow: 0 2px 4px rgba(184, 212, 194, 0.08);
  transition: all 200ms ease;
}

.answer-input:focus {
  outline: none;
  border-color: var(--muted-coral);
  box-shadow: 0 4px 12px rgba(232, 165, 152, 0.15);
  transform: translateY(-1px);
}
```

#### Auto-Focus Behavior
- **On page load:** Input automatically focused
- **On new anagram:** Input cleared and re-focused
- **On mobile:** Keyboard appears immediately (no extra tap)

#### Real-time Feedback System

##### Character Counter
```html
<div class="input-feedback">
  <span class="char-count">3/5 letters</span>
  <span class="validation-hint">Keep going!</span>
</div>
```

##### Visual Feedback States
1. **Empty state:** Gentle placeholder "Type your answer..."
2. **Typing state:** Character count updates live
3. **Near complete:** "Almost there!" encouragement
4. **Complete length:** Auto-submit OR ready-to-submit highlight
5. **Validation success:** Gentle green glow + success message
6. **Validation error:** Soft amber border + helpful hint

##### Progress Visualization
```css
.input-progress {
  height: 3px;
  background: var(--warm-cream);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.input-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--sage-green), var(--muted-coral));
  width: 0%;
  transition: width 150ms ease;
  border-radius: 2px;
}
```

### Interaction Patterns

#### Keyboard Behavior
- **Enter key:** Submit answer (if length matches)
- **Escape key:** Clear input field
- **Backspace:** Normal deletion with gentle animation
- **Auto-complete:** When exact letter count reached

#### Touch/Mobile Optimizations
- **Large touch target:** 56px minimum height
- **Keyboard type:** Standard (not numeric) for letters
- **Zoom prevention:** `font-size: 16px` minimum
- **Haptic feedback:** Gentle vibration on success (iOS/Android)

#### Submit Button Coordination
```html
<div class="input-actions">
  <button class="submit-btn" :disabled="!canSubmit">
    Submit
  </button>
  <button class="clear-btn" @click="clearInput">
    Clear
  </button>
</div>
```

### Accessibility Features

#### Screen Reader Support
```html
<label for="answer-input" class="sr-only">
  Enter your anagram solution using all {{letterCount}} letters
</label>
<input 
  id="answer-input"
  aria-describedby="char-count validation-message"
  aria-live="polite"
  autocomplete="off"
  spellcheck="false"
/>
<div id="char-count" aria-live="polite">
  {{currentLength}} of {{requiredLength}} letters entered
</div>
```

#### Keyboard Navigation
- **Tab order:** Input → Submit → Clear → Skip
- **Focus indicators:** Clear visual outline (not browser default)
- **Keyboard shortcuts:** Alt+C for clear, Alt+S for submit

### Validation Integration

#### Letter Validation (Real-time)
```typescript
class InputValidator {
  validateLetterUsage(input: string, scrambledLetters: string): ValidationResult {
    const inputLetters = input.toLowerCase().split('').sort();
    const scrambledSorted = scrambledLetters.toLowerCase().split('').sort();
    
    // Check if using only available letters
    const usesOnlyAvailable = inputLetters.every(letter => 
      scrambledSorted.includes(letter)
    );
    
    // Check if uses each letter exactly once
    const usesCorrectCount = input.length <= scrambledLetters.length;
    
    return {
      valid: usesOnlyAvailable && usesCorrectCount,
      feedback: this.generateFeedback(input, scrambledLetters)
    };
  }
  
  generateFeedback(input: string, scrambled: string): string {
    if (input.length === 0) return "Type your answer...";
    if (input.length < scrambled.length) return `${input.length}/${scrambled.length} letters`;
    if (input.length === scrambled.length) return "Ready to submit!";
    return "Using too many letters";
  }
}
```

#### API Integration Feedback
- **Validating state:** Subtle loading indicator
- **API unavailable:** "Continue anyway" message (friendly, not alarming)
- **Word not found:** "Try another combination" (encouraging)
- **Success:** Gentle celebration + score display

### Error Handling (Gentle Guidance)

#### Common Error States
1. **Wrong letters used:** "Use only the letters shown above"
2. **Too many letters:** "Use exactly {{count}} letters"  
3. **Invalid word:** "That's not a word I recognize - try another!"
4. **API error:** "Dictionary unavailable, but your word counts!"

#### Error Styling (Never Harsh)
```css
.input-error {
  border-color: var(--dusty-blue); /* Not red! */
  background: linear-gradient(145deg, #fff, #faf9f7);
}

.error-message {
  color: var(--gentle-gray);
  font-size: 14px;
  margin-top: 4px;
  animation: gentle-fade-in 200ms ease;
}
```

### Performance Considerations

#### Debounced Validation
- **Real-time typing:** No API calls until pause (300ms)
- **Letter validation:** Instant (local check)
- **Word validation:** Debounced + cached results

#### Animation Performance
- **60fps interactions:** CSS transforms over position changes
- **Hardware acceleration:** `transform3d(0,0,0)` for smooth motion
- **Reduced motion respect:** `@media (prefers-reduced-motion: reduce)`

### Success Metrics for SCRAM-010

#### User Experience Metrics
- **Time to first keystroke:** <500ms after anagram display
- **Input responsiveness:** <50ms visual feedback
- **Validation accuracy:** 99%+ correct letter usage detection
- **Error recovery:** Clear path back to success state

#### Accessibility Compliance
- **WCAG 2.1 AA compliance:** All keyboard navigation works
- **Screen reader compatibility:** Proper ARIA labels and live regions
- **Color contrast:** 4.5:1+ for all text elements
- **Touch accessibility:** 44px minimum targets

---

## Design Rationale: Why This Input Design Works

### Psychological Principles
1. **Immediate feedback loop** - Brain gets instant validation
2. **Progressive disclosure** - Information appears when needed
3. **Forgiving errors** - Mistakes feel recoverable, not punishing
4. **Flow state support** - No friction between thought and action

### Anagram-Specific Optimizations
1. **Letter awareness** - Always know which letters are available
2. **Length guidance** - Visual progress toward completion
3. **Mistake prevention** - Can't use unavailable letters
4. **Confidence building** - Positive reinforcement throughout

The input field becomes invisible - just a conduit between the "aha!" moment and the satisfaction of a solved puzzle.

---

## SCRAM-011: Timer Visualization

### Design Philosophy: "Gentle Heartbeat"

The timer is the pulse of our game - it should energize without alarming, create urgency without panic. Like a meditation app's breathing circle, it guides rhythm rather than demanding speed.

### Emotional Journey Through Time

#### The Opening (60-40 seconds)
- **Feeling:** "I have space to think"
- **Visual:** Sage green, calm presence
- **Message:** "Explore, no pressure"

#### The Focus (40-15 seconds)  
- **Feeling:** "Time to get serious, but I'm in control"
- **Visual:** Warm amber, gentle shift
- **Message:** "Focus your energy now"

#### The Flow (15-0 seconds)
- **Feeling:** "Energized urgency, not panic"
- **Visual:** Warm rose with subtle pulse
- **Message:** "You can do this!"

### Timer Component Design

#### Circular Progress Ring
The heart of our timer - a breathing circle that shows time as life, not death.

```css
.timer-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 16px auto;
}

.timer-circle {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* Start from top */
}

.timer-background {
  fill: none;
  stroke: var(--warm-cream);
  stroke-width: 8;
  opacity: 0.3;
}

.timer-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke 1s ease, stroke-dasharray 1s ease;
  filter: drop-shadow(0 2px 4px rgba(184, 212, 194, 0.2));
}

/* Time-based color transitions */
.timer-progress.calm {
  stroke: var(--sage-green); /* 60-40s */
}

.timer-progress.focused {
  stroke: var(--soft-amber); /* 40-15s */
}

.timer-progress.energized {
  stroke: var(--warm-rose); /* 15-0s */
  animation: gentle-pulse 2s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%, 100% { 
    stroke-width: 8;
    filter: drop-shadow(0 2px 4px rgba(212, 165, 165, 0.2));
  }
  50% { 
    stroke-width: 10;
    filter: drop-shadow(0 3px 8px rgba(212, 165, 165, 0.4));
  }
}
```

#### Numeric Display (Central Focus)
```css
.timer-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 600;
  color: var(--gentle-gray);
  transition: all 0.3s ease;
}

.timer-number.energized {
  font-size: 32px;
  color: var(--warm-rose);
  text-shadow: 0 1px 3px rgba(212, 165, 165, 0.3);
}
```

#### Progress Calculation
```typescript
class TimerVisualization {
  private radius = 54; // For 120px container
  private circumference = 2 * Math.PI * this.radius;
  
  updateProgress(timeRemaining: number, totalTime: number = 60) {
    const progress = timeRemaining / totalTime;
    const strokeDasharray = `${progress * this.circumference} ${this.circumference}`;
    
    // Update progress ring
    this.progressRing.style.strokeDasharray = strokeDasharray;
    
    // Update color state
    this.updateColorState(timeRemaining);
    
    // Update numeric display
    this.numberDisplay.textContent = timeRemaining.toString();
    
    // Handle pulsing for final seconds
    if (timeRemaining <= 10) {
      this.addFinalCountdownEffects(timeRemaining);
    }
  }
  
  updateColorState(timeRemaining: number) {
    const element = this.progressRing;
    
    // Remove all state classes
    element.classList.remove('calm', 'focused', 'energized');
    
    // Add appropriate state
    if (timeRemaining > 40) {
      element.classList.add('calm');
    } else if (timeRemaining > 15) {
      element.classList.add('focused');  
    } else {
      element.classList.add('energized');
    }
  }
}
```

### Secondary Timer Elements

#### Time Remaining Label
```html
<div class="timer-label">
  <span class="time-remaining">{{timeRemaining}}</span>
  <span class="time-unit">seconds</span>
</div>
```

#### Progress Phases Indicator (Optional)
Small visual cues that show the emotional journey:

```css
.timer-phases {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--warm-cream);
  transition: all 0.3s ease;
}

.phase-dot.active {
  transform: scale(1.2);
}

.phase-dot.calm { background: var(--sage-green); }
.phase-dot.focused { background: var(--soft-amber); }  
.phase-dot.energized { background: var(--warm-rose); }
```

### Mobile Haptic Feedback

#### Gentle Vibration Patterns
```typescript
class HapticFeedback {
  private vibrationSupported = 'vibrate' in navigator;
  
  timePhaseTransition(phase: 'calm' | 'focused' | 'energized') {
    if (!this.vibrationSupported) return;
    
    switch (phase) {
      case 'focused': // 40s mark
        navigator.vibrate([50]); // Single gentle tap
        break;
      case 'energized': // 15s mark  
        navigator.vibrate([50, 100, 50]); // Gentle double tap
        break;
    }
  }
  
  finalCountdown(secondsRemaining: number) {
    if (!this.vibrationSupported) return;
    
    if ([10, 5].includes(secondsRemaining)) {
      navigator.vibrate([30]); // Very gentle reminder
    }
    
    if (secondsRemaining === 0) {
      navigator.vibrate([100, 50, 100]); // Time's up (gentle)
    }
  }
}
```

### Final 10 Seconds: Enhanced Urgency

#### Pulsing Animation (Subtle)
```css
@keyframes final-countdown {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1);
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.timer-number.final-countdown {
  animation: final-countdown 1s ease-in-out infinite;
}
```

#### Background Atmosphere (Very Subtle)
```css
.timer-container.final-countdown::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(
    circle,
    rgba(212, 165, 165, 0.1) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: gentle-glow 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes gentle-glow {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.3; }
}
```

### Accessibility Considerations

#### Screen Reader Support
```html
<div class="timer-container" role="timer" aria-live="polite">
  <div aria-label="Time remaining: {{timeRemaining}} seconds">
    <!-- Visual timer components -->
  </div>
  <div class="sr-only" id="timer-status">
    {{timePhaseMessage}}
  </div>
</div>
```

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .timer-progress,
  .timer-number,
  .phase-dot {
    animation: none !important;
    transition: none !important;
  }
  
  /* Static color changes only */
  .timer-progress.energized {
    stroke-width: 8; /* No pulsing */
  }
}
```

#### Color Blind Accessibility
- **Shape indicators:** Progress ring + numeric display (not color-only)
- **Pattern alternatives:** Different stroke patterns for each phase
- **High contrast mode support:** Enhanced borders and text

### Responsive Behavior

#### Mobile (375px - 767px)
```css
@media (max-width: 767px) {
  .timer-container {
    width: 100px;
    height: 100px;
  }
  
  .timer-number {
    font-size: 24px;
  }
  
  .timer-progress {
    stroke-width: 6;
  }
}
```

#### Desktop Integration
- Position in layout corner (not competing with main focus)
- Hover states for additional information
- Optional: Mini-timer in browser tab title

### Performance Optimization

#### Efficient Updates
```typescript
class PerformantTimer {
  private animationFrame: number | null = null;
  
  startTimer() {
    const updateLoop = (timestamp: number) => {
      this.updateVisualState();
      
      if (this.isRunning) {
        this.animationFrame = requestAnimationFrame(updateLoop);
      }
    };
    
    this.animationFrame = requestAnimationFrame(updateLoop);
  }
  
  stopTimer() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
```

#### CSS Optimization
- Hardware acceleration: `transform3d(0,0,0)` for smooth animations
- Composite layers: `will-change: transform` for animated elements
- Minimal repaints: Update `transform` and `opacity` only

### Integration with Game State

#### Timer Events
```typescript
interface TimerEvents {
  onPhaseChange: (phase: 'calm' | 'focused' | 'energized') => void;
  onFinalCountdown: (secondsRemaining: number) => void;
  onTimeout: () => void;
  onPause: () => void;
  onResume: () => void;
}
```

#### State Synchronization
- Timer visual state matches game state exactly
- Pause/resume preserves visual position
- Reset smoothly transitions to initial state

### Success Metrics for SCRAM-011

#### User Experience
- **Smooth 60fps animations** on all target devices
- **Intuitive time perception** (users accurately estimate remaining time)
- **Stress-free urgency** (energy without anxiety)
- **No jarring transitions** between time phases

#### Technical Performance
- **<16ms frame time** for all animations
- **Minimal CPU usage** (timer doesn't impact game performance)
- **Battery efficient** (optimized animation loops)

---

## Design Rationale: Why This Timer Creates Flow

### Psychological Design Principles

1. **Breathing Rhythm:** Circular motion mimics natural breathing
2. **Color Psychology:** Warm transitions (never harsh red)
3. **Progressive Urgency:** Builds energy gradually, never suddenly
4. **Visual Hierarchy:** Present but not dominating
5. **Predictable Patterns:** Brain learns the rhythm and relaxes

### Anagram-Specific Considerations

1. **Cognitive Load Management:** Timer doesn't compete with word-solving
2. **Flow State Support:** Creates rhythm without breaking concentration  
3. **Motivation Curve:** Gentle urgency encourages without panic
4. **Recovery Friendly:** Mistakes don't feel catastrophic

The timer becomes a supportive companion in the word discovery journey - present when needed, invisible when deep in thought.

---

## Epic 3 UI Design Complete! 🎨

**The Calm Playground Trinity:**
- ✅ **SCRAM-009:** Layout that breathes with generous space
- ✅ **SCRAM-010:** Input that feels like an extension of thought  
- ✅ **SCRAM-011:** Timer that creates gentle heartbeat urgency

Your anagram game now has the soul of calm focus + playful curiosity, wrapped in pastel tranquility. Every interaction whispers "you've got this" while building just enough energy to keep players engaged.

Ready for development handoff to bring this beautiful vision to life!
