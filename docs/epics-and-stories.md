# Scramble - Epic Breakdown & Implementation Stories

**Author:** John (Product Manager Agent)
**Date:** 2025-11-25
**Version:** 1.0 - Based on Architecture v1.0

---

## Epic Overview

Based on the **Vanilla TypeScript + Vite architecture** designed by Sarah, these epics break down the Scramble anagram game into implementable development phases. Each epic contains user stories with clear acceptance criteria and technical implementation guidance.

**Architecture Alignment:** All epics follow the lightweight, static-first architecture with progressive enhancement and offline resilience.

---

## Epic 1: Core Game Engine Foundation

**Goal:** Implement the essential anagram game mechanics with TypeScript and modern tooling

**Business Value:** Establishes the foundational gameplay that users will experience

**Architecture Components:** GameEngine.ts, Timer.ts, AnagramGenerator.ts, ScoreCalculator.ts

### Stories:

#### **SCRAM-001: Set Up Vite TypeScript Project Structure**
**Priority:** Highest  
**Story Points:** 2  

**As a developer, I want a well-structured Vite TypeScript project so I can build the game efficiently.**

**Acceptance Criteria:**
- AC1: Initialize project with `npm create vite@latest scramble-game -- --template vanilla-ts`
- AC2: Configure TypeScript with strict mode and modern target (ES2020+)
- AC3: Set up project structure following architecture document (game/, api/, ui/, data/, utils/)
- AC4: Configure Vite with proper build optimization and code splitting
- AC5: Add development scripts: dev, build, preview, test, lint, type-check

**Technical Implementation:**
```bash
# Project initialization
npm create vite@latest scramble-game -- --template vanilla-ts
cd scramble-game
npm install
npm install -D vitest happy-dom @types/node eslint @typescript-eslint/parser
```

**Definition of Done:**
- Project builds successfully with TypeScript
- Development server starts in <1 second
- All configured scripts work correctly
- Project structure matches architecture specification

---

#### **SCRAM-002: Implement Core Game State Management**
**Priority:** Highest  
**Story Points:** 3  

**As a player, I want the game to track my current state so my progress is maintained.**

**Acceptance Criteria:**
- AC1: Create GameState interface with all required properties (currentAnagram, solution, timeRemaining, score, streak, difficulty, gameStatus)
- AC2: Implement GameStore class with reactive state updates
- AC3: Add subscriber pattern for UI updates when state changes
- AC4: Persist game state to sessionStorage for tab recovery
- AC5: Implement state validation and error recovery

**Technical Implementation:**
```typescript
interface GameState {
  currentAnagram: string;
  solution: string;
  timeRemaining: number;
  score: number;
  streak: number;
  difficulty: number;
  gameStatus: 'playing' | 'paused' | 'ended';
}

class GameStore {
  private state: GameState;
  private subscribers: ((state: GameState) => void)[] = [];
  
  updateState(updates: Partial<GameState>) {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
    this.persistToSession();
  }
}
```

**Definition of Done:**
- GameStore manages all game state centrally
- State changes trigger UI updates automatically
- State persists across page refreshes
- No state corruption under normal usage

---

#### **SCRAM-003: Create Anagram Generation System**
**Priority:** Highest  
**Story Points:** 5  

**As a player, I want to receive properly curated anagrams so every puzzle is solvable and engaging.**

**Acceptance Criteria:**
- AC1: Create 200+ pre-curated anagram sets across 5 difficulty levels (4-8 letters)
- AC2: Implement AnagramGenerator class with difficulty-based selection
- AC3: Ensure each anagram has exactly one valid English solution
- AC4: Add category hints (animals, science, etc.) for enhanced gameplay
- AC5: Prevent duplicate anagrams within the same session

**Technical Implementation:**
```typescript
interface AnagramSet {
  id: string;
  scrambled: string;
  solution: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category?: string;
  hints: {
    category: string;
    firstLetter: string;
  };
}

const ANAGRAM_SETS: Record<number, AnagramSet[]> = {
  1: [
    { id: 'easy-001', scrambled: 'AERT', solution: 'TEAR', difficulty: 1, 
      hints: { category: 'emotion', firstLetter: 'T' }},
    // ... 40+ more easy anagrams
  ],
  // ... levels 2-5
};
```

**Definition of Done:**
- 200+ anagrams curated and tested for solvability
- Difficulty progression feels natural and balanced
- No impossible or ambiguous anagrams
- Category hints enhance learning experience

---

#### **SCRAM-004: Implement 60-Second Timer System**
**Priority:** Highest  
**Story Points:** 3  

**As a player, I want a countdown timer so I feel appropriate challenge and urgency.**

**Acceptance Criteria:**
- AC1: Create Timer class with precise 60-second countdown
- AC2: Implement color-coded visual feedback (green → yellow → red)
- AC3: Add pulsing animation for final 10 seconds
- AC4: Trigger timeout events for game state management
- AC5: Ensure timer accuracy within 100ms tolerance

**Technical Implementation:**
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
}
```

**Definition of Done:**
- Timer counts down accurately from 60 to 0
- Visual feedback changes appropriately
- Timer can be paused, resumed, and reset
- No memory leaks from timer intervals

---

#### **SCRAM-005: Create Scoring System with Bonuses**
**Priority:** High  
**Story Points:** 4  

**As a player, I want fair scoring with bonuses so I'm motivated to improve.**

**Acceptance Criteria:**
- AC1: Implement base scoring: 4-letter (10pts), 5-letter (20pts), 6-letter (40pts), 7+ letter (60+ pts)
- AC2: Add speed multipliers: 2x for first 20s, 1.5x for first 40s
- AC3: Implement streak bonuses: +10% per consecutive correct (max 100%)
- AC4: Handle skip actions as neutral (no points, no streak break)
- AC5: Display score breakdown for transparency

**Technical Implementation:**
```typescript
class ScoreCalculator {
  calculateScore(
    wordLength: number, 
    timeRemaining: number, 
    currentStreak: number
  ): number {
    const baseScore = this.getBaseScore(wordLength);
    const speedMultiplier = this.getSpeedMultiplier(timeRemaining);
    const streakBonus = Math.min(currentStreak * 0.1, 1.0);
    
    return Math.round(baseScore * speedMultiplier * (1 + streakBonus));
  }
}
```

**Definition of Done:**
- Scoring formula implemented exactly as specified
- Score calculations are accurate and consistent
- Bonuses motivate desired player behaviors
- Score breakdown is clear and educational

---

## Epic 2: API Integration & Word Validation

**Goal:** Implement resilient word validation with API integration and offline fallbacks

**Business Value:** Ensures game reliability and educational value through proper word validation

**Architecture Components:** WordsAPI.ts, DictionaryCache.ts, RateLimiter

### Stories:

#### **SCRAM-006: Implement WordsAPI Integration**
**Priority:** High  
**Story Points:** 5  

**As a player, I want accurate word validation so I learn proper English vocabulary.**

**Acceptance Criteria:**
- AC1: Create WordsAPIClient class with proper error handling
- AC2: Implement rate limiting (30 requests/minute) to respect API limits
- AC3: Add 500ms timeout with AbortController for responsive UX
- AC4: Cache API responses in localStorage to reduce duplicate calls
- AC5: Handle all API errors gracefully without breaking gameplay

**Technical Implementation:**
```typescript
class WordsAPIClient {
  private readonly baseURL = 'https://wordsapiv1.p.mashape.com';
  private readonly rateLimiter = new RateLimiter(30, 60000);
  private cache = new Map<string, ValidationResult>();
  
  async validateWord(word: string): Promise<ValidationResult> {
    // Check cache first
    if (this.cache.has(word)) return this.cache.get(word)!;
    
    // Rate limit check
    await this.rateLimiter.checkLimit();
    
    // API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    
    try {
      const response = await fetch(`${this.baseURL}/words/${word}`, {
        headers: { 'X-RapidAPI-Key': import.meta.env.VITE_WORDS_API_KEY },
        signal: controller.signal
      });
      
      const result = { 
        valid: response.ok, 
        definition: response.ok ? await response.json() : null 
      };
      
      this.cache.set(word, result);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

**Definition of Done:**
- API integration works reliably with proper error handling
- Rate limiting prevents API abuse
- Response times meet <200ms target with timeout fallback
- Caching reduces unnecessary API calls

---

#### **SCRAM-007: Implement API Error Notification**
**Priority:** High  
**Story Points:** 2  

**As a player, I want clear notification when word validation is unavailable so I understand the game state.**

**Acceptance Criteria:**
- AC1: Display clear popup notification when WordsAPI is unavailable
- AC2: Allow players to continue with manual validation (accept any properly formed word)
- AC3: Show retry option to attempt API reconnection
- AC4: Persist notification state until API becomes available again
- AC5: Graceful error handling without breaking game flow

**Technical Implementation:**
```typescript
class APIErrorNotifier {
  private isAPIUnavailable = false;
  private popupElement: HTMLElement | null = null;
  
  showAPIErrorPopup(): void {
    if (this.popupElement) return; // Already showing
    
    this.popupElement = document.createElement('div');
    this.popupElement.className = 'api-error-popup';
    this.popupElement.innerHTML = `
      <div class="popup-content">
        <h3>⚠️ Word Validation Unavailable</h3>
        <p>The word dictionary service is currently unavailable.</p>
        <p>You can continue playing - any valid anagram will be accepted.</p>
        <button onclick="this.retry()">Retry Connection</button>
        <button onclick="this.dismiss()">Continue Playing</button>
      </div>
    `;
    document.body.appendChild(this.popupElement);
    this.isAPIUnavailable = true;
  }
  
  hideAPIErrorPopup(): void {
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
      this.isAPIUnavailable = false;
    }
  }
}

class WordValidator {
  async validateWord(word: string): Promise<ValidationResult> {
    try {
      const apiResult = await this.wordsAPI.validateWord(word);
      // API working - hide any error popup
      this.errorNotifier.hideAPIErrorPopup();
      return apiResult;
    } catch (error) {
      // Show error popup and accept manual validation
      this.errorNotifier.showAPIErrorPopup();
      return { 
        valid: true, // Accept any properly formed word when API unavailable
        isManualValidation: true,
        error: 'API validation unavailable - accepted manually'
      };
    }
  }
}
```

**Definition of Done:**
- Error popup displays clearly when API fails
- Players can continue gameplay without interruption
- Retry mechanism attempts API reconnection
- Manual validation accepts properly formed anagrams
- No game crashes or broken states during API failures

---

#### **SCRAM-008: Implement Anagram Solution Validation**
**Priority:** Highest  
**Story Points:** 3  

**As a player, I want my anagram solutions validated correctly so I know when I've solved puzzles.**

**Acceptance Criteria:**
- AC1: Validate that player's answer uses all scrambled letters exactly once
- AC2: Perform case-insensitive comparison for user convenience
- AC3: Check that solution is a valid English word via API or local dictionary
- AC4: Provide clear feedback for different failure types (not using all letters vs invalid word)
- AC5: Handle edge cases like accented characters and punctuation

**Technical Implementation:**
```typescript
class AnagramValidator {
  validateSolution(scrambled: string, solution: string): ValidationResult {
    // Check if all letters used exactly once
    const scrambledSorted = [...scrambled.toLowerCase()].sort().join('');
    const solutionSorted = [...solution.toLowerCase()].sort().join('');
    
    if (scrambledSorted !== solutionSorted) {
      return { 
        valid: false, 
        error: 'Must use all letters exactly once',
        errorType: 'letters'
      };
    }
    
    // Check if valid English word
    return this.wordValidator.validateWord(solution);
  }
}
```

**Definition of Done:**
- All anagram validation logic works correctly
- Clear error messages help users understand mistakes
- Performance is <50ms for any validation
- Edge cases handled appropriately

---

## Epic 3: User Interface & Experience

**Goal:** Create clean, responsive UI that works perfectly across all devices

**Business Value:** Ensures excellent user experience that drives retention and engagement

**Architecture Components:** GameUI.ts, components/

### Stories:

#### **SCRAM-009: Create Responsive Game Layout**
**Priority:** High  
**Story Points:** 4  

**As a player, I want a clean, intuitive interface that works on any device.**

**Acceptance Criteria:**
- AC1: Design responsive layout that works 375px-1920px width
- AC2: Use CSS Grid/Flexbox for flexible, maintainable layouts
- AC3: Ensure touch targets are minimum 44x44px for mobile accessibility
- AC4: Test across Chrome, Firefox, Safari, Edge on desktop and mobile
- AC5: Implement dark/light theme support with CSS custom properties

**Technical Implementation:**
```css
/* CSS custom properties for theming */
:root {
  --primary-color: #007acc;
  --bg-color: #ffffff;
  --text-color: #333333;
  --timer-green: #4caf50;
  --timer-yellow: #ff9800;
  --timer-red: #f44336;
}

.game-container {
  display: grid;
  grid-template-areas: 
    "scrambled"
    "input"
    "timer score"
    "actions";
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .game-container {
    grid-template-areas: 
      "scrambled scrambled"
      "input timer"
      "actions score";
  }
}
```

**Definition of Done:**
- Layout is fully responsive and accessible
- Interface works smoothly on target devices
- Theme switching works without page reload
- No horizontal scrolling on any supported screen size

---

#### **SCRAM-010: Implement Text Input with Real-time Feedback**
**Priority:** High  
**Story Points:** 3  

**As a player, I want intuitive text input with helpful feedback so I can focus on solving anagrams.**

**Acceptance Criteria:**
- AC1: Large, auto-focused text input field below scrambled letters
- AC2: Real-time character count showing progress (e.g., "5/7 letters")
- AC3: Visual feedback for validation states (green for correct, red for incorrect)
- AC4: Support both Enter key and Submit button for submission
- AC5: Clear button and Escape key for resetting input

**Technical Implementation:**
```typescript
class InputHandler {
  private inputElement: HTMLInputElement;
  private feedbackElement: HTMLElement;
  
  setupInput() {
    this.inputElement.addEventListener('input', this.handleInput.bind(this));
    this.inputElement.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Auto-focus for seamless UX
    this.inputElement.focus();
  }
  
  handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const expectedLength = this.gameStore.state.currentAnagram.length;
    
    // Update character count
    this.feedbackElement.textContent = `${value.length}/${expectedLength} letters`;
    
    // Auto-submit when expected length reached
    if (value.length === expectedLength) {
      this.submitAnswer(value);
    }
  }
}
```

**Definition of Done:**
- Text input is intuitive and responsive
- Real-time feedback helps guide user input
- Both keyboard and button interactions work smoothly
- Input validation is clear and immediate

---

#### **SCRAM-011: Create Timer Visualization**
**Priority:** High  
**Story Points:** 3  

**As a player, I want clear visual indication of remaining time so I can manage my solving pace.**

**Acceptance Criteria:**
- AC1: Display countdown in simple seconds format (60, 59, 58...)
- AC2: Color-coded progress: Green (40-60s), Yellow (15-40s), Red (0-15s)
- AC3: Circular progress ring showing time visually
- AC4: Pulsing animation for final 10 seconds to create urgency
- AC5: Mobile haptic feedback at 30s, 10s, and timeout

**Technical Implementation:**
```typescript
class TimerUI {
  private timerElement: HTMLElement;
  private progressRing: SVGCircleElement;
  
  updateTimer(timeRemaining: number) {
    // Update text display
    this.timerElement.textContent = timeRemaining.toString();
    
    // Update color based on time remaining
    this.timerElement.className = this.getTimerClass(timeRemaining);
    
    // Update progress ring
    const progress = timeRemaining / 60;
    const circumference = 2 * Math.PI * 40; // radius = 40
    const strokeDasharray = `${progress * circumference} ${circumference}`;
    this.progressRing.style.strokeDasharray = strokeDasharray;
    
    // Add pulsing for final 10 seconds
    if (timeRemaining <= 10) {
      this.timerElement.classList.add('pulse');
    }
    
    // Haptic feedback on mobile
    if ([30, 10, 0].includes(timeRemaining) && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }
}
```

**Definition of Done:**
- Timer visualization is clear and prominent
- Color coding provides intuitive time awareness
- Progress ring gives visual countdown reference
- Mobile haptic feedback works on supported devices

---

## Epic 4: Game Flow & Polish

**Goal:** Complete the game experience with smooth transitions, analytics, and deployment

**Business Value:** Professional polish that drives user retention and provides business insights

**Architecture Components:** GameUI.ts, analytics.ts, deployment configuration

### Stories:

#### **SCRAM-012: Implement Skip Functionality**
**Priority:** Medium  
**Story Points:** 3  

**As a player, I want to skip difficult anagrams so I don't get frustrated and stop playing.**

**Acceptance Criteria:**
- AC1: Prominent Skip button alongside Submit button
- AC2: Skip shows solution briefly (2-3 seconds) for learning
- AC3: New anagram loads with timer reset to 60 seconds
- AC4: Skip preserves streak but awards no points (neutral action)
- AC5: Track skip statistics for difficulty balancing

**Technical Implementation:**
```typescript
class GameEngine {
  handleSkip() {
    const currentSolution = this.gameStore.state.solution;
    
    // Show solution briefly
    this.ui.showSolution(currentSolution, 2000);
    
    // Update statistics (no score, preserve streak)
    this.stats.recordSkip();
    
    // Load new anagram after brief delay
    setTimeout(() => {
      this.loadNewAnagram();
      this.timer.reset();
    }, 2000);
  }
}
```

**Definition of Done:**
- Skip button is easily accessible and clearly labeled
- Solution display timing feels appropriate
- Skip tracking works for analytics
- User flow feels smooth and non-punitive

---

#### **SCRAM-013: Add Sound Effects and Polish**
**Priority:** Low  
**Story Points:** 2  

**As a player, I want satisfying audio feedback so my achievements feel rewarding.**

**Acceptance Criteria:**
- AC1: Success sound for correct solutions (pleasant, not annoying)
- AC2: Subtle error sound for incorrect attempts
- AC3: Urgency sound for final 10 seconds of timer
- AC4: Achievement sounds for streaks and level advancement
- AC5: User preference toggle for sound on/off

**Technical Implementation:**
```typescript
class SoundManager {
  private sounds = new Map<string, HTMLAudioElement>();
  private enabled = true;
  
  async loadSounds() {
    const soundFiles = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      urgency: '/sounds/urgency.mp3',
      achievement: '/sounds/achievement.mp3'
    };
    
    for (const [name, url] of Object.entries(soundFiles)) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    }
  }
  
  play(soundName: string) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay restrictions
    }
  }
}
```

**Definition of Done:**
- Sound effects enhance game experience without being intrusive
- All sounds are high quality and web-optimized
- Sound preferences persist across sessions
- No audio playback errors on any target browser

---

#### **SCRAM-014: Implement Analytics and Performance Monitoring**
**Priority:** Medium  
**Story Points:** 3  

**As a product owner, I want usage analytics so I can improve the game based on real user behavior.**

**Acceptance Criteria:**
- AC1: Track key metrics: games played, completion rate, average solving time, difficulty progression
- AC2: Monitor performance: load times, API response times, error rates
- AC3: Identify most skipped anagrams for difficulty rebalancing
- AC4: Respect user privacy with anonymous data collection
- AC5: Implement without impacting game performance

**Technical Implementation:**
```typescript
class Analytics {
  private events: AnalyticsEvent[] = [];
  
  track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        difficulty: this.gameStore.state.difficulty
      }
    };
    
    this.events.push(analyticsEvent);
    
    // Batch send events periodically
    if (this.events.length >= 10) {
      this.sendEvents();
    }
  }
  
  async sendEvents() {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.events)
      });
      
      this.events = [];
    } catch (error) {
      // Fail silently - analytics shouldn't break the game
      console.warn('Analytics failed:', error);
    }
  }
}
```

**Definition of Done:**
- Analytics capture all important user behaviors
- Performance monitoring identifies bottlenecks
- Data collection respects privacy and performance
- Insights actionable for game improvement

---

#### **SCRAM-015: Production Build and Deployment**
**Priority:** High  
**Story Points:** 4  

**As a product owner, I want the game deployed to production so users can access it globally.**

**Acceptance Criteria:**
- AC1: Optimize build for production with code splitting and minification
- AC2: Deploy to Vercel or Netlify with proper caching headers
- AC3: Configure environment variables for API keys and URLs
- AC4: Set up preview deployments for testing changes
- AC5: Monitor performance and uptime in production

**Unit Testing Scenarios:**
- Build optimization reduces bundle size by >40% vs development
- Environment variable injection works correctly in production
- Deployment process completes without errors
- Performance monitoring captures key metrics accurately

**Technical Implementation:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          dictionary: ['./src/data/dictionary.ts'],
          analytics: ['./src/utils/analytics.ts']
        }
      }
    }
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

```json
// vercel.json
{
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Definition of Done:**
- Production build is optimized and performant
- Deployment pipeline is automated and reliable
- Environment configuration is secure
- Application monitoring is operational

---

#### **SCRAM-016: Comprehensive Testing Infrastructure & Coverage**
**Priority:** Highest  
**Story Points:** 5  

**As a developer, I want comprehensive testing infrastructure so I can ensure code quality and prevent regressions.**

**Prerequisites:** SCRAM-001 (Project Setup) - ✅ **COMPLETED**

**Acceptance Criteria:**
- AC1: Set up Vitest with TypeScript support and DOM environment (happy-dom)
- AC2: Achieve minimum 80% code coverage for game logic (GameEngine, Timer, ScoreCalculator, AnagramValidator)
- AC3: Implement unit tests for all critical functions with edge case coverage
- AC4: Add integration tests for API interactions with mocked responses
- AC5: Configure automated testing in CI/CD pipeline with coverage reporting

**Current Testing Foundation:**
```typescript
// Already established in SCRAM-001
// vitest.config.ts - Basic configuration exists
// tests/setup.test.ts - Initial project validation tests
// package.json - Test script configured: "test": "vitest"
```

**Testing Architecture Strategy:**
Based on Sarah's architecture, implement testing layers:

1. **Unit Tests** (80% coverage target):
   ```
   tests/unit/
   ├── game/
   │   ├── GameEngine.test.ts
   │   ├── Timer.test.ts
   │   └── ScoreCalculator.test.ts
   ├── api/
   │   ├── WordsAPI.test.ts
   │   └── AnagramValidator.test.ts
   ├── data/
   │   └── LocalDictionary.test.ts
   └── utils/
       ├── storage.test.ts
       └── analytics.test.ts
   ```

2. **Integration Tests**:
   ```
   tests/integration/
   ├── api-fallback.test.ts
   ├── game-workflow.test.ts
   └── storage-persistence.test.ts
   ```

3. **Performance Tests**:
   ```
   tests/performance/
   ├── anagram-generation.test.ts
   ├── word-validation.test.ts
   └── ui-responsiveness.test.ts
   ```

**Unit Testing Scenarios:**
- **GameEngine Tests:** State transitions, anagram loading, game completion flows
- **Timer Tests:** Countdown accuracy, pause/resume, timeout handling, visual state changes
- **ScoreCalculator Tests:** Base scoring, speed multipliers, streak bonuses, edge cases (0 time, max streak)
- **AnagramValidator Tests:** Letter validation, case sensitivity, word validation integration
- **WordsAPI Tests:** Rate limiting, timeout handling, cache behavior, fallback scenarios
- **LocalDictionary Tests:** Word lookup performance, lazy loading, memory usage
- **UI Components Tests:** Input handling, keyboard events, responsive behavior

**Technical Implementation:**
```typescript
// Enhanced vitest.config.ts for comprehensive testing
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'vite.config.ts',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Performance benchmarking
    benchmark: {
      include: ['tests/performance/**/*.bench.ts']
    }
  }
});

// Test architecture example
describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;
  
  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('calculateScore', () => {
    it('should calculate base scores correctly', () => {
      expect(calculator.calculateScore(4, 60, 0)).toBe(10);
      expect(calculator.calculateScore(5, 60, 0)).toBe(20);
      expect(calculator.calculateScore(6, 60, 0)).toBe(40);
      expect(calculator.calculateScore(7, 60, 0)).toBe(60);
    });

    it('should apply speed multipliers correctly', () => {
      expect(calculator.calculateScore(4, 50, 0)).toBe(20); // 2x multiplier (first 20s)
      expect(calculator.calculateScore(4, 30, 0)).toBe(15); // 1.5x multiplier (first 40s)
      expect(calculator.calculateScore(4, 10, 0)).toBe(10); // 1x multiplier (after 40s)
    });

    it('should apply streak bonuses correctly', () => {
      expect(calculator.calculateScore(4, 60, 5)).toBe(15); // 50% bonus
      expect(calculator.calculateScore(4, 60, 10)).toBe(20); // 100% max bonus
      expect(calculator.calculateScore(4, 60, 15)).toBe(20); // Capped at 100%
    });

    it('should handle edge cases', () => {
      expect(calculator.calculateScore(4, 0, 0)).toBe(10); // Zero time remaining
      expect(calculator.calculateScore(3, 60, 0)).toBe(10); // Minimum word length
      expect(calculator.calculateScore(10, 60, 0)).toBe(100); // Long word
    });
  });
});
```

**Error Handling Test Cases:**
- Network failures during API calls (timeout, offline scenarios)
- Invalid anagram data corruption scenarios
- Local storage quota exceeded conditions
- Timer precision under heavy CPU load
- Memory leaks in long gaming sessions
- Graceful degradation when WordsAPI unavailable

**Performance Testing Requirements:**
- Anagram generation completes in <50ms (benchmark test)
- Word validation responds in <200ms (integration test)
- UI updates render in <16ms for 60 FPS (performance test)
- Memory usage stays <50MB during gameplay (stress test)
- Bundle size remains <50kB total (build validation)

**Mocking Strategy:**
```typescript
// API mocking for reliable tests
vi.mock('@api/WordsAPI', () => ({
  WordsAPIClient: vi.fn().mockImplementation(() => ({
    validateWord: vi.fn().mockResolvedValue({ valid: true })
  }))
}));

// Timer mocking for deterministic tests
vi.mock('@game/Timer', () => ({
  Timer: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn()
  }))
}));
```

**Definition of Done:**
- All tests pass consistently across environments (Windows, macOS, Linux)
- 80%+ coverage thresholds met with meaningful test cases
- CI/CD pipeline configured with test automation
- Performance benchmarks integrated and passing
- Test documentation and examples provided
- Mock strategies established for external dependencies

**Dependencies:**
- Builds on SCRAM-001 project structure ✅
- Requires placeholder classes from architecture setup ✅
- Foundation for all subsequent testing in SCRAM-002+ stories

---

## Story Dependencies & Critical Path

### **Dependency Mapping:**

**SCRAM-001 (Project Setup)** → *Blocks ALL other stories*
- Required for: SCRAM-002, SCRAM-003, SCRAM-004, SCRAM-005, SCRAM-016

**SCRAM-002 (Game State)** → *Core dependency for UI layer*
- Required for: SCRAM-009, SCRAM-010, SCRAM-011, SCRAM-012
- Depends on: SCRAM-001

**SCRAM-003 (Anagram Generation)** → *Data dependency for validation*
- Required for: SCRAM-008, SCRAM-010
- Depends on: SCRAM-001

**SCRAM-006 (WordsAPI)** → *Primary validation dependency*
- Required for: SCRAM-008
- Depends on: SCRAM-001
- Parallel with: SCRAM-007 (fallback strategy)

**SCRAM-007 (API Error Handling)** → *Error notification system*
- Required for: SCRAM-008
- Depends on: SCRAM-001
- Parallel with: SCRAM-006

**SCRAM-008 (Validation)** → *Gameplay dependency*
- Required for: SCRAM-010, SCRAM-012
- Depends on: SCRAM-003, SCRAM-006, SCRAM-007

**SCRAM-009 (Layout)** → *UI foundation*
- Required for: SCRAM-010, SCRAM-011, SCRAM-013
- Depends on: SCRAM-002

**SCRAM-016 (Testing)** → *Quality assurance foundation*
- Required for: Production deployment (SCRAM-015)
- Can be parallel with: All development stories

### **Critical Path Analysis:**
1. **SCRAM-001** (Project Setup) - 2 points - *MUST complete first*
2. **SCRAM-002** (Game State) - 3 points - *Enables UI development*
3. **SCRAM-003** (Anagram Generation) - 5 points - *Enables validation*
4. **SCRAM-006 + SCRAM-007** (API + Dictionary) - 9 points - *Can be parallel*
5. **SCRAM-008** (Validation) - 3 points - *Requires items 3+4*

**Parallel Development Opportunities:**
- SCRAM-004 (Timer) + SCRAM-005 (Scoring) can develop in parallel after SCRAM-001
- SCRAM-016 (Testing) should run parallel throughout development
- SCRAM-013 (Sound) + SCRAM-014 (Analytics) can develop in parallel

## Implementation Priority & Roadmap

### **Phase 1: Core Foundation (Week 1)**
- SCRAM-001: Project Setup (2 points) - *START FIRST*
- SCRAM-016: Testing Infrastructure (5 points) - *START WITH 001*
- SCRAM-002: Game State Management (3 points) - *AFTER 001*
- SCRAM-003: Anagram Generation (5 points) - *PARALLEL WITH 002*
- SCRAM-004: Timer System (3 points) - *PARALLEL WITH 002/003*
- SCRAM-005: Scoring System (4 points) - *AFTER 002*

**Total: 22 points | Estimated: 1 week | Critical Dependencies Resolved**

### **Phase 2: API & Validation (Week 2)**
- SCRAM-006: WordsAPI Integration (5 points)
- SCRAM-007: API Error Notification (2 points)
- SCRAM-008: Anagram Validation (3 points)

**Total: 10 points | Estimated: 1 week**

### **Phase 3: User Interface (Week 3)**
- SCRAM-009: Responsive Layout (4 points)
- SCRAM-010: Text Input Interface (3 points)
- SCRAM-011: Timer Visualization (3 points)
- SCRAM-012: Skip Functionality (3 points)

**Total: 13 points | Estimated: 1 week**

### **Phase 4: Polish & Deploy (Week 4)**
- SCRAM-013: Sound Effects (2 points)
- SCRAM-014: Analytics (3 points)
- SCRAM-015: Production Deployment (4 points)

**Total: 9 points | Estimated: 1 week**

### **UPDATED SPRINT PLAN WITH CORRECTIONS**

**Sprint Velocity:** 15 points/week (conservative estimate accounting for quality requirements)

**Corrected Phase Distribution:**
- **Week 1:** Foundation + Testing (22 points) - *Requires dedicated testing focus*
- **Week 2:** API Integration (12 points) - *Include accessibility requirements*
- **Week 3:** UI Development (13 points) - *Add cross-platform testing*
- **Week 4:** Polish + Deploy (9 points) - *Include security hardening*

**Quality Gates Per Phase:**
1. **Week 1:** All unit tests passing, 80%+ coverage achieved
2. **Week 2:** API error handling tested, offline mode validated
3. **Week 3:** Accessibility compliance verified, mobile performance confirmed
4. **Week 4:** Security audit passed, production monitoring operational

---

## Success Metrics & Acceptance

### **Epic Success Criteria:**
- All user stories meet acceptance criteria
- Performance targets achieved (<2s load, <200ms API)
- Cross-browser compatibility verified
- Mobile responsiveness confirmed
- Production deployment successful

### **Business Metrics to Track:**
- User engagement (session length, games per session)
- Performance (load times, error rates)
- Learning effectiveness (vocabulary retention)
- User satisfaction (completion rates, return visits)

---

## Epic 5: Enhanced User Experience & Feedback

**Goal:** Improve player learning and engagement through enhanced feedback mechanisms

**Business Value:** Increases educational value and player satisfaction by showing solutions and providing better feedback

**Architecture Components:** GameUI.ts, GameStore.ts, Timer.ts

**Priority:** High
**Status:** ✅ COMPLETED
**Completion Date:** December 6, 2025
**Target Release:** v2.0
**Story Points:** 3/3 (100%)

### Stories:

#### **SCRAM-016: Display Solution on Timer Timeout** ✅ COMPLETED
**Priority:** High  
**Story Points:** 3  
**Status:** ✅ Done (December 6, 2025)
**Test Results:** 236/236 passing (100%)
**Implementation:** 6 files modified, ~380 lines of code

**As a player, I want to see the correct answer when the timer runs out so I can learn from missed opportunities and improve my vocabulary.**

**Acceptance Criteria:**
- AC1: When timer reaches 0, display the correct answer prominently before moving to next anagram
- AC2: Show solution for 3 seconds with clear visual styling (different from success/error states)
- AC3: Include contextual information: word definition/category hint from anagram data
- AC4: Add smooth transition animation from timeout state to solution reveal
- AC5: Track timeout events in analytics for learning pattern analysis
- AC6: Ensure solution display doesn't break game flow or confuse players
- AC7: Maintain skip limit (doesn't count as a skip when timer runs out)
- AC8: Reset timer and proceed to next anagram automatically after solution display

**User Experience Flow:**
1. Timer reaches 0:00
2. Game pauses immediately
3. Solution overlay appears with:
   - "Time's Up!" header
   - Scrambled letters (for reference)
   - Correct answer in bold/highlighted
   - Category hint (e.g., "Animal: HORSE")
   - Encouraging message (e.g., "Keep trying! 💪")
4. After 3 seconds, overlay fades out
5. New anagram loads automatically
6. Timer resets and starts for new round

**Technical Implementation:**
```typescript
// In GameStore.ts - Update handleTimeout method
private handleTimeout(): void {
  const currentAnagram = this.state.currentAnagram;
  const solution = this.state.solution;
  const category = this.getCurrentAnagramData()?.category;
  
  // Update state to show timeout
  this.updateState({
    gameStatus: 'timeout-reveal', // New state
    timerStatus: 'finished'
  });
  
  // Track analytics
  analytics.track(AnalyticsEvent.TIMER_TIMEOUT, {
    scrambled: currentAnagram,
    solution: solution,
    difficulty: this.state.difficulty,
    timeSpent: 60 - this.state.timeRemaining
  });
  
  // Trigger UI to show solution
  this.notifySubscribers();
  
  // Auto-proceed after 3 seconds
  setTimeout(() => {
    this.proceedToNextAnagram();
  }, 3000);
}

private proceedToNextAnagram(): void {
  this.generateNewAnagram();
  this.resetTimer();
  this.updateState({ gameStatus: 'playing' });
}

// In GameUI.ts - Add solution display method
private showTimeoutSolution(anagram: string, solution: string, category?: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'solution-overlay timeout-reveal';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  
  overlay.innerHTML = `
    <div class="solution-content">
      <h3 class="timeout-header">⏰ Time's Up!</h3>
      <div class="scrambled-letters">${anagram}</div>
      <div class="solution-arrow">↓</div>
      <div class="solution-answer">${solution}</div>
      ${category ? `<div class="solution-hint">Category: ${category}</div>` : ''}
      <p class="encouragement">Keep going! You've got this! 💪</p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 300);
  }, 3000);
}
```

**CSS Styling:**
```css
.solution-overlay.timeout-reveal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
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

.solution-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

.timeout-header {
  color: #ff6b6b;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.solution-answer {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4CAF50;
  letter-spacing: 0.1em;
  margin: 1rem 0;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Definition of Done:**
- Solution displays correctly when timer expires
- 3-second display duration is accurate
- Auto-transition to next anagram works smoothly
- Analytics tracking captures timeout events
- UI is accessible (screen reader announcements work)
- No UI glitches or state inconsistencies
- Works across all browsers and devices
- User testing confirms improved learning experience

**Dependencies:**
- Depends on: SCRAM-004 (Timer System)
- Related to: SCRAM-012 (Skip Functionality)

**Testing Requirements:**
1. Unit tests for timeout handling logic
2. UI tests for solution overlay display
3. Integration tests for auto-progression flow
4. Accessibility testing (keyboard nav, screen readers)
5. Cross-browser visual regression tests
6. User acceptance testing with 5+ users

**Risks & Mitigation:**
- **Risk:** 3-second delay might feel too long/short
  - **Mitigation:** Make duration configurable, gather user feedback
- **Risk:** Overlay might block important game state information
  - **Mitigation:** Ensure clean UI state before overlay, test thoroughly
- **Risk:** Auto-progression might surprise users
  - **Mitigation:** Add subtle countdown indicator on overlay

**Notes:**
- Consider adding sound effect for timeout (gentle, not punishing)
- Future enhancement: Allow users to configure display duration in settings
- Could add "Learn More" button linking to word definition (future Epic)
- Consider showing word usage example for educational value

---

## Success Metrics & Acceptance

### **Epic Success Criteria:**
- All user stories meet acceptance criteria
- Performance targets achieved (<2s load, <200ms API)
- Cross-browser compatibility verified
- Mobile responsiveness confirmed
- Production deployment successful

### **Business Metrics to Track:**
- User engagement (session length, games per session)
- Performance (load times, error rates)
- Learning effectiveness (vocabulary retention)
- User satisfaction (completion rates, return visits)
- Timeout rate and learning patterns (new metric from Epic 5)

---

## Epic 6: Unlimited Word Generation (v3.0.0)

**Status:** Ready for Development  
**Version:** 3.0.0  
**Target Sprint:** Sprint 7 (3 weeks)  
**Total Story Points:** 21

**Goal:** Extend Scramble from 82 curated anagrams to unlimited API-driven word generation while maintaining offline capability and v2.0.0 stability.

**Business Value:**
- Unlimited replay value (no word exhaustion)
- Competitive differentiation (vs limited word games)
- Estimated +30% user engagement increase
- Zero risk to v2.0.0 production users

**Technical Approach:** Hybrid architecture with triple-layer fallback (Cache → Datamuse API → Curated 82) and feature flag protection.

**Architecture Components:**
- NEW: `src/api/DatamuseAPI.ts` - Random word generation
- NEW: `src/game/WordScrambler.ts` - Smart scrambling algorithm
- NEW: `src/utils/AnagramCache.ts` - Persistent LRU cache
- MODIFIED: `src/game/AnagramGenerator.ts` - Hybrid mode logic
- MODIFIED: `src/ui/SoundSettings.ts` - Word mode toggle
- MODIFIED: `src/main.ts` - Feature flag conditional import

**Documentation:**
- Architecture: `docs/epic-6-architecture.md` (comprehensive design with rollback strategy)
- Stories: `docs/epic-6-stories.md` (detailed breakdown with 8 stories)

### Epic 6 Stories:

1. **SCRAM-018:** Git Branch & Feature Flag Setup (1 pt) - PRIORITY 1
2. **SCRAM-019:** DatamuseAPI Client (3 pts)
3. **SCRAM-020:** WordScrambler (2 pts)
4. **SCRAM-021:** AnagramCache (3 pts)
5. **SCRAM-022:** AnagramGenerator Hybrid Logic (5 pts)
6. **SCRAM-023:** UI Integration (2 pts)
7. **SCRAM-024:** Epic 6 Testing Suite (3 pts)
8. **SCRAM-025:** Production Deployment with Canary (2 pts)

**Rollback Protection (3 Layers):**
- Layer 1: Feature flag toggle (<2 min)
- Layer 2: Git branch revert (<5 min)
- Layer 3: Commit revert (<10 min nuclear option)

**Quality Gates:**
- ✅ 341 total tests (236 v2.0.0 + 105 Epic 6)
- ✅ 91%+ code coverage maintained
- ✅ <11KB bundle size (vs 2.46KB v2.0.0)
- ✅ API success rate >95%
- ✅ Cache hit rate >60%
- ✅ 7 days production stability before removing flag

**Deployment Strategy:**
- Phase 1: Staging (Day 0-2) - Internal testing
- Phase 2: Canary (Day 3-5) - 10% production traffic
- Phase 3: Gradual (Day 6-12) - 25% → 50% → 75% → 100%
- Phase 4: Default (Day 13+) - Remove feature flag code

**See:** `docs/epic-6-stories.md` for complete story details and acceptance criteria.

---

**Ready for Development!** These epics provide clear, implementable stories that align perfectly with the lightweight architecture. Each story has specific acceptance criteria and technical guidance for efficient development.

**Current Status:** Epic 1-5 complete (v2.0.0 production), Epic 6 ready for implementation (v3.0.0).

**Next Step:** Implement SCRAM-018 (Git Branch & Feature Flag Setup) to establish rollback infrastructure before any Epic 6 code.