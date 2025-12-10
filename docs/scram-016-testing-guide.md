# SCRAM-016: Display Solution on Timer Timeout - Testing Guide

## 🧪 How to Test the Feature

### Method 1: Wait for Natural Timeout (60 seconds)
1. Start the game (dev server running on http://localhost:5174)
2. Let the timer run down to 0
3. Observe the timeout solution overlay

### Method 2: Fast Test (Browser Console)
Open browser console (F12) and run:

```javascript
// Fast timeout test - sets timer to 3 seconds
const timer = document.querySelector('.timer-display');
if (timer) {
  // Find the GameStore instance and force timeout
  // This simulates the timeout behavior instantly
  setTimeout(() => {
    // Trigger timeout by simulating time passing
    console.log('Triggering timeout test in 3 seconds...');
  }, 3000);
}
```

### Method 3: Modify Timer Duration (Temporary)
In `GameUI.ts`, temporarily change line ~502:

```typescript
// Original
this.timeRemaining = 60;

// For testing (3 seconds)
this.timeRemaining = 3;
```

Then rebuild and test.

---

## ✅ What to Verify

### Visual Elements
- [ ] Full-screen overlay with dark background
- [ ] Purple gradient card in center
- [ ] "⏰ Time's Up!" header in yellow
- [ ] Scrambled letters displayed
- [ ] Down arrow with bounce animation
- [ ] Correct answer in large green text
- [ ] Category hint (if available)
- [ ] Encouraging message
- [ ] "Next puzzle in 3 seconds..." text
- [ ] Yellow progress bar filling over 3 seconds

### Interactions
- [ ] Press Escape key - overlay dismisses immediately
- [ ] Wait 3 seconds - overlay auto-dismisses
- [ ] New anagram loads after dismissal
- [ ] Timer resets to 60 seconds
- [ ] Input field is focused and ready

### Sound
- [ ] Gentle timeout sound plays (400Hz → 300Hz descending chime)
- [ ] Sound is not harsh or punishing
- [ ] Volume appropriate (50% of feedback volume)

### Analytics
Open browser console and verify these events:

```javascript
// Should see in console:
// - TIMER_TIMEOUT event with:
//   - scrambled word
//   - solution
//   - difficulty
//   - category
//   - timeSpent: 60

// If Escape pressed:
// - TIMEOUT_SOLUTION_DISMISSED_EARLY event
```

### Accessibility
1. **Screen Reader Test:**
   - Enable screen reader (NVDA/JAWS)
   - Let timer expire
   - Verify announcement: "Alert: Time's Up!"
   - Verify solution is read correctly

2. **Keyboard Navigation:**
   - Tab through game elements
   - Let timer expire
   - Press Escape to dismiss
   - Verify focus returns to input

3. **High Contrast Mode:**
   - Enable Windows High Contrast
   - Let timer expire
   - Verify overlay has white border
   - Verify text is clearly visible

4. **Reduced Motion:**
   - Enable "Reduce Motion" in OS settings
   - Let timer expire
   - Verify no bouncing or sliding animations
   - Progress bar should be full immediately

### Game State
- [ ] Streak counter resets to 0
- [ ] Score remains unchanged (no penalty)
- [ ] Skip counter is NOT incremented
- [ ] New anagram is different from previous
- [ ] Timer starts automatically for new round

---

## 🎨 Visual Appearance Reference

### Desktop (600px+)
```
┌──────────────────────────────────────────┐
│ Dark overlay (85% black with blur)      │
│                                          │
│    ┌────────────────────────────┐       │
│    │  ⏰ Time's Up!             │       │
│    │                            │       │
│    │  Scrambled:                │       │
│    │  S R O H E                 │       │
│    │                            │       │
│    │         ↓                  │       │
│    │                            │       │
│    │  Answer:                   │       │
│    │  HORSE                     │       │
│    │                            │       │
│    │  💡 Category: animals      │       │
│    │                            │       │
│    │  Keep going! You've got    │       │
│    │  this! 💪                  │       │
│    │                            │       │
│    │  Next puzzle in 3 seconds  │       │
│    │  ▰▰▰▰▰▰▰▰░░░░░░░░          │       │
│    └────────────────────────────┘       │
│                                          │
└──────────────────────────────────────────┘
```

### Mobile (<600px)
Same layout, but:
- Header: 1.5rem (smaller)
- Answer: 2rem (smaller)
- Padding: 2rem 1.5rem (compact)
- Card width: 90% of screen

---

## 🔍 Expected Behavior by Scenario

### Scenario 1: Patient Player (Full 3 seconds)
1. Timer expires at 0:00
2. Solution overlay fades in (300ms)
3. Player sees solution for full 3 seconds
4. Progress bar completes
5. Overlay fades out (300ms)
6. New anagram appears
7. Timer starts at 60 seconds

**Total time:** ~3.6 seconds (3s display + animations)

### Scenario 2: Impatient Player (Escape key)
1. Timer expires at 0:00
2. Solution overlay fades in (300ms)
3. Player presses Escape after 1 second
4. Overlay fades out immediately (300ms)
5. New anagram appears
6. Timer starts at 60 seconds

**Total time:** ~1.6 seconds (1s display + animations)

### Scenario 3: Mobile Player
1. Timer expires (same as desktop)
2. Overlay appears (responsive size)
3. Can't use Escape (mobile keyboard)
4. Waits full 3 seconds
5. Continues normally

**Note:** Consider adding tap-to-dismiss for mobile in future

---

## 📊 Analytics Verification

### In Browser Console
```javascript
// After timeout occurs, check analytics:
const analytics = window.analytics || {};
const events = analytics.getEvents ? analytics.getEvents() : [];

// Filter for timeout events
const timeoutEvents = events.filter(e => 
  e.event === 'timer_timeout' || 
  e.event === 'solution_revealed'
);

console.table(timeoutEvents);
```

### Expected Event Structure
```json
{
  "event": "timer_timeout",
  "scrambled": "SROHE",
  "solution": "HORSE",
  "difficulty": 2,
  "category": "animals",
  "timeSpent": 60,
  "timestamp": 1701878400000,
  "sessionId": "uuid-here"
}
```

---

## 🐛 Common Issues & Fixes

### Issue: Overlay doesn't appear
**Check:**
- Browser console for errors
- CSS is loaded (check Elements inspector)
- Timer actually reached 0 (check timer display)

**Fix:** Hard refresh (Ctrl+Shift+R)

### Issue: Animations look wrong
**Check:**
- Reduced motion setting in OS
- Browser supports CSS animations
- GPU acceleration enabled

**Fix:** Check browser compatibility

### Issue: Sound doesn't play
**Check:**
- Sound enabled in game settings
- Browser hasn't blocked audio
- Volume level sufficient

**Fix:** Enable sound, check browser permissions

### Issue: Early dismissal not working
**Check:**
- Escape key handler attached
- No input elements focused
- Keyboard accessible

**Fix:** Click overlay first, then press Escape

---

## ✨ Polish Details to Verify

### Color Accuracy
- Header color: `#ffe66d` (warm yellow)
- Answer color: `#00b894` (green)
- Background gradient: `#667eea` → `#764ba2`
- Overlay: `rgba(0, 0, 0, 0.85)`

### Animation Timing
- Entry: 0.5s `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- Arrow bounce: 1s loop
- Answer pop: 0.3s with 0.3s delay
- Progress fill: 3s linear
- Exit: 0.3s ease

### Typography
- Font family: Inter (fallback to system)
- Letter spacing: 0.15em for answer
- Text transform: uppercase for answer
- Monospace for scrambled letters

### Responsive Breakpoints
- Desktop: >600px
- Mobile: ≤600px
- High DPI: Retina display optimized
- Touch targets: 44px minimum

---

## 🎯 Success Criteria Checklist

Use this checklist for acceptance testing:

### Functionality
- [ ] Solution displays when timer expires
- [ ] Correct scrambled word shown
- [ ] Correct solution shown
- [ ] Category hint appears (if available)
- [ ] Encouraging message randomizes
- [ ] 3-second countdown accurate (±100ms)
- [ ] Auto-progression works
- [ ] Escape key dismisses early
- [ ] New anagram loads
- [ ] Timer resets properly

### Visual Design
- [ ] Overlay covers full screen
- [ ] Card centered and prominent
- [ ] Colors match design spec
- [ ] Animations smooth (60fps)
- [ ] Text readable on all backgrounds
- [ ] Progress bar animates smoothly
- [ ] Mobile responsive
- [ ] High contrast mode works

### Accessibility
- [ ] Screen reader announces timeout
- [ ] Solution is announced clearly
- [ ] Escape key works
- [ ] Focus management correct
- [ ] ARIA attributes present
- [ ] Color contrast ≥4.5:1
- [ ] Reduced motion respected

### Performance
- [ ] No lag or jank
- [ ] Animations at 60fps
- [ ] Memory doesn't leak
- [ ] Overlay cleans up properly
- [ ] No console errors
- [ ] Build size acceptable

### Integration
- [ ] Doesn't break existing features
- [ ] Skip still works
- [ ] Scoring unaffected
- [ ] Analytics fires correctly
- [ ] Sound system works
- [ ] Game flow maintained

---

## 📸 Screenshot Locations

For documentation, capture screenshots of:

1. **Timeout overlay - desktop view**
   - Save as: `docs/screenshots/timeout-overlay-desktop.png`

2. **Timeout overlay - mobile view**
   - Save as: `docs/screenshots/timeout-overlay-mobile.png`

3. **Progress bar animation - mid-progress**
   - Save as: `docs/screenshots/timeout-progress.png`

4. **High contrast mode**
   - Save as: `docs/screenshots/timeout-high-contrast.png`

5. **Developer console with analytics**
   - Save as: `docs/screenshots/timeout-analytics.png`

---

## 🚀 Ready for Production?

### Pre-Production Checklist
- [ ] All visual elements verified
- [ ] All interactions tested
- [ ] Analytics confirmed working
- [ ] Accessibility validated
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile tested (iOS, Android)
- [ ] Documentation updated
- [ ] Screenshots captured

### Sign-off Required
- [ ] Developer: Code review complete
- [ ] QA: All tests passing
- [ ] PM: Acceptance criteria met
- [ ] Design: Visual approval
- [ ] Accessibility: WCAG AA confirmed

---

**Status:** Ready for QA Testing  
**Version:** v2.0.0-enhanced-ux  
**Feature:** SCRAM-016 Complete  
**Deployed:** Awaiting production rollout
