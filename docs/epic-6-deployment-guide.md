# Epic 6 Deployment & Rollback Guide

**Version:** 3.0.0  
**Last Updated:** December 8, 2025  
**Status:** Implementation Phase  

---

## Quick Reference

| Action | Command | Time |
|--------|---------|------|
| **Layer 1 Rollback** | Update `.env.production` → `VITE_EPIC_6_ENABLED=false` | <2 min |
| **Layer 2 Rollback** | `git checkout main; git push origin main --force` | <5 min |
| **Layer 3 Rollback** | `git revert -m 1 <merge-commit>; git push --force` | <10 min |

---

## Branch Strategy

### Current Branch Structure
```
main (v2.0.0 - PROTECTED)
  └─ feature/epic-6-unlimited-words (v3.0.0 development)
```

### Branch Protection Rules
- **main branch:** 
  - Protected (requires PR approval)
  - Always deployable (v2.0.0)
  - Production source of truth
  
- **feature/epic-6-unlimited-words:**
  - All Epic 6 work happens here
  - Merge to main only after 7-day staging validation
  - Must pass all 341 tests (100%)

---

## Feature Flag Configuration

### Environment Files

**.env.production** (Epic 6 OFF by default)
```bash
VITE_EPIC_6_ENABLED=false
VITE_APP_VERSION=2.0.0
```

**.env.staging** (Epic 6 ON for testing)
```bash
VITE_EPIC_6_ENABLED=true
VITE_APP_VERSION=3.0.0-staging
```

**.env.development** (Epic 6 ON for local dev)
```bash
VITE_EPIC_6_ENABLED=true
VITE_APP_VERSION=3.0.0-dev
```

### Feature Flag Usage

**In Code:**
```typescript
import { FEATURE_FLAGS } from './config/featureFlags';

// Conditional component loading
if (FEATURE_FLAGS.EPIC_6_ENABLED) {
  // Load Epic 6 features
}

// Dynamic imports (code splitting)
const AnagramGenerator = FEATURE_FLAGS.EPIC_6_ENABLED
  ? (await import('./game/AnagramGenerator-v3')).AnagramGenerator
  : (await import('./game/AnagramGenerator')).AnagramGenerator;
```

---

## Three-Layer Rollback Plan

### Layer 1: Feature Flag Toggle (<2 minutes)

**When to Use:** Critical bug detected in Epic 6 functionality

**Procedure:**
```bash
# 1. Update environment variable
cd scramble-game
echo "VITE_EPIC_6_ENABLED=false" > .env.production

# 2. Rebuild
npm run build

# 3. Redeploy
netlify deploy --prod
# OR
vercel deploy --prod
```

**Impact:** 
- Epic 6 completely disabled
- v2.0.0 behavior restored
- No data loss (localStorage preserved)

---

### Layer 2: Git Branch Revert (<5 minutes)

**When to Use:** Feature flag rollback insufficient, deeper code issues

**Procedure:**
```bash
# 1. Switch to main branch (v2.0.0)
git checkout main

# 2. Verify main is clean
git status

# 3. Force deploy from main
git push origin main --force

# 4. Trigger deployment (auto-deploy from main)
```

**Impact:**
- Complete return to v2.0.0 codebase
- Epic 6 code not present
- No data loss (Epic 6 localStorage keys ignored by v2.0.0)

---

### Layer 3: Git Commit Revert (<10 minutes)

**When to Use:** Epic 6 already merged to main, catastrophic failure

**Procedure:**
```bash
# 1. Identify merge commit
git log --oneline --merges
# Output: abc1234 Merge pull request #1 from feature/epic-6-unlimited-words

# 2. Revert merge commit
git revert -m 1 abc1234

# 3. Force push
git push origin main --force

# 4. Redeploy triggers automatically
```

**Impact:**
- Epic 6 code removed from main branch
- Git history preserved (revert commit added)
- No data loss (localStorage backward compatible)

---

## Rollback Testing Checklist

Before Epic 6 launch, validate all rollback procedures:

### Test 1: Feature Flag OFF
- [ ] Deploy with `VITE_EPIC_6_ENABLED=false`
- [ ] Verify v2.0.0 behavior identical (236 tests pass)
- [ ] Verify bundle size 2.46kb (no Epic 6 code loaded)
- [ ] Verify no Epic 6 UI elements visible

### Test 2: Feature Flag Toggle
- [ ] Enable Epic 6 → play 5 rounds
- [ ] Disable Epic 6 → verify v2.0.0 works
- [ ] Re-enable Epic 6 → verify state not corrupted

### Test 3: Cache Isolation
- [ ] Fill Epic 6 cache (20 anagrams)
- [ ] Manually corrupt cache (invalid JSON)
- [ ] Switch to flag OFF → verify v2.0.0 unaffected

### Test 4: Branch Deployment
- [ ] Deploy from main while feature branch exists
- [ ] Verify v2.0.0 deployed (not Epic 6)

### Test 5: Rollback Speed
- [ ] Time Layer 1 rollback (<2 min target)
- [ ] Time Layer 2 rollback (<5 min target)
- [ ] Time Layer 3 rollback (<10 min target)

---

## Deployment Phases

### Phase 1: Staging (Day 0-2)
```bash
# Deploy to staging
git checkout feature/epic-6-unlimited-words
npm run build -- --mode staging
netlify deploy --alias staging
```

**Success Criteria:**
- Zero errors in 48 hours
- Bundle size <11kb
- 341 tests passing (100%)

---

### Phase 2: Canary (Day 3-5)

**Update .env.production:**
```bash
VITE_EPIC_6_ENABLED=true
VITE_CANARY_PERCENTAGE=10
VITE_APP_VERSION=3.0.0-canary
```

**Deploy:**
```bash
npm run build -- --mode production
netlify deploy --prod
```

**Monitor:**
- API success rate >95%
- Cache hit rate >60%
- User retention ±1% of control group
- Error rate <0.1%

**Rollback Trigger:** Any metric fails for 1 hour

---

### Phase 3: Gradual Rollout (Day 6-12)

**Day 6:** `VITE_CANARY_PERCENTAGE=25`  
**Day 8:** `VITE_CANARY_PERCENTAGE=50`  
**Day 10:** `VITE_CANARY_PERCENTAGE=75`  
**Day 12:** `VITE_CANARY_PERCENTAGE=100`

Monitor at each step for 24 hours before proceeding.

---

### Phase 4: Default Enabled (Day 13+)

**After 7 days stable:**
```bash
# Remove canary percentage
VITE_EPIC_6_ENABLED=true
VITE_APP_VERSION=3.0.0

# Merge to main
git checkout main
git merge feature/epic-6-unlimited-words
git push origin main

# Tag release
git tag v3.0.0
git push origin v3.0.0
```

---

## Emergency Contacts

**On-Call Rotation:**
- Week 1: Developer (Epic 6 implementation)
- Week 2: Tech Lead (rollback authority)
- Week 3+: Team rotation

**Escalation Path:**
1. Monitor alert → On-call developer (5 min)
2. Investigation → Tech lead (15 min)
3. Rollback decision → Product manager (30 min)
4. Post-mortem → Full team (24 hours)

---

## Success Metrics

Epic 6 considered stable when:
- ✅ 7 days in production with zero rollbacks
- ✅ API success rate >95% sustained
- ✅ Cache hit rate >60% sustained
- ✅ User retention unchanged (±1%)
- ✅ Bundle size <11kb confirmed
- ✅ Test suite 341/341 passing (100%)
- ✅ Zero critical bugs reported

**Then:** Remove feature flag code, Epic 6 becomes default behavior.

---

## Quick Commands

```bash
# Check current branch
git branch --show-current

# Check feature flag status
grep VITE_EPIC_6_ENABLED .env.production

# Run tests (flag OFF)
VITE_EPIC_6_ENABLED=false npm test

# Run tests (flag ON)
VITE_EPIC_6_ENABLED=true npm test

# Build production (flag OFF)
npm run build -- --mode production

# Build staging (flag ON)
npm run build -- --mode staging

# Check bundle size
npm run build -- --mode production
ls -lh dist/assets/*.js
```

---

**Document Version:** 1.0  
**Next Review:** After Phase 2 (Canary) completion
