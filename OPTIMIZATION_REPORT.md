# Site Optimization Report - HeatCheck.io

## ✅ FIXES APPLIED

### 1. **CRITICAL: Parallelized Game Log Fetching**
**Problem**: Trends pages fetched 50+ player game logs sequentially (15+ second load times)
**Solution**: Changed to `Promise.all()` for parallel fetching
**Impact**: **~10x faster** - now fetches all logs simultaneously
**Files Fixed**:
- `/lib/mlb-streaks.ts` - Lines 22-60
- `/lib/nba-streaks.ts` - Lines 230-250
- `/lib/nfl-streaks.ts` - Lines 270-320

### 2. **Dynamic Rendering for Trends Pages**
**Problem**: Pages used stale build-time data
**Solution**: Added `export const dynamic = 'force-dynamic'`
**Impact**: Always fetches fresh API data
**Files**: All 3 trends pages (MLB/NBA/NFL)

### 3. **Removed Non-Functional Dashboard**
**Problem**: NFL Redzone had no real data
**Solution**: Removed entire dashboard and navigation links
**Impact**: Cleaner UX, faster builds

---

## 🚨 REMAINING CRITICAL ISSUES

### Performance

**1. NFL Matchup - Sequential Player Stats**
- **Issue**: Fetches 10+ player overviews one-by-one per game
- **Location**: `/lib/nfl-api.ts` `buildLiveMatchup()`
- **Fix**: Parallelize with `Promise.all()`
- **Priority**: HIGH

**2. No Caching on Streak Detection**
- **Issue**: Recalculates all streaks on every page visit
- **Solution**: Add Redis/in-memory cache with 1hr TTL
- **Priority**: MEDIUM

**3. Large Bundle Size**
- **Issue**: All static fallback data included in bundle
- **Solution**: Lazy load static data or move to CDN
- **Priority**: MEDIUM

### Data Completeness

**4. NBA/NFL Trends Use Hardcoded Player IDs**
- **Issue**: Not pulling from ESPN leaders endpoint
- **Location**:
  - `/lib/nba-streaks.ts` lines 206-227 (20 hardcoded IDs)
  - `/lib/nfl-streaks.ts` lines 264-266 (QB/RB/WR hardcoded)
- **Solution**: Fetch from ESPN leaders API first, then analyze top N
- **Priority**: HIGH

**5. Pitcher Arsenal Data Missing**
- **Issue**: Pitching dashboard doesn't show pitch types/usage
- **Location**: `/app/mlb/pitching-stats/page.tsx` line 33
- **Solution**: Fetch from MLB Stats API pitch-by-pitch data
- **Priority**: MEDIUM

**6. NRFI Stats Are Static**
- **Issue**: Can't calculate real NRFI probabilities
- **Solution**: Fetch historical data or add ML model
- **Priority**: LOW (complex feature)

**7. NBA H2H Historical Data Static**
- **Issue**: Game history/defense matchups use sample data
- **Solution**: Fetch from ESPN team schedule history
- **Priority**: MEDIUM

---

## 🎯 RECOMMENDED IMPROVEMENTS

### Architecture

**1. Create Shared Utilities**
```typescript
// lib/utils/streak-builder.ts
export async function buildStreakTrends<T>(
  players: T[],
  detectFunction: (player: T, logs: GameLog[]) => Streak[],
  options: { minGames: number, maxPlayers: number }
): Promise<Trend[]> {
  // Generic streak builder - eliminates 600+ lines of duplication
}
```

**2. Extract Navigation Component**
```typescript
// components/shared/sports-navbar.tsx
export function SportsNavbar({
  sport: 'mlb' | 'nba' | 'nfl',
  currentPage: string
}) {
  // Eliminates duplicate header code across 12 pages
}
```

**3. Create Date Navigation Hook**
```typescript
// hooks/useDateNavigation.ts
export function useDateNavigation(defaultDate?: string) {
  // Eliminates duplicate date logic across 5 pages
}
```

### Performance

**4. Add Loading States**
- All pages should show skeleton loaders during API calls
- Currently shows nothing while fetching

**5. Add Error Boundaries**
- Wrap each dashboard in error boundary
- Currently crashes on API failures

**6. Reduce SWR Deduping**
- Current: 1 hour (`dedupingInterval: 3600000`)
- Recommended: 5-10 minutes for live sports data

**7. Lazy Load Static Data**
```typescript
// Instead of importing all at build time
const fallbackData = await import(`@/lib/${sport}-trends-data`)
```

### Code Quality

**8. TypeScript Strictness**
- Enable `strict: true` in tsconfig
- Fix all `any` types
- Add proper ESPN API response types

**9. Add Unit Tests**
- Streak detection logic (critical business logic)
- Transform functions
- Filter logic

**10. Add API Rate Limiting**
- Protect ESPN/MLB API calls
- Implement exponential backoff on failures

---

## 📊 PERFORMANCE BENCHMARKS (Estimated)

### Before Optimizations
| Page | Load Time | API Calls | Status |
|------|-----------|-----------|--------|
| MLB Trends | 18s | 50 sequential | 🔴 Critical |
| NBA Trends | 12s | 20 sequential | 🔴 Critical |
| NFL Trends | 15s | 13 sequential | 🔴 Critical |
| NFL Matchup | 8s | 10 sequential | 🟡 Slow |

### After Applied Fixes
| Page | Load Time | API Calls | Status |
|------|-----------|-----------|--------|
| MLB Trends | ~2-3s | 50 parallel | 🟢 Good |
| NBA Trends | ~1-2s | 20 parallel | 🟢 Good |
| NFL Trends | ~1-2s | 13 parallel | 🟢 Good |
| NFL Matchup | 8s | 10 sequential | 🟡 Still needs fix |

### With All Recommendations
| Page | Load Time | API Calls | Status |
|------|-----------|-----------|--------|
| MLB Trends | <1s | Cached | 🟢 Excellent |
| NBA Trends | <1s | Cached | 🟢 Excellent |
| NFL Trends | <1s | Cached | 🟢 Excellent |
| NFL Matchup | ~2s | 10 parallel + cached | 🟢 Good |

---

## 🛠️ IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Do Now)
- ✅ Parallelize game log fetching (DONE)
- ✅ Force dynamic rendering (DONE)
- ✅ Remove redzone dashboard (DONE)
- ⏳ Parallelize NFL matchup player stats
- ⏳ Fix NBA/NFL trends to use ESPN leaders

### Phase 2: High-Value Improvements (This Week)
- Add loading skeletons
- Add error boundaries
- Extract shared navigation component
- Add caching layer (Redis/memory)
- Reduce SWR deduping interval

### Phase 3: Nice-to-Haves (Next Sprint)
- Lazy load static data
- Add pitcher arsenal data
- Extract common utilities
- Add unit tests
- Implement rate limiting

### Phase 4: Advanced Features (Future)
- Real-time updates via WebSockets
- ML-based NRFI predictions
- Historical H2H data fetching
- Advanced analytics dashboard

---

## 📈 EXPECTED IMPACT

**User Experience**
- 10x faster page loads (15s → 1-2s)
- No more loading timeouts
- Fresh data on every visit
- Better error handling

**Developer Experience**
- 600+ lines of duplicate code eliminated
- Easier to add new sports/features
- Better type safety
- Testable business logic

**Cost/Infrastructure**
- Reduced API calls with caching
- Lower Vercel function execution time
- Better SEO (faster page loads)

---

## 🎯 NEXT STEPS

1. **Test the parallelization fixes** locally
2. **Deploy and monitor** Vercel logs for errors
3. **Implement Phase 1** remaining items
4. **Measure actual performance** with Vercel Analytics
5. **Iterate** based on real user data

---

Generated: 2026-02-08
Session: https://claude.ai/code/session_01RbtATDjnBba816nH1oCfAv
