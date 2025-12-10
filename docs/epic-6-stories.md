# Epic 6: Unlimited Word Generation - User Stories

**Epic:** EPIC-006 - Unlimited Word Generation  
**Version:** 3.0.0  
**Status:** Ready for Development  
**Total Story Points:** 21  
**Target Completion:** Sprint 7  
**Priority:** Medium (Post-production enhancement)

---

## Epic Overview

**Goal:** Extend Scramble from 82 curated anagrams to unlimited API-driven word generation while maintaining offline capability and v2.0.0 stability.

**Business Value:**
- Unlimited replay value (no word repetition)
- Competitive advantage (vs limited word games)
- User engagement increase (estimated +30%)
- Zero risk to v2.0.0 production users

**Technical Approach:** Hybrid architecture with triple-layer fallback (Cache → API → Curated) and feature flag protection.

---

## Story Dependency Map

```
SCRAM-018 (Branch + Feature Flag)
    ↓
SCRAM-019 (DatamuseAPI) ←─┐
SCRAM-020 (WordScrambler)  │
SCRAM-021 (AnagramCache) ←─┤
    ↓                       │
SCRAM-022 (AnagramGenerator Hybrid) ←─┘
    ↓
SCRAM-023 (UI Integration)
    ↓
SCRAM-024 (Testing Suite)
    ↓
SCRAM-025 (Production Deployment)
```

**Critical Path:** SCRAM-018 → SCRAM-022 → SCRAM-024 → SCRAM-025

---

## SCRAM-018: Git Branch & Feature Flag Infrastructure

**Story:** As a developer, I need Epic 6 isolated on a feature branch with a toggle-able feature flag so that v2.0.0 remains deployable and I can rollback Epic 6 instantly if issues arise.

**Priority:** CRITICAL (Must complete before any other Epic 6 work)  
**Story Points:** 1  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 1  

### Acceptance Criteria

**AC-001: Git Branch Creation**
- [ ] Create branch `feature/epic-6-unlimited-words` from `main` at v2.0.0 tag
- [ ] Protect `main` branch (require PR approval for merges)
- [ ] Verify `main` branch deploys successfully (v2.0.0 unchanged)
- [ ] Document branch strategy in `docs/epic-6-deployment-guide.md`

**AC-002: Feature Flag Configuration Files**
- [ ] Create `.env.production` with `VITE_EPIC_6_ENABLED=false`
- [ ] Create `.env.staging` with `VITE_EPIC_6_ENABLED=true`
- [ ] Create `.env.development` with `VITE_EPIC_6_ENABLED=true`
- [ ] Add `.env.example` with all Epic 6 variables documented
- [ ] Update `.gitignore` to exclude `.env.production` and `.env.staging`

**AC-003: Feature Flag TypeScript Module**
- [ ] Create `src/config/featureFlags.ts` with typed flag exports
- [ ] Export `FEATURE_FLAGS.EPIC_6_ENABLED` boolean
- [ ] Add JSDoc comments explaining each flag's purpose
- [ ] Add unit tests for feature flag parsing (4 tests)

**AC-004: Feature Flag Guards in Code**
- [ ] Add conditional import in `src/main.ts` (Epic 6 code only loads when flag true)
- [ ] Verify v2.0.0 tests (236) pass with Epic 6 code present but flag OFF
- [ ] Verify bundle size unchanged when flag OFF (2.46kb baseline)
- [ ] Add test: Flag OFF = v2.0.0 behavior identical

**AC-005: Rollback Documentation**
- [ ] Create `docs/epic-6-deployment-guide.md` with 3 rollback procedures
- [ ] Document Layer 1 rollback (feature flag toggle, <2min)
- [ ] Document Layer 2 rollback (git branch revert, <5min)
- [ ] Document Layer 3 rollback (commit revert, <10min)
- [ ] Add rollback testing checklist

**AC-006: Deployment Configuration**
- [ ] Update `vite.config.ts` to read environment variables
- [ ] Update `netlify.toml` with staging/production environments
- [ ] Test deployment to staging with flag ON
- [ ] Test deployment to production with flag OFF (v2.0.0 behavior)

**AC-007: CI/CD Integration**
- [ ] GitHub Actions workflow runs tests with flag ON
- [ ] GitHub Actions workflow runs tests with flag OFF
- [ ] Both test runs must pass (236 for flag OFF, future 341 for flag ON)
- [ ] Build succeeds for both flag states

### Definition of Done
- All 7 ACs completed and verified
- `main` branch protected and deployable
- Feature branch created and ready for Epic 6 work
- Feature flag toggles Epic 6 code on/off successfully
- Rollback procedures documented and tested
- v2.0.0 tests pass with Epic 6 code present (flag OFF)

### Testing Notes
- Manual test: Toggle flag ON → OFF → ON, verify no side effects
- Automated test: Flag OFF = zero Epic 6 code execution
- Performance test: Flag OFF = bundle size 2.46kb (no increase)

---

## SCRAM-019: DatamuseAPI Client Implementation

**Story:** As the game system, I need a DatamuseAPI client that fetches random words filtered by difficulty so that I can generate unlimited anagrams with appropriate challenge levels.

**Priority:** HIGH  
**Story Points:** 3  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 1  
**Dependencies:** SCRAM-018 (feature flag infrastructure)

### Acceptance Criteria

**AC-001: API Client Module Structure**
- [ ] Create `src/api/DatamuseAPI.ts` with exported class
- [ ] Import only when `FEATURE_FLAGS.EPIC_6_ENABLED === true`
- [ ] Implement TypeScript strict mode with no `any` types
- [ ] Add JSDoc comments for all public methods

**AC-002: Difficulty-to-Frequency Mapping**
- [ ] Map difficulty 1 → 4-5 letter words, high frequency (>20 per million)
- [ ] Map difficulty 2 → 5-6 letter words, medium-high frequency (10-20)
- [ ] Map difficulty 3 → 6-7 letter words, medium frequency (5-10)
- [ ] Map difficulty 4 → 7-8 letter words, medium-low frequency (2-5)
- [ ] Map difficulty 5 → 8+ letter words, low frequency (<2)
- [ ] Store mapping as private constant

**AC-003: Random Word Fetching**
- [ ] Method: `async getRandomWord(difficulty: 1|2|3|4|5): Promise<string>`
- [ ] Build Datamuse URL with wildcard pattern (`sp=?????` for 5-letter words)
- [ ] Include frequency metadata (`md=f`)
- [ ] Request 100 results (`max=100`) for randomness pool
- [ ] Filter results by frequency threshold for difficulty
- [ ] Select random word from filtered pool
- [ ] Return lowercase word string

**AC-004: HTTP Request with Timeout**
- [ ] Use `AbortController` with 500ms timeout (matches WordsAPI pattern)
- [ ] Fetch from `https://api.datamuse.com/words`
- [ ] Handle abort signal properly
- [ ] Cleanup timeout on success or error

**AC-005: Error Handling**
- [ ] Throw `DatamuseAPIError` on network failure
- [ ] Throw `DatamuseAPIError` on timeout (500ms)
- [ ] Throw `DatamuseAPIError` on invalid JSON response
- [ ] Throw `DatamuseAPIError` on empty results (no words found)
- [ ] Include original error in error message

**AC-006: Response Validation**
- [ ] Validate response is array of word objects
- [ ] Validate each word object has `word` property
- [ ] Validate each word object has frequency tag (`tags` array with `f:X.XX`)
- [ ] Filter out words with special characters (only a-z allowed)
- [ ] Filter out words shorter than difficulty minimum

**AC-007: Unit Tests (20 tests minimum)**
- [ ] Test difficulty 1 returns 4-5 letter words
- [ ] Test difficulty 5 returns 8+ letter words
- [ ] Test frequency filtering for each difficulty
- [ ] Test random selection (different words on repeated calls)
- [ ] Test 500ms timeout triggers abort
- [ ] Test network error throws DatamuseAPIError
- [ ] Test invalid JSON throws DatamuseAPIError
- [ ] Test empty results throws DatamuseAPIError
- [ ] Test special character filtering
- [ ] Mock fetch API for all tests
- [ ] Achieve 100% code coverage for DatamuseAPI.ts

### Definition of Done
- All 7 ACs completed and verified
- 20+ unit tests passing (100% coverage)
- DatamuseAPI returns valid words for all 5 difficulty levels
- Timeout handling confirmed (500ms max)
- Error handling covers all failure modes
- Feature flag guards module loading
- No `any` types, TypeScript strict mode passing

### Testing Notes
- Integration test: Call real Datamuse API (marked as `@integration`)
- Load test: Verify 100 consecutive calls succeed
- Timeout test: Mock slow network, verify 500ms abort

---

## SCRAM-020: WordScrambler Smart Algorithm

**Story:** As the game system, I need a word scrambler that creates challenging anagrams by avoiding obvious patterns so that API-generated words are as engaging as curated anagrams.

**Priority:** HIGH  
**Story Points:** 2  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 1  
**Dependencies:** SCRAM-018 (feature flag infrastructure)

### Acceptance Criteria

**AC-001: Module Structure**
- [ ] Create `src/game/WordScrambler.ts` with exported class
- [ ] Feature flag guard: Only imported when Epic 6 enabled
- [ ] TypeScript strict mode, no `any` types
- [ ] Stateless class (pure functions, no instance state)

**AC-002: Smart Scrambling Algorithm**
- [ ] Method: `scramble(word: string): string`
- [ ] Scrambled word MUST differ from original
- [ ] Avoid common prefixes: TH, UN, RE, IN, DE, EX, PRE, COM
- [ ] Avoid common suffixes: ING, ED, LY, ER, EST, TION, ABLE
- [ ] Maximum 5 shuffle attempts to find valid scramble
- [ ] Return best scramble found (even if criteria not met after 5 attempts)

**AC-003: Fisher-Yates Shuffle Implementation**
- [ ] Private method: `shuffle(letters: string[]): string[]`
- [ ] Implement Fisher-Yates shuffle algorithm (unbiased randomness)
- [ ] Verify randomness (different orders on repeated calls)
- [ ] No external dependencies (pure JavaScript)

**AC-004: Quality Validation**
- [ ] Private method: `isGoodScramble(original: string, scrambled: string): boolean`
- [ ] Rule 1: `scrambled !== original` (must differ)
- [ ] Rule 2: No common prefixes (case-insensitive check)
- [ ] Rule 3: No common suffixes (case-insensitive check)
- [ ] Rule 4: Visual distance >2 (Levenshtein or similar metric)
- [ ] Return true only if ALL rules pass

**AC-005: Edge Case Handling**
- [ ] Handle 2-letter words (always valid, just reverse)
- [ ] Handle 3-letter words (3! = 6 permutations, try all)
- [ ] Handle words with repeated letters (HELLO → valid scrambles exist)
- [ ] Handle palindromes (RACECAR → scramble differently)
- [ ] Never return original word (even if 5 attempts fail)

**AC-006: Performance Optimization**
- [ ] Scramble any word in <5ms (average)
- [ ] No memory leaks (no persistent state)
- [ ] Minimal allocations (reuse arrays where possible)

**AC-007: Unit Tests (15 tests minimum)**
- [ ] Test scrambled word differs from original (100 random words)
- [ ] Test common prefix avoidance (THE → not starting with TH)
- [ ] Test common suffix avoidance (RUNNING → not ending with ING)
- [ ] Test 2-letter words (IT → TI)
- [ ] Test 3-letter words (CAT → valid scrambles)
- [ ] Test repeated letters (HELLO → valid scrambles)
- [ ] Test palindromes (RACECAR → scrambled)
- [ ] Test visual distance validation
- [ ] Test Fisher-Yates randomness (chi-square test)
- [ ] Test performance (<5ms average for 1000 words)
- [ ] Achieve 100% code coverage for WordScrambler.ts

### Definition of Done
- All 7 ACs completed and verified
- 15+ unit tests passing (100% coverage)
- Scrambles challenging for all word lengths (2-15+ letters)
- Performance target met (<5ms average)
- No common patterns in scrambled output
- Feature flag guards module loading

### Testing Notes
- Quality test: Generate 1000 scrambles, verify none match original
- Pattern test: Generate 1000 scrambles, verify <5% have common prefixes/suffixes
- Randomness test: Chi-square test on shuffle distribution

---

## SCRAM-021: AnagramCache with LRU Eviction

**Story:** As the game system, I need a persistent LRU cache for API-generated anagrams so that I reduce API calls, improve performance, and enable offline replay of cached words.

**Priority:** HIGH  
**Story Points:** 3  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 1-2  
**Dependencies:** SCRAM-018 (feature flag infrastructure)

### Acceptance Criteria

**AC-001: Cache Module Structure**
- [ ] Create `src/utils/AnagramCache.ts` with exported class
- [ ] Feature flag guard: Only used when Epic 6 enabled
- [ ] TypeScript strict mode, no `any` types
- [ ] Singleton pattern (one cache instance per app)

**AC-002: Data Structure Design**
- [ ] Interface: `CachedAnagram { anagram: AnagramSet, timestamp: number, accessCount: number }`
- [ ] Storage: `Map<string, CachedAnagram>` (key format: `${difficulty}-${index}`)
- [ ] Max size: 200 anagrams (~20kb localStorage)
- [ ] localStorage key: `scramble-generated-cache`

**AC-003: Cache Operations**
- [ ] Method: `get(difficulty: number): AnagramSet | null`
- [ ] Return random cached anagram for difficulty (if available)
- [ ] Update `accessCount` and `timestamp` on access (LRU tracking)
- [ ] Return `null` if no cached anagrams for difficulty

**AC-004: Cache Storage**
- [ ] Method: `set(difficulty: number, anagram: AnagramSet): void`
- [ ] Add anagram to cache with current timestamp
- [ ] Trigger LRU eviction if cache size > 200
- [ ] Persist to localStorage immediately
- [ ] Handle localStorage quota exceeded errors gracefully

**AC-005: LRU Eviction Strategy**
- [ ] Private method: `evictLRU(): void`
- [ ] Find entry with oldest `timestamp` (least recently used)
- [ ] Remove from Map
- [ ] Called automatically when cache size exceeds 200
- [ ] Never evict if size ≤ 200

**AC-006: localStorage Persistence**
- [ ] Private method: `loadFromStorage(): void` (called in constructor)
- [ ] Deserialize JSON from localStorage to Map
- [ ] Handle corrupt JSON gracefully (reset cache)
- [ ] Private method: `saveToStorage(): void` (called after every change)
- [ ] Serialize Map to JSON, save to localStorage
- [ ] Handle quota exceeded errors (evict oldest 50 entries, retry)

**AC-007: Cache Metrics**
- [ ] Method: `getStats(): { size: number, hitRate: number, evictions: number }`
- [ ] Track cache hits vs misses for hit rate calculation
- [ ] Track total evictions performed
- [ ] Return current cache size

**AC-008: Cache Management**
- [ ] Method: `clear(): void` - Clear all cached anagrams
- [ ] Method: `clearDifficulty(difficulty: number): void` - Clear specific difficulty
- [ ] Method: `preload(anagrams: AnagramSet[]): void` - Bulk load for testing

**AC-009: Unit Tests (25 tests minimum)**
- [ ] Test get() returns null when cache empty
- [ ] Test set() stores anagram in cache
- [ ] Test get() after set() returns same anagram
- [ ] Test LRU eviction at 201st item
- [ ] Test LRU eviction removes oldest timestamp
- [ ] Test localStorage persistence (save/load cycle)
- [ ] Test corrupt JSON handling (reset cache)
- [ ] Test quota exceeded handling (evict and retry)
- [ ] Test cache stats tracking (hits, misses, evictions)
- [ ] Test clear() empties cache completely
- [ ] Test clearDifficulty() only affects target difficulty
- [ ] Test concurrent modifications (multiple tabs scenario)
- [ ] Achieve 100% code coverage for AnagramCache.ts

### Definition of Done
- All 9 ACs completed and verified
- 25+ unit tests passing (100% coverage)
- LRU eviction confirmed working (oldest removed first)
- localStorage persistence survives page refresh
- Quota exceeded errors handled gracefully
- Cache hit rate >60% in integration tests
- Feature flag guards module loading

### Testing Notes
- Integration test: Fill cache to 200, add 50 more, verify oldest 50 evicted
- Persistence test: Save cache, refresh page, verify all 200 entries restored
- Corruption test: Manually corrupt localStorage JSON, verify graceful reset

---

## SCRAM-022: AnagramGenerator Hybrid Logic

**Story:** As the game system, I need AnagramGenerator refactored to support hybrid word generation (cache → API → curated fallback) so that users get unlimited words with zero-impact fallback when APIs fail.

**Priority:** CRITICAL (Core Epic 6 functionality)  
**Story Points:** 5  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 2  
**Dependencies:** SCRAM-018, SCRAM-019, SCRAM-020, SCRAM-021

### Acceptance Criteria

**AC-001: Preserve v2.0.0 Code Path**
- [ ] Keep existing `src/game/AnagramGenerator.ts` unchanged (v2.0.0 behavior)
- [ ] Create `src/game/AnagramGenerator-v3.ts` with hybrid logic
- [ ] Conditional import in `src/main.ts` based on feature flag
- [ ] Verify v2.0.0 tests (110 AnagramGenerator tests) still pass with flag OFF

**AC-002: Mode Configuration**
- [ ] Add property: `mode: 'curated' | 'hybrid' | 'unlimited-only'`
- [ ] Default mode: `'hybrid'`
- [ ] Store mode preference in localStorage: `scramble-word-mode`
- [ ] Method: `setMode(mode): void` - Update mode and persist

**AC-003: Hybrid Generation Flow**
- [ ] Method: `async getAnagram(difficulty): Promise<AnagramSet>`
- [ ] Step 1: If mode === 'curated', return curated anagram (existing logic)
- [ ] Step 2: Check cache (AnagramCache.get(difficulty))
- [ ] Step 3: If cache hit, track analytics and return cached anagram
- [ ] Step 4: If cache miss, try API generation
- [ ] Step 5: If API success, cache result and return
- [ ] Step 6: If API fails AND mode === 'hybrid', fallback to curated
- [ ] Step 7: If API fails AND mode === 'unlimited-only', throw error

**AC-004: API Generation Pipeline**
- [ ] Private method: `async generateFromAPI(difficulty): Promise<AnagramSet>`
- [ ] Call DatamuseAPI.getRandomWord(difficulty)
- [ ] Call WordScrambler.scramble(word)
- [ ] Create AnagramSet with source: 'api'
- [ ] Generate unique ID: `generated-${timestamp}-${word}`
- [ ] Set category: 'API Generated Word'
- [ ] Cache result via AnagramCache.set()
- [ ] Return AnagramSet

**AC-005: Loading State Management**
- [ ] Update GameState interface: Add `gameStatus: 'loading'`
- [ ] Emit 'loading' state when API fetch starts (>100ms delay)
- [ ] Emit 'playing' state when anagram ready
- [ ] Emit 'error' state if unlimited-only mode API fails

**AC-006: Analytics Integration**
- [ ] Track event: `WORD_GENERATION_SOURCE` with { source: 'cache'|'api'|'curated' }
- [ ] Track event: `API_GENERATION_FAILED` with { api: 'datamuse', difficulty, error }
- [ ] Track event: `CACHE_HIT_RATE` every 10 anagrams
- [ ] Track event: `UNLIMITED_MODE_ENABLED` when mode set to unlimited-only

**AC-007: Error Handling**
- [ ] Catch DatamuseAPIError, log to analytics, fallback to curated (hybrid mode)
- [ ] Catch WordScrambler errors, retry with different word (max 3 retries)
- [ ] Catch AnagramCache errors, continue without caching (log warning)
- [ ] Never expose API errors to UI in hybrid mode (silent fallback)

**AC-008: Backward Compatibility**
- [ ] Method signature unchanged: `getAnagram(difficulty): AnagramSet` (now async)
- [ ] Return type unchanged: `AnagramSet` interface
- [ ] Existing curated anagram IDs preserved ('easy-001', etc.)
- [ ] API-generated IDs distinct ('generated-*')
- [ ] Feature flag OFF = synchronous behavior (v2.0.0)

**AC-009: Unit Tests (30 tests minimum)**
- [ ] Test curated mode returns only curated anagrams
- [ ] Test hybrid mode tries cache first
- [ ] Test hybrid mode calls API on cache miss
- [ ] Test hybrid mode falls back to curated on API failure
- [ ] Test unlimited-only mode throws on API failure
- [ ] Test loading state emitted for API calls >100ms
- [ ] Test analytics events tracked correctly
- [ ] Test error handling (API failures, scrambler failures, cache failures)
- [ ] Test backward compatibility (flag OFF = v2.0.0 behavior)
- [ ] Mock all dependencies (DatamuseAPI, WordScrambler, AnagramCache)
- [ ] Achieve 100% code coverage for AnagramGenerator-v3.ts

### Definition of Done
- All 9 ACs completed and verified
- 30+ unit tests passing (100% coverage)
- v2.0.0 tests (110) still pass with flag OFF
- Hybrid flow confirmed: cache → API → curated
- Loading states work correctly
- Analytics tracking all events
- Feature flag guards v3 code loading

### Testing Notes
- Integration test: Full game session using hybrid mode (10 rounds)
- Fallback test: Kill Datamuse API, verify curated fallback seamless
- Performance test: Cache hit = <10ms, API miss = <500ms, fallback = <10ms

---

## SCRAM-023: UI Integration (Settings Toggle & Loading States)

**Story:** As a user, I need a settings toggle to choose between curated, hybrid, and unlimited word modes, and I need loading indicators during API fetches, so that I understand what's happening and can control my experience.

**Priority:** MEDIUM  
**Story Points:** 2  
**Assignee:** Developer  
**Sprint:** Sprint 7, Week 2  
**Dependencies:** SCRAM-022 (AnagramGenerator hybrid)

### Acceptance Criteria

**AC-001: Word Mode Settings Control**
- [ ] Modify `src/ui/SoundSettings.ts` to add word mode section
- [ ] Feature flag guard: Only render if `FEATURE_FLAGS.EPIC_6_ENABLED === true`
- [ ] Add dropdown: `<select id="word-mode">` with 3 options
- [ ] Option 1: "Curated (82 words, offline)" value="curated"
- [ ] Option 2: "Hybrid (unlimited + offline fallback)" value="hybrid" [selected]
- [ ] Option 3: "Unlimited Only (API required)" value="unlimited-only"
- [ ] Add help text: "Hybrid mode tries unlimited first, falls back to curated if offline"

**AC-002: Mode Change Handling**
- [ ] Listen to `change` event on word mode dropdown
- [ ] Call `anagramGenerator.setMode(selectedMode)`
- [ ] Track analytics: `UNLIMITED_MODE_ENABLED` with { mode }
- [ ] Show toast notification: "Word mode updated to [mode]"
- [ ] Persist to localStorage automatically (handled by AnagramGenerator)

**AC-003: Loading State UI**
- [ ] Modify `src/ui/GameUI.ts` to handle 'loading' game status
- [ ] Create method: `showLoadingState()`
- [ ] Render spinner overlay during API fetch (only if >100ms)
- [ ] Message: "Generating word..." with animated spinner
- [ ] Create method: `hideLoadingState()`
- [ ] Remove spinner when anagram ready

**AC-004: Loading State Transitions**
- [ ] Subscribe to GameStore state changes
- [ ] When `gameStatus === 'loading'` → call `showLoadingState()`
- [ ] When `gameStatus === 'playing'` → call `hideLoadingState()`
- [ ] Debounce loading UI (only show if fetch >100ms to avoid flicker)

**AC-005: Mode Indicator in Game UI**
- [ ] Add badge to game header showing current mode
- [ ] Curated mode: "📚 Curated"
- [ ] Hybrid mode: "♾️ Unlimited" (even though hybrid)
- [ ] Unlimited-only mode: "🌐 API Only"
- [ ] Tooltip on hover explaining mode

**AC-006: Offline Detection UI**
- [ ] Detect offline state: `navigator.onLine === false`
- [ ] Show banner in hybrid mode: "📶 Offline - using curated words"
- [ ] Hide banner when back online
- [ ] Show permanent warning in unlimited-only mode: "⚠️ Unlimited mode requires internet"

**AC-007: Accessibility**
- [ ] All controls keyboard navigable (Tab, Enter, Space)
- [ ] Loading spinner has `role="status"` and `aria-live="polite"`
- [ ] Mode dropdown has `aria-label="Word generation mode"`
- [ ] Mode indicator has `aria-label` describing current mode
- [ ] Screen reader announces mode changes

**AC-008: Responsive Design**
- [ ] Settings panel works on mobile (320px width)
- [ ] Loading spinner centered on all screen sizes
- [ ] Mode indicator moves to mobile-friendly position
- [ ] Touch targets ≥44x44px

**AC-009: CSS Styling**
- [ ] Add `.loading-spinner` styles with CSS animation
- [ ] Add `.word-mode-setting` styles matching existing settings
- [ ] Add `.mode-indicator` badge styles
- [ ] Add `.offline-banner` styles (yellow background, info icon)
- [ ] All animations 60fps (use `transform` and `opacity` only)

**AC-010: Unit Tests (15 tests minimum)**
- [ ] Test word mode dropdown renders only when flag ON
- [ ] Test mode change calls AnagramGenerator.setMode()
- [ ] Test analytics event tracked on mode change
- [ ] Test loading spinner shows after 100ms delay
- [ ] Test loading spinner hides when anagram ready
- [ ] Test mode indicator updates when mode changes
- [ ] Test offline banner shows when navigator.onLine false
- [ ] Test accessibility (keyboard navigation, ARIA labels)
- [ ] Achieve 100% code coverage for UI changes

### Definition of Done
- All 10 ACs completed and verified
- 15+ unit tests passing (100% coverage for new UI code)
- Settings toggle works on desktop and mobile
- Loading states smooth (no flicker on fast API)
- Offline detection accurate
- Accessibility validated with screen reader (NVDA)
- Feature flag guards all Epic 6 UI elements

### Testing Notes
- Manual test: Toggle mode, play 10 rounds, verify correct source used
- Accessibility test: Navigate with keyboard only, verify all controls work
- Offline test: Disable network, verify banner appears and curated fallback works

---

## SCRAM-024: Epic 6 Comprehensive Testing Suite

**Story:** As a developer, I need a comprehensive test suite for Epic 6 that validates all components, integration flows, and maintains 100% coverage, so that I have confidence Epic 6 is production-ready and v2.0.0 remains unaffected.

**Priority:** CRITICAL (Quality gate for deployment)  
**Story Points:** 3  
**Assignee:** Test Architect + Developer  
**Sprint:** Sprint 7, Week 2-3  
**Dependencies:** SCRAM-019, SCRAM-020, SCRAM-021, SCRAM-022, SCRAM-023

### Acceptance Criteria

**AC-001: Unit Test Coverage**
- [ ] DatamuseAPI.test.ts: 20 tests (100% coverage)
- [ ] WordScrambler.test.ts: 15 tests (100% coverage)
- [ ] AnagramCache.test.ts: 25 tests (100% coverage)
- [ ] AnagramGenerator-v3.test.ts: 30 tests (100% coverage)
- [ ] UI components tests: 15 tests (100% coverage for Epic 6 UI)
- [ ] Total new tests: 105 minimum
- [ ] Total project tests: 341 (236 v2.0.0 + 105 Epic 6)
- [ ] Coverage: 91%+ maintained

**AC-002: Integration Tests**
- [ ] Test file: `epic6-integration.test.ts` (24 tests minimum)
- [ ] Test: Full game session using hybrid mode (10 rounds)
- [ ] Test: Cache hit rate >60% after 20 rounds
- [ ] Test: API failure fallback (mock Datamuse outage)
- [ ] Test: Offline mode fallback (mock navigator.onLine = false)
- [ ] Test: Mode switching mid-game (curated → hybrid → unlimited)
- [ ] Test: localStorage persistence across sessions
- [ ] Test: Concurrent tab scenario (cache sync)

**AC-003: Feature Flag Tests**
- [ ] Test file: `feature-flags.test.ts` (10 tests)
- [ ] Test: Flag OFF = v2.0.0 behavior (all 236 tests pass)
- [ ] Test: Flag OFF = no Epic 6 code loaded (bundle size check)
- [ ] Test: Flag ON = Epic 6 features available
- [ ] Test: Flag toggle doesn't corrupt state
- [ ] Test: Flag OFF = UI shows no Epic 6 controls

**AC-004: Rollback Validation Tests**
- [ ] Test file: `rollback.test.ts` (12 tests)
- [ ] Test: Deploy with flag OFF, verify v2.0.0 behavior
- [ ] Test: Cache corruption doesn't break curated mode
- [ ] Test: Epic 6 localStorage keys ignored by v2.0.0
- [ ] Test: Switching flag OFF → ON → OFF preserves v2.0.0 data
- [ ] Test: Bundle size <11kb with flag ON, 2.46kb with flag OFF

**AC-005: Performance Tests**
- [ ] Test file: `epic6-performance.test.ts` (8 tests)
- [ ] Test: Cache hit <10ms (average of 100 hits)
- [ ] Test: API miss <500ms (average of 100 misses)
- [ ] Test: Curated fallback <10ms (average of 100 fallbacks)
- [ ] Test: Loading state debounce (no flicker on fast API)
- [ ] Test: No memory leaks (100 rounds, heap size stable)
- [ ] Test: Bundle size <11kb gzipped

**AC-006: Error Handling Tests**
- [ ] Test: DatamuseAPI timeout (500ms)
- [ ] Test: DatamuseAPI network error
- [ ] Test: DatamuseAPI invalid response
- [ ] Test: WordScrambler unable to scramble (max retries)
- [ ] Test: AnagramCache quota exceeded
- [ ] Test: localStorage disabled by user
- [ ] Test: Concurrent modifications (race conditions)

**AC-007: Analytics Tests**
- [ ] Test: `WORD_GENERATION_SOURCE` tracked for each source
- [ ] Test: `API_GENERATION_FAILED` tracked on errors
- [ ] Test: `CACHE_HIT_RATE` calculated correctly
- [ ] Test: `UNLIMITED_MODE_ENABLED` tracked on mode change
- [ ] Test: All events have correct data structure

**AC-008: Accessibility Tests**
- [ ] Test: Keyboard navigation (Tab through all Epic 6 controls)
- [ ] Test: Screen reader announces mode changes (ARIA live regions)
- [ ] Test: Loading spinner accessible (role="status")
- [ ] Test: All buttons have accessible labels
- [ ] Test: Color contrast meets WCAG AA (4.5:1 ratio)

**AC-009: Cross-Browser Tests (Manual)**
- [ ] Chrome 120+ (Windows, macOS, Android)
- [ ] Firefox 120+ (Windows, macOS, Android)
- [ ] Safari 17+ (macOS, iOS)
- [ ] Edge 120+ (Windows)
- [ ] Feature flag toggle works on all browsers
- [ ] localStorage persistence works on all browsers

**AC-010: Test Execution**
- [ ] All 341 tests pass (236 v2.0.0 + 105 Epic 6)
- [ ] Test duration <60 seconds
- [ ] No flaky tests (0% flake rate over 10 runs)
- [ ] CI/CD runs tests on every commit
- [ ] Coverage report generated and reviewed

### Definition of Done
- All 10 ACs completed and verified
- 341 total tests passing (100% pass rate)
- 91%+ code coverage maintained
- No flaky tests
- Performance targets met
- Rollback scenarios validated
- Cross-browser testing complete
- CI/CD pipeline green

### Testing Notes
- Integration test: Use real APIs in `@integration` tests (opt-in)
- Performance test: Run on CI with consistent hardware (Docker container)
- Accessibility test: Automated with Axe + manual screen reader validation

---

## SCRAM-025: Production Deployment with Gradual Rollout

**Story:** As a product manager, I need Epic 6 deployed to production with a gradual rollout plan (staging → canary → full) so that we minimize risk and can rollback instantly if issues arise.

**Priority:** CRITICAL (Final Epic 6 story)  
**Story Points:** 2  
**Assignee:** Developer + DevOps  
**Sprint:** Sprint 7, Week 3  
**Dependencies:** SCRAM-024 (all tests passing)

### Acceptance Criteria

**AC-001: Pre-Deployment Checklist**
- [ ] All 341 tests passing (100%)
- [ ] Code coverage ≥91%
- [ ] Bundle size <11kb gzipped (confirmed)
- [ ] v2.0.0 regression tests pass with flag OFF
- [ ] Rollback procedures documented and tested
- [ ] Team trained on rollback execution

**AC-002: Staging Deployment (Day 0-2)**
- [ ] Environment: `staging.scramble-game.com`
- [ ] Set `VITE_EPIC_6_ENABLED=true` in staging environment
- [ ] Deploy from `feature/epic-6-unlimited-words` branch
- [ ] Smoke test: 20 rounds of gameplay (all 3 modes)
- [ ] Verify analytics tracking (check localStorage)
- [ ] Verify API calls (check Network tab)
- [ ] Success criteria: Zero errors, API success rate >95%

**AC-003: Canary Deployment (Day 3-5)**
- [ ] Merge `feature/epic-6-unlimited-words` to `main` (PR approved)
- [ ] Tag commit: `v3.0.0-canary`
- [ ] Deploy to production with `VITE_EPIC_6_ENABLED=true`
- [ ] Set `VITE_CANARY_PERCENTAGE=10` (10% of users see Epic 6)
- [ ] Monitor for 48 hours:
  - [ ] API success rate >95%
  - [ ] Cache hit rate >60%
  - [ ] User retention unchanged (±1%)
  - [ ] Error rate <0.1%
- [ ] Success criteria: Metrics identical to control group (90% on v2.0.0)

**AC-004: Gradual Rollout (Day 6-12)**
- [ ] Day 6: Increase to 25% (`VITE_CANARY_PERCENTAGE=25`)
- [ ] Day 8: Increase to 50% (`VITE_CANARY_PERCENTAGE=50`)
- [ ] Day 10: Increase to 75% (`VITE_CANARY_PERCENTAGE=75`)
- [ ] Day 12: Full rollout (`VITE_EPIC_6_ENABLED=true`, remove canary)
- [ ] Monitor each step for 24 hours before proceeding
- [ ] Rollback if any metric degrades >2%

**AC-005: Monitoring Dashboard**
- [ ] Set up analytics tracking for Epic 6 metrics
- [ ] Track: API success rate (target >95%)
- [ ] Track: Cache hit rate (target >60%)
- [ ] Track: User retention (target ±1% of baseline)
- [ ] Track: Bundle size (target <11kb)
- [ ] Track: Error rate (target <0.1%)
- [ ] Alert: Email/Slack if any metric out of range

**AC-006: Rollback Preparation**
- [ ] Document Layer 1 rollback (feature flag, <2min)
- [ ] Document Layer 2 rollback (git branch, <5min)
- [ ] Document Layer 3 rollback (commit revert, <10min)
- [ ] Test each rollback procedure in staging
- [ ] Assign rollback on-call rotation (24/7 coverage)

**AC-007: Rollback Triggers**
- [ ] Trigger: API success rate <95% for 1 hour
- [ ] Trigger: User retention drops >2% for 24 hours
- [ ] Trigger: Error rate >0.5% for 1 hour
- [ ] Trigger: Critical bug reported by >3 users
- [ ] Action: Execute Layer 1 rollback immediately

**AC-008: Communication Plan**
- [ ] Internal: Slack announcement before each rollout step
- [ ] Internal: Daily status updates during gradual rollout
- [ ] External: No user-facing announcement (silent rollout)
- [ ] External: If rollback needed, silent revert (no announcement)
- [ ] Post-launch: Blog post after 7 days of stability

**AC-009: Post-Deployment Validation**
- [ ] Verify v3.0.0 deployed successfully (check version number in UI)
- [ ] Verify Epic 6 features available (test word mode toggle)
- [ ] Verify API calls working (check Network tab)
- [ ] Verify analytics tracking (check localStorage)
- [ ] Verify bundle size <11kb (check deployment logs)
- [ ] Verify 341 tests passing in production build

**AC-010: Success Metrics Review (Day 13)**
- [ ] 7 days in production with zero rollbacks
- [ ] API success rate >95% sustained
- [ ] Cache hit rate >60% sustained
- [ ] User retention unchanged (±1%)
- [ ] Bundle size <11kb confirmed
- [ ] Test suite 341/341 passing
- [ ] Zero critical bugs reported
- [ ] Decision: Remove feature flag or continue monitoring

### Definition of Done
- All 10 ACs completed and verified
- Epic 6 deployed to 100% of users
- 7 days of stable production (zero rollbacks)
- All success metrics met
- Rollback procedures validated
- Team confident in Epic 6 stability

### Testing Notes
- Smoke test: Manual testing on production after each rollout step
- Monitoring: Automated dashboard tracking all metrics
- Rollback drill: Practice rollback in staging before production

---

## Epic 6 Summary

**Total Stories:** 8  
**Total Story Points:** 21  
**Target Sprint:** Sprint 7 (3 weeks)  
**Dependencies:** All stories depend on SCRAM-018 (feature flag infrastructure)

**Critical Path:**
SCRAM-018 (1pt) → SCRAM-022 (5pt) → SCRAM-024 (3pt) → SCRAM-025 (2pt) = 11pt

**Parallel Work:**
- SCRAM-019, SCRAM-020, SCRAM-021 can be developed in parallel (week 1)
- SCRAM-023 can be developed during SCRAM-024 (week 2)

**Risk Mitigation:**
- Feature flag protects v2.0.0 completely
- Gradual rollout catches issues early
- Triple-layer rollback plan
- 341 tests validate everything

**Success Criteria:**
- ✅ All 341 tests passing (100%)
- ✅ Bundle size <11kb
- ✅ API success rate >95%
- ✅ Cache hit rate >60%
- ✅ User retention unchanged
- ✅ 7 days production stability
- ✅ Zero rollbacks needed

---

**Ready for Implementation:** ✅ Yes  
**First Story:** SCRAM-018 (Git Branch & Feature Flag Infrastructure)  
**Estimated Completion:** 3 weeks from sprint start
