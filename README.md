# 🔤 Scramble - Anagram Word Game

A lightweight, fast-loading anagram word game built with vanilla TypeScript and Vite. Players solve scrambled letters to form valid English words within 60 seconds.

## 🚀 Current Status

**Milestone:** `v0.1.0-foundation` ✅ **COMPLETED**  
**Sprint Progress:** 2/22 story points (9% of Phase 1)  
**Last Updated:** November 25, 2025

### ✅ Completed Stories
- **SCRAM-001**: Project Setup & Architecture Foundation (2 points)

### 🔄 Next Priority  
- **SCRAM-016**: Testing Infrastructure (5 points)

## 🛠️ Tech Stack

**Core Technologies:**
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Lightning-fast build tool with rolldown-vite
- **Vitest** - Modern testing framework
- **Happy DOM** - Lightweight DOM environment for testing

**Architecture:**
- **Pattern:** Modular Monolith (Client-Side)
- **Modules:** game/, api/, ui/, data/, utils/
- **Bundling:** Code splitting with lazy loading
- **Deployment:** Static hosting (JAMstack)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup
```bash
# Clone and navigate
cd scramble-game

# Install dependencies
npm install

# Start development server (starts in ~1.1s)
npm run dev
# → Opens http://localhost:5173

# Available commands
npm run build          # Production build (~400ms)
npm run preview        # Preview production build  
npm run test           # Run tests with Vitest
npm run test:ui        # Run tests with UI
npm run lint           # TypeScript validation
npm run type-check     # TypeScript compilation check
```

## 📁 Project Structure

```
src/
├── main.ts              # Application entry point
├── game/
│   └── GameEngine.ts    # Core game logic & state
├── api/
│   └── WordsAPI.ts      # Word validation API client
├── ui/
│   └── GameUI.ts        # DOM manipulation & events
├── data/
│   ├── anagrams.ts      # Curated anagram datasets
│   └── dictionary.ts    # Local word validation fallback
└── utils/
    ├── storage.ts       # localStorage/sessionStorage helpers
    └── analytics.ts     # Event tracking & performance monitoring
```

### Path Mapping
Clean imports with TypeScript path mapping:
```typescript
import { GameEngine } from '@game/GameEngine';
import { WordsAPIClient } from '@api/WordsAPI';
import { GameUI } from '@ui/GameUI';
import { ANAGRAM_SETS } from '@data/anagrams';
import { StorageHelper } from '@utils/storage';
```

## 🎯 Game Concept

**Core Gameplay:**
- Player receives scrambled letters (e.g., "AERT")
- Must use ALL letters exactly once to form a valid English word (e.g., "TEAR")
- 60-second timer creates urgency
- Progressive difficulty (4-8 letters)
- Scoring based on word length, speed, and streak bonuses

**Features:**
- ✅ Offline play with local dictionary fallback
- ✅ Responsive design (mobile-first)
- ✅ No user accounts required
- ✅ Privacy-focused (localStorage only)
- 🔄 200+ curated anagrams (planned)
- 🔄 Category hints and learning features (planned)

## 🔧 Performance

**Current Benchmarks:**
- **Dev Server Startup:** 1126ms (target: <1000ms) ✅
- **Production Build:** 394ms (excellent) ✅  
- **Bundle Size:** 2.44kB + chunks (optimal) ✅
- **Load Time:** <2s (target met) ✅

## 📋 Development Roadmap

### Phase 1: Core Foundation (Week 1) - *In Progress*
- [x] **SCRAM-001:** Project Setup (2 pts) ✅
- [ ] **SCRAM-016:** Testing Infrastructure (5 pts)
- [ ] **SCRAM-002:** Game State Management (3 pts)
- [ ] **SCRAM-003:** Anagram Generation (5 pts)  
- [ ] **SCRAM-004:** Timer System (3 pts)
- [ ] **SCRAM-005:** Scoring System (4 pts)

### Phase 2: API Integration (Week 2)
- [ ] **SCRAM-006:** WordsAPI Integration (5 pts)
- [ ] **SCRAM-007:** Local Dictionary Fallback (4 pts)
- [ ] **SCRAM-008:** Anagram Validation (3 pts)

### Phase 3: User Interface (Week 3) 
- [ ] **SCRAM-009:** Responsive Layout (4 pts)
- [ ] **SCRAM-010:** Text Input Interface (3 pts)
- [ ] **SCRAM-011:** Timer Visualization (3 pts)
- [ ] **SCRAM-012:** Skip Functionality (3 pts)

### Phase 4: Polish & Deploy (Week 4)
- [ ] **SCRAM-013:** Sound Effects (2 pts)
- [ ] **SCRAM-014:** Analytics Integration (3 pts)  
- [ ] **SCRAM-015:** Production Deployment (4 pts)

**Total Scope:** 56 story points across 16 stories

## 🏗️ Architecture Highlights

**Design Philosophy:** "Boring technology that scales"
- Vanilla TypeScript over complex frameworks
- Static hosting over server infrastructure  
- Progressive enhancement over feature complexity
- Performance over technical sophistication

**Key Architectural Decisions:**
- **No Backend:** Pure client-side game with API integration
- **Offline First:** Local dictionary fallback ensures reliability
- **Mobile Performance:** Aggressive code splitting and lazy loading
- **Future-Proof:** Easy migration paths to frameworks if needed

## 🔖 Version Control

**Current Milestone:** `v0.1.0-foundation`

**Rollback to Foundation:**
```bash
git checkout v0.1.0-foundation
```

**Compare with Foundation:**  
```bash
git diff v0.1.0-foundation
```

See [MILESTONES.md](../MILESTONES.md) for detailed version history.

## 📄 Documentation

- [Architecture Document](../docs/architecture.md) - Technical architecture and decisions
- [Epic Breakdown](../docs/epics-and-stories.md) - User stories and implementation details
- [Sprint Status](../docs/sprint-status.yaml) - Current progress tracking

## 🤝 Development Workflow

**Story Development:**
1. Stories follow SCRAM-XXX naming convention
2. All acceptance criteria must be satisfied
3. Code review required before completion
4. Testing mandatory for all new features
5. Documentation updated with each milestone

**Quality Gates:**
- TypeScript strict mode compilation ✅
- Test coverage >80% (when testing infrastructure complete)
- Performance benchmarks maintained
- Cross-browser compatibility verified

---

*Built with ❤️ using vanilla TypeScript and modern web standards*