# Epic 6: Unlimited Word Generation - Architecture Document

**Version:** 3.0.0 (extends v2.0.0)  
**Epic:** SCRAM-017 - Unlimited Word Generation  
**Status:** Architecture Design Complete  
**Date:** December 8, 2025  
**Architect:** Winston  

---

## Executive Summary

Epic 6 extends Scramble's word generation from 82 curated anagrams to unlimited API-driven words while maintaining offline capability and performance. Uses **hybrid architecture** with intelligent fallback: Datamuse API → Persistent Cache → Curated Set.

**Architectural Approach:** Progressive Enhancement with Zero-Degradation Fallback

---

## Key Architectural Decisions

| Decision | Choice | Rationale | Version |
|----------|--------|-----------|---------|
| **Word Source API** | Datamuse API | Free, 100k req/day, frequency filtering for difficulty | Latest (2024) |
| **Scrambling Algorithm** | Smart Scrambling | Maximize challenge, avoid obvious patterns | Custom |
| **Cache Strategy** | Persistent LRU (200 max) | Survive refresh, reduce API calls, ~20kb | localStorage |
| **Fallback Strategy** | Silent Cascade | Cache → API → Curated (seamless UX) | 3-tier |
| **User Mode** | Settings Toggle | 'curated', 'hybrid' (default), 'unlimited-only' | Configurable |
| **Validation Strategy** | Trust Datamuse | Skip double-validation (faster 200ms vs 700ms) | Single-pass |

---

## Project Structure (Epic 6 Additions)

```
src/
├── api/
│   ├── WordsAPI.ts              # [EXISTING] Word validation
│   └── DatamuseAPI.ts           # [NEW] Random word generation with frequency filtering
├── game/
│   ├── AnagramGenerator.ts      # [MODIFIED] Add hybrid generation logic
│   └── WordScrambler.ts         # [NEW] Smart scrambling algorithm
├── utils/
│   ├── AnagramCache.ts          # [NEW] LRU cache with localStorage persistence
│   └── analytics.ts             # [MODIFIED] Add Epic 6 events
├── ui/
│   └── SoundSettings.ts         # [MODIFIED] Add word mode toggle
└── data/
    └── anagrams.ts              # [UNCHANGED] Fallback curated set
```

---

## Epic 6 Component Architecture

### 1. DatamuseAPI Client

**File:** `src/api/DatamuseAPI.ts`

**Responsibility:** Fetch random words filtered by difficulty (word frequency)

**Interface:**
```typescript
class DatamuseAPI {
  private readonly baseURL = 'https://api.datamuse.com/words';
  private readonly timeout = 500; // ms
  
  async getRandomWord(difficulty: 1 | 2 | 3 | 4 | 5): Promise<string> {
    // Map difficulty to word length and frequency
    const { minLength, maxLength, minFreq } = this.getDifficultyParams(difficulty);
    
    // Fetch words matching criteria
    // sp=?????: wildcard pattern for length
    // md=f: include frequency data
    // max=100: get pool of words
    const url = `${this.baseURL}?sp=${'?'.repeat(minLength)}&md=f&max=100`;
    
    const response = await this.fetchWithTimeout(url);
    const words = await response.json();
    
    // Filter by frequency and select random
    return this.selectByFrequency(words, minFreq);
  }
  
  private getDifficultyParams(difficulty: number) {
    // Level 1: 4-5 letters, high frequency (common words)
    // Level 2: 5-6 letters, medium-high frequency
    // Level 3: 6-7 letters, medium frequency
    // Level 4: 7-8 letters, medium-low frequency
    // Level 5: 8+ letters, low frequency (rare words)
  }
}
```

**Error Handling:**
- 500ms timeout via AbortController
- Network errors throw (caught by AnagramGenerator)
- Invalid responses throw
- Rate limiting: 100k/day (no client throttling needed)

---

### 2. WordScrambler (Smart Scrambling)

**File:** `src/game/WordScrambler.ts`

**Responsibility:** Create challenging scrambles that avoid obvious patterns

**Algorithm:**
```typescript
class WordScrambler {
  scramble(word: string): string {
    const letters = word.split('');
    let scrambled: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    
    do {
      scrambled = this.shuffle(letters).join('');
      attempts++;
    } while (
      !this.isGoodScramble(word, scrambled) && 
      attempts < MAX_ATTEMPTS
    );
    
    return scrambled;
  }
  
  private isGoodScramble(original: string, scrambled: string): boolean {
    // Rule 1: Must differ from original
    if (scrambled === original) return false;
    
    // Rule 2: Avoid common prefixes (TH, UN, RE, etc.)
    const commonPrefixes = ['TH', 'UN', 'RE', 'IN', 'DE', 'EX'];
    if (commonPrefixes.some(p => scrambled.startsWith(p))) return false;
    
    // Rule 3: Avoid common suffixes (ING, ED, LY, etc.)
    const commonSuffixes = ['ING', 'ED', 'LY', 'ER', 'EST'];
    if (commonSuffixes.some(s => scrambled.endsWith(s))) return false;
    
    // Rule 4: Check visual similarity (Levenshtein distance > 2)
    if (this.visualDistance(original, scrambled) < 3) return false;
    
    return true;
  }
  
  private shuffle(array: string[]): string[] {
    // Fisher-Yates shuffle
  }
}
```

**Quality Assurance:**
- Maximum 5 shuffle attempts
- Falls back to best attempt if criteria not met
- Consistent difficulty across all word lengths

---

### 3. AnagramCache (LRU Persistence)

**File:** `src/utils/AnagramCache.ts`

**Responsibility:** Persistent LRU cache for API-generated anagrams

**Data Structure:**
```typescript
interface CachedAnagram {
  anagram: AnagramSet;
  timestamp: number;
  accessCount: number;
}

class AnagramCache {
  private cache: Map<string, CachedAnagram> = new Map();
  private readonly MAX_SIZE = 200;
  private readonly STORAGE_KEY = 'scramble-generated-cache';
  
  constructor() {
    this.loadFromStorage();
  }
  
  get(difficulty: number): AnagramSet | null {
    // Get cached anagram for difficulty
    // Update access timestamp (LRU)
    // Return anagram or null
  }
  
  set(difficulty: number, anagram: AnagramSet): void {
    // Add to cache
    // Evict LRU if size > MAX_SIZE
    // Persist to localStorage
  }
  
  private evictLRU(): void {
    // Find oldest access timestamp
    // Remove from cache
  }
  
  private loadFromStorage(): void {
    // Load from localStorage
    // Deserialize Map
  }
  
  private saveToStorage(): void {
    // Serialize Map
    // Save to localStorage
  }
}
```

**Storage Strategy:**
- Key: `scramble-generated-cache`
- Format: JSON serialized Map
- Size: ~20kb (200 anagrams × 100 bytes)
- Eviction: Least Recently Used (LRU)
- Persistence: Survives page refresh

---

### 4. AnagramGenerator (Hybrid Logic)

**File:** `src/game/AnagramGenerator.ts` (Modified)

**New Architecture:**
```typescript
class AnagramGenerator {
  private mode: 'curated' | 'hybrid' | 'unlimited-only';
  private datamuseAPI: DatamuseAPI;
  private anagramCache: AnagramCache;
  private wordScrambler: WordScrambler;
  
  async getAnagram(difficulty: 1 | 2 | 3 | 4 | 5): Promise<AnagramSet> {
    // Mode: curated - always use curated set
    if (this.mode === 'curated') {
      return this.getCuratedAnagram(difficulty);
    }
    
    // Mode: hybrid or unlimited - try cache first
    const cached = this.anagramCache.get(difficulty);
    if (cached) {
      analytics.track(AnalyticsEvent.WORD_GENERATION_SOURCE, { source: 'cache' });
      return cached;
    }
    
    // Mode: hybrid or unlimited - try API
    try {
      const generated = await this.generateFromAPI(difficulty);
      analytics.track(AnalyticsEvent.WORD_GENERATION_SOURCE, { source: 'api' });
      return generated;
    } catch (error) {
      analytics.track(AnalyticsEvent.API_GENERATION_FAILED, { 
        api: 'datamuse', 
        difficulty,
        error: error.message 
      });
      
      // Mode: hybrid - fallback to curated
      if (this.mode === 'hybrid') {
        analytics.track(AnalyticsEvent.WORD_GENERATION_SOURCE, { source: 'curated-fallback' });
        return this.getCuratedAnagram(difficulty);
      }
      
      // Mode: unlimited-only - throw error (no fallback)
      throw new Error('API generation failed and unlimited-only mode active');
    }
  }
  
  private async generateFromAPI(difficulty: number): Promise<AnagramSet> {
    // 1. Fetch word from Datamuse
    const word = await this.datamuseAPI.getRandomWord(difficulty);
    
    // 2. Scramble the word
    const scrambled = this.wordScrambler.scramble(word);
    
    // 3. Create AnagramSet
    const anagram: AnagramSet = {
      id: `generated-${Date.now()}-${word}`,
      scrambled,
      solution: word,
      difficulty,
      category: 'generated',
      hints: {
        category: 'API-generated word',
        firstLetter: word[0]
      }
    };
    
    // 4. Cache for reuse
    this.anagramCache.set(difficulty, anagram);
    
    return anagram;
  }
  
  private getCuratedAnagram(difficulty: number): AnagramSet {
    // [EXISTING LOGIC] Select from curated ANAGRAM_SETS
  }
  
  setMode(mode: 'curated' | 'hybrid' | 'unlimited-only'): void {
    this.mode = mode;
    StorageHelper.save('scramble-word-mode', mode);
  }
}
```

**Cascade Logic:**
1. **Cache Check** (instant, 0ms)
2. **API Generation** (200-500ms)
3. **Curated Fallback** (instant, 0ms) - only in hybrid mode

---

## Integration Points

### GameStore Integration

**Changes to:** `src/game/GameStore.ts`

```typescript
class GameStore {
  private anagramGenerator: AnagramGenerator;
  
  async startNewRound(): Promise<void> {
    // Show loading state (API latency)
    this.updateState({ gameStatus: 'loading' });
    
    try {
      // Async anagram generation
      const anagram = await this.anagramGenerator.getAnagram(this.state.difficulty);
      
      this.updateState({
        currentAnagram: anagram.scrambled,
        solution: anagram.solution,
        currentAnagramId: anagram.id,
        gameStatus: 'playing'
      });
      
      this.timer.start();
    } catch (error) {
      // Handle unlimited-only mode failure
      this.updateState({ gameStatus: 'error' });
      this.notifySubscribers();
    }
  }
}
```

**New State:**
- `gameStatus: 'loading'` - API fetch in progress (show spinner)
- `gameStatus: 'error'` - API failed in unlimited-only mode

---

### UI Integration

**Changes to:** `src/ui/SoundSettings.ts`

**Add Word Mode Toggle:**
```typescript
class SoundSettings {
  private wordModeToggle: HTMLSelectElement;
  
  private renderWordModeControl(): void {
    const container = document.createElement('div');
    container.className = 'setting-control';
    container.innerHTML = `
      <label for="word-mode">Word Source:</label>
      <select id="word-mode">
        <option value="curated">Curated (82 words, offline)</option>
        <option value="hybrid" selected>Hybrid (unlimited, fallback)</option>
        <option value="unlimited-only">Unlimited Only (API required)</option>
      </select>
      <p class="setting-hint">Hybrid mode tries API first, falls back to curated if offline</p>
    `;
    
    this.wordModeToggle = container.querySelector('#word-mode');
    this.wordModeToggle.addEventListener('change', (e) => {
      const mode = (e.target as HTMLSelectElement).value;
      this.anagramGenerator.setMode(mode as any);
      analytics.track(AnalyticsEvent.UNLIMITED_MODE_ENABLED, { mode });
    });
  }
}
```

**Loading State UI:**
```typescript
class GameUI {
  private showLoadingState(): void {
    // Show spinner during API fetch (200-500ms)
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<div class="spinner"></div><p>Generating word...</p>';
    this.container.appendChild(spinner);
  }
  
  private hideLoadingState(): void {
    const spinner = this.container.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
  }
}
```

---

## Storage Strategy (Epic 6 Additions)

### LocalStorage Keys

```typescript
'scramble-generated-cache'   // NEW: LRU cache of generated anagrams (~20kb)
'scramble-word-mode'          // NEW: User's mode preference (curated/hybrid/unlimited)
```

**Total Storage Impact:** +20-25kb

---

## Data Architecture

### Extended AnagramSet Interface

```typescript
interface AnagramSet {
  id: string;                   // Format: 'generated-{timestamp}-{word}' or 'easy-001'
  scrambled: string;            
  solution: string;             
  difficulty: 1 | 2 | 3 | 4 | 5;
  category?: string;            // 'generated' for API words, specific for curated
  hints: {
    category: string;
    firstLetter: string;
  };
  source?: 'curated' | 'api' | 'cache';  // NEW: Track origin for analytics
}
```

---

## API Contracts

### Datamuse API

**Endpoint:** `https://api.datamuse.com/words`

**Request Pattern:**
```
GET https://api.datamuse.com/words?sp=?????&md=f&max=100

Parameters:
- sp: Wildcard pattern (???? for 4-letter words)
- md=f: Include word frequency data
- max: Maximum results (100)
```

**Response Format:**
```json
[
  {
    "word": "table",
    "score": 100,
    "tags": ["f:24.56"]  // Frequency per million words
  },
  ...
]
```

**Rate Limiting:**
- 100,000 requests/day
- No authentication required
- No client-side throttling needed

**Timeout:** 500ms (AbortController)

---

## Security Architecture

**No new security concerns** - Datamuse API:
- No authentication (public API)
- No user data transmitted
- HTTPS enforced
- No CORS issues (public access)

**Privacy Maintained:**
- Cache stored locally only
- No external tracking
- User mode preference local-only

---

## Performance Considerations

### Epic 6 Performance Budget

| Metric | v2.0.0 Baseline | Epic 6 Target | Acceptable |
|--------|-----------------|---------------|------------|
| **Bundle Size** | 2.46kb | <8kb | <11kb |
| **Load Time** | 1.1s | <1.5s | <2s |
| **Between-Round Latency** | 0ms | 200ms avg | 500ms max |
| **Cache Hit Rate** | N/A | 60%+ | 40%+ |
| **Test Coverage** | 91% | 91%+ | 80%+ |

### Latency Breakdown

**Curated Mode (v2.0.0):**
```
getAnagram() → 0ms (in-memory)
Total: 0ms
```

**Hybrid Mode (Epic 6):**
```
Cache Check → 0ms (instant)
  OR
API Fetch → 200-500ms (network)
  + Scrambling → 1-5ms (algorithm)
  + Cache Save → 5-10ms (localStorage)
  OR (on API failure)
Curated Fallback → 0ms (in-memory)

Best Case: 0ms (cache hit)
Typical Case: 200-300ms (API fetch)
Worst Case: 500ms (API timeout → fallback)
```

**User Experience:**
- Show loading spinner after 100ms (prevent flicker)
- Cache hit: No loading state (instant)
- API fetch: Brief "Generating word..." message

---

## Deployment Architecture

**No infrastructure changes** - remains static hosting.

**Environment Variables:**
```bash
VITE_APP_VERSION=3.0.0          # Version bump
# No new API keys needed (Datamuse is public)
```

**Build Impact:**
```
v2.0.0 Bundle: 2.46kb gzipped
Epic 6 Additions:
  - DatamuseAPI.ts: ~2kb
  - WordScrambler.ts: ~1kb
  - AnagramCache.ts: ~2kb
  - AnagramGenerator changes: ~1kb
  - UI changes: ~1kb

Estimated v3.0.0 Bundle: ~9.5kb gzipped
Target: <11kb gzipped
```

---

## Testing Strategy

### New Test Files

**1. `tests/unit/api/DatamuseAPI.test.ts`** (~20 tests)
- Mock API responses
- Test difficulty-to-frequency mapping
- Test timeout handling
- Test error scenarios
- Test word selection logic

**2. `tests/unit/game/WordScrambler.test.ts`** (~15 tests)
- Test scrambling algorithm quality
- Verify rules (no prefixes/suffixes)
- Test edge cases (short words, repeated letters)
- Verify visual distance calculation
- Test shuffle randomness

**3. `tests/unit/utils/AnagramCache.test.ts`** (~25 tests)
- Test LRU eviction
- Test localStorage persistence
- Test cache hit/miss scenarios
- Test size limits (200 max)
- Test serialization/deserialization

**4. `tests/unit/game/AnagramGenerator-hybrid.test.ts`** (~30 tests)
- Test mode switching (curated/hybrid/unlimited)
- Test cascade logic (cache → API → curated)
- Test fallback scenarios
- Mock DatamuseAPI
- Test analytics tracking
- Integration tests for full flow

**5. `tests/integration/epic6-flow.test.ts`** (~15 tests)
- End-to-end hybrid mode gameplay
- Test all 3 modes complete game sessions
- Test offline behavior
- Test cache persistence across sessions

**Total New Tests:** ~105 tests
**Target Total:** 236 + 105 = 341 tests
**Coverage Target:** Maintain 91%+

---

## Rollback Strategy

**Critical Requirement:** v2.0.0 MUST remain deployable and unaffected during Epic 6 development.

### Git Branch Strategy

**Branch Structure:**
```
main (v2.0.0 - PROTECTED, production-ready)
  └─ feature/epic-6-unlimited-words (v3.0.0 development)
```

**Branch Protection:**
- `main` branch: Protected, requires PR + review
- All Epic 6 work: Exclusively on `feature/epic-6-unlimited-words`
- Merge to `main`: Only after full validation (7-day staging + zero incidents)

**Benefits:**
- v2.0.0 always deployable from `main`
- Epic 6 isolated on feature branch
- Instant fallback: Deploy from `main` if Epic 6 fails

---

### Feature Flag Architecture

**Environment Variables:**
```bash
# .env.production (default: Epic 6 OFF)
VITE_EPIC_6_ENABLED=false
VITE_APP_VERSION=2.0.0

# .env.staging (Epic 6 ON for testing)
VITE_EPIC_6_ENABLED=true
VITE_APP_VERSION=3.0.0-staging

# .env.canary (10% rollout)
VITE_EPIC_6_ENABLED=true
VITE_CANARY_PERCENTAGE=10
VITE_APP_VERSION=3.0.0-canary
```

**Feature Flag Implementation:**
```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  EPIC_6_ENABLED: import.meta.env.VITE_EPIC_6_ENABLED === 'true',
  CANARY_PERCENTAGE: parseInt(import.meta.env.VITE_CANARY_PERCENTAGE || '0', 10)
} as const;

// src/main.ts
import { FEATURE_FLAGS } from './config/featureFlags';

let AnagramGenerator;
if (FEATURE_FLAGS.EPIC_6_ENABLED) {
  // Dynamic import - only loads Epic 6 code when enabled
  AnagramGenerator = (await import('./game/AnagramGenerator-v3')).AnagramGenerator;
} else {
  // Original v2.0.0 code
  AnagramGenerator = (await import('./game/AnagramGenerator')).AnagramGenerator;
}

// All Epic 6 UI elements guarded
if (FEATURE_FLAGS.EPIC_6_ENABLED) {
  renderWordModeToggle(); // Only show when enabled
}
```

**Feature Flag Benefits:**
- Toggle Epic 6 without code changes
- Zero v2.0.0 code execution when flag OFF
- A/B testing capability (canary percentage)
- Instant rollback via environment variable

---

### Three-Layer Rollback Plan

#### Layer 1: Instant Feature Flag Rollback (<2 minutes)

**Trigger:** Critical Epic 6 bug detected in production

**Procedure:**
```bash
# 1. Update environment variable
export VITE_EPIC_6_ENABLED=false

# 2. Rebuild (fast)
npm run build  # ~1s

# 3. Redeploy
netlify deploy --prod  # or vercel deploy --prod
```

**Rollback Time:** <2 minutes  
**Impact:** Epic 6 completely disabled, v2.0.0 behavior restored  
**Data Loss:** None (localStorage preserved)

---

#### Layer 2: Git Branch Revert (<5 minutes)

**Trigger:** Feature flag rollback insufficient, code issues persist

**Procedure:**
```bash
# 1. Switch to main branch (v2.0.0)
git checkout main

# 2. Force deploy from main
git push origin main --force

# 3. Trigger deployment
# (Netlify/Vercel auto-deploys from main)
```

**Rollback Time:** <5 minutes  
**Impact:** Complete return to v2.0.0 codebase  
**Data Loss:** None (Epic 6 localStorage keys ignored by v2.0.0)

---

#### Layer 3: Git Commit Revert (Nuclear Option)

**Trigger:** Epic 6 merged to main, catastrophic issues discovered

**Procedure:**
```bash
# 1. Identify merge commit
git log --oneline --merges

# 2. Revert merge commit
git revert -m 1 <merge-commit-hash>

# 3. Force push
git push origin main --force

# 4. Redeploy
```

**Rollback Time:** <10 minutes  
**Impact:** Epic 6 code removed from main branch  
**Data Loss:** None (localStorage keys backward compatible)

---

### Rollback Testing Requirements

**Before Epic 6 Launch:**
1. **Test Feature Flag OFF:** Deploy with flag OFF, verify v2.0.0 behavior identical
2. **Test Feature Flag Toggle:** Enable → Disable → Enable, verify no state corruption
3. **Test Cache Isolation:** Corrupt Epic 6 cache, verify v2.0.0 unaffected
4. **Test Branch Deployment:** Deploy from `main` while `feature/epic-6` exists
5. **Test Rollback Speed:** Time each rollback layer (<2min, <5min, <10min targets)

**Quality Gate:** All rollback tests must pass before Epic 6 merge to main

---

### Deployment Strategy (Gradual Rollout)

**Phase 1: Staging (Day 0-2)**
- Environment: staging.scramble-game.com
- Feature flag: `VITE_EPIC_6_ENABLED=true`
- Traffic: Internal testing only
- Success criteria: Zero errors, bundle <11kb, tests 100%

**Phase 2: Canary (Day 3-5)**
- Environment: production
- Feature flag: `VITE_EPIC_6_ENABLED=true` + `VITE_CANARY_PERCENTAGE=10`
- Traffic: 10% of production users (random selection)
- Monitoring: API success rate, cache hit rate, user retention
- Success criteria: Metrics identical to v2.0.0 control group

**Phase 3: Gradual Rollout (Day 6-12)**
- Day 6: 25% traffic
- Day 8: 50% traffic
- Day 10: 75% traffic
- Day 12: 100% traffic
- Monitor at each step, rollback if issues

**Phase 4: Default Enabled (Day 13+)**
- Update default: `VITE_EPIC_6_ENABLED=true` in .env.production
- Remove feature flag code (cleanup)
- Epic 6 becomes standard behavior

**Rollback Trigger:** Any phase shows <95% API success rate OR user retention drops >2%

---

### Version Compatibility Matrix

| Version | Branch | Feature Flag | Bundle Size | Tests | Status |
|---------|--------|--------------|-------------|-------|--------|
| v2.0.0 | main | N/A | 2.46kb | 236 pass | ✅ Production |
| v3.0.0-dev | feature/epic-6 | true | ~9.5kb | 341 pass | 🚧 Development |
| v3.0.0-staging | feature/epic-6 | true | ~9.5kb | 341 pass | 🧪 Testing |
| v3.0.0-canary | main (merged) | true (10%) | ~9.5kb | 341 pass | 🐤 Partial rollout |
| v3.0.0 | main (merged) | true (100%) | ~9.5kb | 341 pass | 🎯 Full release |

---

### Rollback Communication Plan

**Internal Team:**
- Slack alert: "Epic 6 rollback initiated - reason: [X]"
- Update status page: "Temporarily reverted to v2.0.0"
- Post-mortem: Root cause analysis within 24 hours

**Users:**
- No user-facing announcement (silent rollback)
- Users on "unlimited mode" automatically switch to "curated mode"
- No functionality loss (v2.0.0 feature-complete)

---

### Data Persistence During Rollback

**localStorage Keys:**
```typescript
// Epic 6 new keys (ignored by v2.0.0)
'scramble-generated-cache'   // Epic 6 anagram cache (~20kb)
'scramble-word-mode'          // User mode preference

// v2.0.0 existing keys (preserved during rollback)
'scramble-analytics'          // Still tracked
'scramble-sound-enabled'      // Still works
'scramble-best-streak'        // Still valid
'scramble-total-score'        // Still accurate
```

**Rollback Data Safety:**
- v2.0.0 ignores Epic 6 localStorage keys
- Epic 6 keys remain in browser (no data loss)
- If Epic 6 re-enabled: Cache and preferences restored
- Users can manually clear localStorage if desired

---

### Emergency Rollback Playbook

**Scenario 1: API Outage (Datamuse down)**
- **Detection:** API success rate <50%
- **Action:** None required (hybrid mode falls back to curated)
- **User impact:** Seamless (users see curated 82 words)

**Scenario 2: Cache Corruption Bug**
- **Detection:** localStorage quota exceeded errors
- **Action:** Deploy cache clearing script via CDN
- **User impact:** Minor (cache rebuilt from API)

**Scenario 3: Bundle Size Bloat (>15kb)**
- **Detection:** Build analysis shows unexpected growth
- **Action:** Feature flag rollback immediately
- **User impact:** None (instant revert to v2.0.0)

**Scenario 4: Test Failures Post-Merge**
- **Detection:** CI/CD shows test failures on main
- **Action:** Git revert merge commit + force push
- **User impact:** None (bad code never deployed)

**Scenario 5: User Retention Drop (>2%)**
- **Detection:** Analytics show engagement decrease
- **Action:** Gradual rollback (75% → 50% → 25% → 0%)
- **User impact:** Proportional (fewer users see Epic 6)

---

### Success Metrics (No Rollback Needed)

Epic 6 considered stable when:
- ✅ 7 days in production with zero rollbacks
- ✅ API success rate >95% sustained
- ✅ Cache hit rate >60% sustained
- ✅ User retention unchanged (±1%)
- ✅ Bundle size <11kb confirmed
- ✅ Test suite 341/341 passing (100%)
- ✅ Zero critical bugs reported

**Then:** Remove feature flag, Epic 6 becomes default, cleanup v2.0.0 code paths.

---

## Success Metrics (Epic 6)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Bundle Size** | <11kb | Vite build analysis |
| **API Success Rate** | >95% | Analytics tracking |
| **Cache Hit Rate** | >60% | Analytics tracking |
| **Between-Round Latency** | <300ms avg | Performance.now() |
| **Test Coverage** | >91% | Vitest coverage report |
| **User Adoption** | >50% use hybrid | Analytics (mode selection) |
| **Offline Graceful Degradation** | 100% | Manual testing |

---

## Architecture Decision Records

### ADR-001: Datamuse API over Wordnik

**Decision:** Use Datamuse API for word generation

**Context:** Need free, reliable API with frequency data for difficulty mapping

**Alternatives:**
- Wordnik (requires API key, 10k/day limit)
- Random Word API (no frequency data)
- Local dictionary file (+8MB bundle)

**Rationale:**
- Free, no authentication
- 100k requests/day (sufficient)
- Frequency data enables difficulty mapping
- Active maintenance (API stable)

**Consequences:**
- Dependency on external service
- Mitigated by hybrid fallback

---

### ADR-002: Skip Double Validation (Trust Datamuse)

**Decision:** Do not validate Datamuse words via WordsAPI

**Context:** Validation adds 500ms latency (700ms total vs 200ms)

**Alternatives:**
- Validate all API words (slower, safer)
- Local dictionary validation (faster, less accurate)

**Rationale:**
- Datamuse returns real English words (high quality)
- 500ms latency unacceptable for gameplay
- User can report invalid words (analytics tracking)
- WordsAPI validation still used for user submissions

**Consequences:**
- Rare edge case: invalid word from Datamuse
- Mitigated by user reporting + analytics monitoring

---

### ADR-003: Persistent LRU Cache over Session-Only

**Decision:** Use localStorage for persistent cache (survives refresh)

**Context:** Reduce API calls, improve offline capability

**Alternatives:**
- sessionStorage (cleared on tab close)
- No cache (every word from API)
- IndexedDB (overkill for 200 items)

**Rationale:**
- Improve user experience (no repeated words across sessions)
- Reduce API dependency (60%+ cache hit rate expected)
- 20kb storage acceptable (user can clear)
- LRU eviction prevents unbounded growth

**Consequences:**
- 20kb localStorage usage
- Cache management complexity
- Mitigated by clear cache UI option

---

## Conclusion

Epic 6 architecture extends Scramble to unlimited word generation while maintaining:
- ✅ **Performance:** <11kb bundle, <300ms average latency
- ✅ **Reliability:** Triple fallback (cache → API → curated)
- ✅ **Offline:** Graceful degradation to 82 curated words
- ✅ **Privacy:** No external tracking, local-only storage
- ✅ **Quality:** Smart scrambling maintains challenge level
- ✅ **Testability:** 91%+ coverage maintained

**Risk Assessment:** LOW
- No breaking changes to v2.0.0
- Rollback strategy defined
- Progressive enhancement approach
- Fallback ensures zero user impact

**Ready for Implementation:** ✅ Yes

---

**Next Phase:** Create Epic 6 Stories & Implementation Plan
