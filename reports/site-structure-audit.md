# HeatCheck HQ — Site Structure & Navigation Realignment Audit

> **Branch:** `audit/site-structure`
> **Date:** 2026-02-19
> **Scope:** Analysis and planning only — NO code changes
> **Addenda:** Check My Prop dashboard review, Onboarding bug analysis

---

## Table of Contents

1. [Phase 1 — Current State Map](#phase-1--current-state-map)
   - [1A. Navigation Audit](#1a-navigation-audit)
   - [1B. Route Inventory](#1b-route-inventory)
   - [1C. Landing Page vs Product Alignment](#1c-landing-page-vs-product-alignment)
   - [1D. Conversion Path Audit](#1d-conversion-path-audit)
   - [1E. Component Consistency Check](#1e-component-consistency-check)
   - [1F. Check My Prop Dashboard Review](#1f-check-my-prop-dashboard-review)
   - [1G. Onboarding System Review](#1g-onboarding-system-review)
2. [Phase 2 — Problem Identification](#phase-2--problem-identification)
3. [Phase 3 — Realignment Proposal](#phase-3--realignment-proposal)
4. [Phase 4 — Execution Plan](#phase-4--execution-plan)

---

## Phase 1 — Current State Map

### 1A. Navigation Audit

#### Two Navigation Systems

The site uses **two completely separate navigation systems** that never appear together:

| System | File | Appears On | Key Links |
|--------|------|-----------|-----------|
| **Landing Navbar** | `components/landing/navbar.tsx` | `/` (landing page only) | Dashboards, Features, Pricing, Blog, Tools dropdown, Sport dropdowns |
| **DashboardShell** | `components/dashboard-shell.tsx` | All `/mlb/*`, `/nba/*`, `/nfl/*`, `/check`, `/situation-room`, `/criteria` pages | Sport nav, Tool dropdown, QuickAccessBar, Breadcrumbs |

**Exception:** Sport hub pages (`/mlb`, `/nba`, `/nfl`) use **neither** system — they have their own standalone header with logo + sport subtitle + links to other sport hubs.

#### Landing Navbar Structure

```
Navbar
├── Logo → /
├── Dashboards → /#dashboards
├── Features → /#features
├── Pricing → /#pricing
├── Blog → /blog
├── Tools (mega-dropdown)
│   ├── Analyze: Check My Prop → /check
│   ├── Game Day: Situation Room → /situation-room
│   └── Track: Alerts → /criteria
├── MLB dropdown (7 dashboards)
├── NBA dropdown (4 dashboards)
├── NFL dropdown (3 dashboards)
└── Auth buttons (Sign In / Get Started)
```

#### DashboardShell Structure

```
DashboardShell
├── Header
│   ├── Logo → /
│   ├── Sport nav (MLB | NBA | NFL tabs)
│   │   └── Each tab shows sport-specific dashboard links
│   └── Tool dropdown (same 3 categories as Navbar)
│       ├── Analyze: Check My Prop
│       ├── Game Day: Situation Room
│       └── Track: Alerts
├── QuickAccessBar
│   ├── Check, Situation Room, Alerts (tool shortcuts)
│   └── MLB, NBA, NFL (sport shortcuts to hub pages)
├── Breadcrumbs (context-aware with sport hierarchy)
├── WelcomeModal (conditional on first visit)
├── OnboardingTooltip (per-page tips)
└── {children} (page content inside max-w-[1440px])
```

#### Sport Hub Pages (Standalone)

```
Sport Hub Header
├── Logo → /
├── Sport Name subtitle
└── Other sport links (e.g., from MLB hub: NBA, NFL)
```

These pages list all dashboards for that sport as cards with Free/Pro badges, linking directly to each dashboard. They act as a directory but use a completely different navigation pattern than both the landing page and the dashboards themselves.

#### Footer (Landing Page Only)

```
Footer
├── Product: /#dashboards, /#features, /#pricing, /blog
├── MLB: NRFI, Weather, Due for HR, Hitting Stats, Pitching Stats, Hot Hitters, Streaks
├── NBA: First Basket, DVP, H2H, Streaks
├── NFL: DVP, Matchup, Streaks
├── Support: /#support
├── Legal: /privacy, /terms
└── Social: x.com/heatcheckhq
```

---

### 1B. Route Inventory

#### Complete Route Map

| Route | Page Type | Auth Gating | Tier | DashboardShell? | Notes |
|-------|-----------|-------------|------|-----------------|-------|
| `/` | Landing | None | Public | No (Navbar) | Marketing page |
| `/blog` | Content | None | Public | No | Blog index |
| `/blog/[slug]` | Content | None | Public | No | Blog post |
| `/privacy` | Legal | None | Public | No | Privacy policy |
| `/terms` | Legal | None | Public | No | Terms of service |
| `/auth/sign-up` | Auth | None | Public | No | Registration |
| `/auth/sign-up-success` | Auth | None | Public | No | Post-signup confirmation |
| `/auth/login` | Auth | None | Public | No | Login |
| `/checkout` | Commerce | None | Public | No | Stripe checkout (guest + auth) |
| `/checkout/return` | Commerce | None | Public | No | Post-payment confirmation |
| `/account` | Account | Auth required | Free+ | No | Subscription + referrals |
| `/mlb` | Sport Hub | None | Public | **No** (standalone) | MLB dashboard directory |
| `/nba` | Sport Hub | None | Public | **No** (standalone) | NBA dashboard directory |
| `/nfl` | Sport Hub | None | Public | **No** (standalone) | NFL dashboard directory |
| `/mlb/nrfi` | Dashboard | UserTierProvider | Public | **Yes** | NRFI data + SignupGate upsell |
| `/mlb/weather` | Dashboard | UserTierProvider | Public | **Yes** | Weather data |
| `/mlb/due-for-hr` | Dashboard | UserTierProvider | Free | **Yes** | Due for HR |
| `/mlb/hitting-stats` | Dashboard | ProtectedPage | Pro | **Yes** | Hitter vs Pitcher |
| `/mlb/pitching-stats` | Dashboard | ProtectedPage | Pro | **Yes** | Pitching Stats |
| `/mlb/hot-hitters` | Dashboard | ProtectedPage | Pro | **Yes** | Hot Hitters |
| `/mlb/streaks` | Dashboard | ProtectedPage | Pro | **Yes** | MLB Streak Tracker |
| `/nba/first-basket` | Dashboard | UserTierProvider | Public | **Yes** | First Basket scorer data |
| `/nba/defense-vs-position` | Dashboard | UserTierProvider | Free | **Yes** | NBA DVP |
| `/nba/head-to-head` | Dashboard | ProtectedPage | **⚠️ Pro** | **Yes** | NBA H2H — **tier mismatch** |
| `/nba/streaks` | Dashboard | ProtectedPage | Pro | **Yes** | NBA Streak Tracker |
| `/nfl/defense-vs-position` | Dashboard | UserTierProvider | Free | **Yes** | NFL DVP |
| `/nfl/matchup` | Dashboard | ProtectedPage | Pro | **Yes** | NFL Matchup |
| `/nfl/streaks` | Dashboard | ProtectedPage | Pro | **Yes** | NFL Streak Tracker |
| `/check` | Tool | ProtectedPage | Free | **Yes** | Check My Prop |
| `/situation-room` | Tool | ProtectedPage | Pro | **Yes** | Situation Room |
| `/criteria` | Tool | ProtectedPage | **⚠️ Free** | **Yes** | Alerts — **pathname bug** |

**Total pages:** 31 routes (14 sport dashboards, 3 tools, 3 sport hubs, 11 utility/marketing)

#### Access Control Registry (`lib/access-control.ts`)

| Tier | Routes |
|------|--------|
| **Public** | `/mlb/nrfi`, `/mlb/weather`, `/nba/first-basket` |
| **Free** | `/check`, `/mlb/due-for-hr`, `/nba/defense-vs-position`, `/nfl/defense-vs-position`, `/nba/head-to-head` |
| **Pro** | `/situation-room`, `/nba/streaks`, `/mlb/streaks`, `/nfl/streaks`, `/mlb/hitting-stats`, `/mlb/pitching-stats`, `/mlb/hot-hitters`, `/nfl/matchup` |
| **Missing** | `/criteria` (not registered at all), `/mlb/weather` (in ROUTE_ACCESS but no SignupGate) |

---

### 1C. Landing Page vs Product Alignment

#### Landing Page Sections Inventory

| Section | `id` attribute | Content | Links Out |
|---------|---------------|---------|-----------|
| Hero | — | Headline + 3 preview dashboard links + CTA | `/mlb/nrfi`, `/nba/first-basket`, `/nfl/matchup`, `/#pricing`, `/auth/sign-up` |
| Sports Section | `dashboards` | Lists all 14 dashboards by sport | All 14 dashboard routes |
| Features Section | `features` | 6 features described | None |
| Pricing Section | `pricing` | Free ($0), Pro Monthly ($12/mo), Pro Annual ($100/yr) | `/auth/sign-up` (Free), `/checkout` (Pro) |
| FAQ Section | `faq` | 6 Q&As | None |
| CTA Section | — | AuthCta | `/auth/sign-up` |
| Support Section | `support` | 3 email options | `mailto:admin@heatcheckhq.io` |

#### Alignment Issues

| What Landing Page Says | What Actually Exists | Status |
|------------------------|---------------------|--------|
| 14 dashboards listed | 14 dashboard routes exist | ✅ Aligned |
| "Heatmap Tables" feature | Present in dashboards | ✅ Aligned |
| "Trend Detection" feature | Streak trackers implement this | ✅ Aligned |
| "Deep Filtering" feature | Filters on all dashboards | ✅ Aligned |
| "H2H Breakdowns" feature | `/nba/head-to-head` | ✅ Aligned |
| "Pitch Arsenal" feature | `/mlb/hitting-stats` has pitch data | ✅ Aligned |
| "Injury Tracking" feature | Present in H2H + Situation Room | ✅ Aligned |
| — | **Check My Prop** (core tool) | ❌ **NOT mentioned in Features section** |
| — | **Situation Room** (flagship Pro tool) | ❌ **NOT mentioned in Features section** |
| — | **Alerts/Criteria** (Pro tool) | ❌ **NOT mentioned in Features section** |
| Free tier: "All free dashboards" | 3 public + 5 free dashboards | ✅ Aligned |
| Pro tier: "All pro dashboards" | 8 pro dashboards + tools | ⚠️ Tools not mentioned in pricing |
| Hero links to `/nfl/matchup` | NFL Matchup is Pro-only | ⚠️ Hero promotes Pro page to anonymous users |

**Critical Gap:** The three core tools (Check My Prop, Situation Room, Alerts) are the primary post-consolidation value proposition but are **completely absent from the landing page's Features section**. The Features section still describes dashboard-level features rather than the tools themselves.

#### Navbar Tools Dropdown

After the recent consolidation, the Tools dropdown in both Navbar and DashboardShell has only **3 items** (one per category). This feels sparse and may not convey the breadth of the product.

---

### 1D. Conversion Path Audit

#### Path 1: Anonymous → Free Account

```
Landing page (/)
  → "Get Started Free" CTA
  → /auth/sign-up (email/password or Google OAuth)
  → /auth/sign-up-success (email confirmation prompt)
  → Email confirmation click
  → Redirects to... ⚠️ (redirect target unclear — depends on ?redirect param)
```

**Issues:**
- Post-signup redirect is inconsistent — depends on whether a `redirect` query param was set
- No default post-signup destination that guides new users to a valuable first experience
- Welcome modal appears on first dashboard visit (via localStorage), not immediately after signup

#### Path 2: Anonymous → Pro Subscriber

```
Landing page (/)
  → "Upgrade to Pro" in Pricing section
  → /checkout (Stripe embedded checkout)
  → /checkout/return (confirmation page)
  → "Explore dashboards" button → /mlb ⚠️
```

**Issues:**
- Post-checkout lands on `/mlb` sport hub — a directory page, not an experience
- Should land on a Pro-exclusive page to immediately demonstrate value (e.g., Situation Room or Check My Prop)
- Guest checkout creates account but the welcome modal will still trigger on first dashboard visit

#### Path 3: Free → Pro Upgrade

```
Dashboard page (any Pro-gated)
  → ProGate overlay ("Upgrade to Pro")
  → /checkout
  → /checkout/return
  → "Explore dashboards" → /mlb ⚠️
```

**Issues:**
- Same `/mlb` landing issue
- User came from a specific Pro dashboard they wanted to use — should return to that dashboard after checkout

#### Path 4: Returning User (New Device)

```
User opens site on new device/browser
  → / (landing page, not recognized as logged in)
  → /auth/login
  → Redirected to... (depends on ?redirect param, defaults unclear)
  → First dashboard visit → WelcomeModal shown AGAIN ⚠️
```

**Issues:**
- **Onboarding bug:** `isOnboarded()` checks `localStorage.getItem("hchq-onboarded")` which is device-specific. Returning users on new devices always see the welcome modal.
- No "remember me" or session persistence guidance

#### Path 5: In-Product Navigation (Dashboard → Dashboard)

```
User on /mlb/nrfi
  → DashboardShell sport nav (MLB tab) → sees all MLB dashboards
  → Clicks "Streaks" → /mlb/streaks (Pro-gated)
  → If not Pro → ProGate overlay → /checkout
  → After checkout → /mlb (not back to /mlb/streaks) ⚠️
```

#### Path 6: Sport Hub → Dashboard

```
User visits /mlb (hub page)
  → Sees all MLB dashboards as cards
  → Clicks "Hot Hitters" card → /mlb/hot-hitters
  → ⚠️ Navigation "resets" — goes from standalone hub layout to DashboardShell
```

**Issue:** The transition from sport hub (standalone header) to dashboard (DashboardShell) is jarring — completely different navigation chrome.

#### Conversion Path Summary

| Path | Start | End | Quality |
|------|-------|-----|---------|
| Anon → Free | Landing CTA | Sign-up success page | ⚠️ Unclear post-signup destination |
| Anon → Pro | Landing Pricing | `/mlb` hub | ❌ Should land on Pro feature |
| Free → Pro | ProGate overlay | `/mlb` hub | ❌ Should return to original dashboard |
| Return User | Login | First dashboard | ❌ Onboarding re-triggers |
| Hub → Dashboard | Sport hub | Dashboard | ⚠️ Layout discontinuity |
| Dashboard → Dashboard | DashboardShell nav | Dashboard | ✅ Smooth within shell |

---

### 1E. Component Consistency Check

#### Layout Wrappers by Page Type

| Page Type | Wrapper Pattern | Consistent? |
|-----------|----------------|-------------|
| **Sport dashboards** | Layout.tsx: `ProtectedPage` or `UserTierProvider` → Page.tsx: `DashboardShell` content | ✅ Mostly consistent |
| **Check My Prop** | Layout.tsx: `ProtectedPage` → Page.tsx: `DashboardShell` + own `max-w-6xl` | ⚠️ Width mismatch |
| **Situation Room** | No layout.tsx → Page.tsx: `ProtectedPage` → `AppShell` | ⚠️ Different wrapper pattern |
| **Criteria** | No layout.tsx → Page.tsx: `ProtectedPage` (with `/check` pathname bug) → `AppShell` | ❌ Bug + different pattern |
| **Sport hubs** | No auth → Standalone header | ❌ Completely different nav |
| **Landing page** | Navbar + sections | ✅ (correctly separate) |

#### Container Width Patterns

| Component/Page | Max Width | Padding | Notes |
|----------------|-----------|---------|-------|
| DashboardShell content area | `max-w-[1440px]` | `px-4 sm:px-6` | Standard for all dashboards |
| Check My Prop page | `max-w-6xl` (1152px) | `px-4 sm:px-6` | ❌ **Narrower than standard** |
| Criteria page | `max-w-3xl` (768px) | — | ❌ **Much narrower** (form-based) |
| Situation Room | `max-w-[1440px]` | `px-4 sm:px-6` | ✅ Standard |

#### Card Styling Patterns

Standard pattern across dashboards:
```
rounded-xl border border-border bg-card p-4 sm:p-6
```

Check My Prop uses this consistently in its sub-components (PropInput, ConvergenceBreakdown, NarrativeFlags), which is good.

**Deviation:** VerdictBanner uses gradient backgrounds (`bg-gradient-to-r`) which is intentional for emphasis.

#### Typography Hierarchy (Dashboard Standard)

| Level | Pattern | Used Consistently? |
|-------|---------|-------------------|
| Page title | `text-lg sm:text-xl font-semibold text-foreground` | ⚠️ Check uses `text-2xl sm:text-3xl font-bold` |
| Subtitle | `text-sm text-muted-foreground` | ✅ |
| Card title | `text-lg font-semibold` | ✅ |
| Section label | `text-sm font-semibold uppercase tracking-wider text-muted-foreground` | ✅ |
| Body | `text-sm text-muted-foreground` | ✅ |
| Data values | `font-mono` | ✅ |

Check My Prop's page title is larger and bolder (`text-2xl sm:text-3xl font-bold`) than the dashboard standard (`text-lg sm:text-xl font-semibold`).

#### Auth Gating Consistency

| Dashboard | `access-control.ts` Tier | Actual Layout Gating | Consistent? |
|-----------|--------------------------|---------------------|-------------|
| MLB NRFI | `public` | UserTierProvider (no gate) | ✅ |
| MLB Weather | `public` | UserTierProvider (no gate) | ✅ |
| NBA First Basket | `public` | UserTierProvider (no gate) | ✅ |
| MLB Due for HR | `free` | UserTierProvider | ✅ |
| NBA DVP | `free` | UserTierProvider | ✅ |
| NFL DVP | `free` | UserTierProvider | ✅ |
| **NBA Head-to-Head** | **`free`** | **`ProtectedPage` (Pro)** | ❌ **MISMATCH** |
| MLB Hitting Stats | `pro` | ProtectedPage | ✅ |
| All other Pro dashboards | `pro` | ProtectedPage | ✅ |
| Check My Prop | `free` | ProtectedPage | ✅ |
| Situation Room | `pro` | ProtectedPage | ✅ |
| **Criteria** | **Not in ROUTE_ACCESS** | **ProtectedPage (pathname="/check")** | ❌ **Missing + Bug** |

#### Onboarding Tooltip Coverage

`onboarding-tooltip.tsx` has tips for 13 dashboard pages:

| Has Tip | Missing Tip |
|---------|-------------|
| MLB: NRFI, Weather, Due for HR, Hitting Stats, Pitching Stats, Hot Hitters, Streaks | — |
| NBA: First Basket, DVP, H2H, Streaks | — |
| NFL: DVP, Matchup, Streaks | — |
| — | **Check My Prop** ❌ |
| — | **Situation Room** ❌ |
| — | **Criteria/Alerts** ❌ |

---

### 1F. Check My Prop Dashboard Review

#### Current Structure

```
DashboardShell (subtitle="Validate any prop bet")
└── <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
    ├── H1: "Check My Prop" (text-2xl sm:text-3xl font-bold)
    ├── Subtitle (text-muted-foreground)
    ├── PropInput (player/stat/line search form)
    ├── [If result loaded:]
    │   ├── VerdictBanner (gradient card with over/under verdict)
    │   ├── Grid (lg:grid-cols-[320px_1fr])
    │   │   ├── Left: HeatRingSVG (visual ring chart)
    │   │   └── Right: ConvergenceBreakdown (7-factor analysis)
    │   ├── NarrativeFlags (horizontal scrolling pills)
    │   ├── PropSpectrumChart (distribution chart)
    │   ├── SpectrumOverlays (ProGated)
    │   ├── MatchupContext (matchup details)
    │   ├── GameLogTimeline (recent game logs)
    │   └── SimilarSituations (ProGated)
    └── [If no result:] Empty state
```

#### Alignment Issues with Dashboard Standards

| Aspect | Dashboard Standard | Check My Prop | Action Needed |
|--------|-------------------|---------------|---------------|
| **Container width** | `max-w-[1440px]` (1440px) | `max-w-6xl` (1152px) | Widen to match |
| **Page title size** | `text-lg sm:text-xl font-semibold` | `text-2xl sm:text-3xl font-bold` | Reduce to match |
| **Vertical padding** | `py-4 sm:py-8` | `py-6 sm:py-10` | Reduce to match |
| **Card patterns** | `rounded-xl border border-border bg-card p-4 sm:p-6` | Same ✅ | — |
| **Color tokens** | Semantic (emerald, red, yellow) | Same ✅ | — |
| **Font patterns** | `font-mono` for data | Same ✅ | — |
| **Loading states** | Centering + Loader2 + text | Same ✅ | — |

#### Improvement Opportunities

1. **Container Width:** Widening to `max-w-[1440px]` would let the two-column HeatRing/Convergence layout breathe more and feel consistent with other dashboards.

2. **Page Title:** The oversized title wastes vertical space. Reducing to the standard `text-lg sm:text-xl` with the DashboardShell subtitle handling the page description would be more consistent.

3. **Pro-Gated Sections:** `SpectrumOverlays` and `SimilarSituations` use `ProGate` inline. Other dashboards gate at the layout level via `ProtectedPage`. Consider whether partial gating (showing some content free, some Pro) is the intended pattern — if so, document this as the standard approach for tools vs dashboards.

4. **Deep Linking:** The URL param support (`?player=X&stat=Y&line=Z`) is excellent and unique to this page. Consider promoting this feature — shareable prop check links could be a viral growth mechanism.

5. **Empty State:** When no prop has been checked, the page shows minimal guidance. Consider adding:
   - Popular/trending props to check
   - Recent checks by the user (if logged in)
   - Sample prop walkthrough

6. **Missing Onboarding Tip:** No tooltip for Check My Prop in the onboarding system. This is arguably the most important page to onboard users on.

---

### 1G. Onboarding System Review

#### Current Implementation

**Files:**
- `components/welcome-modal.tsx` — Full-screen modal on first authenticated visit
- `components/onboarding-tooltip.tsx` — Per-page contextual tips

**Welcome Modal Flow:**
1. `DashboardShell` calls `isOnboarded()` → checks `localStorage.getItem("hchq-onboarded")`
2. If `false` AND user is authenticated → shows WelcomeModal
3. User selects sport preference or clicks "Skip" → calls `setOnboarded()` → writes `localStorage.setItem("hchq-onboarded", "true")`
4. After sport selection, navigates to sport hub page

**Onboarding Tooltip Flow:**
1. DashboardShell checks `localStorage.getItem("hchq-onboarding-dismissed")` per page
2. Shows page-specific tips for 13 dashboard pages
3. User can dismiss individual page tips

#### The Bug

**Root Cause:** Both systems use `localStorage` which is:
- **Device-specific** — not synced across devices
- **Browser-specific** — clearing browser data resets it
- **Not tied to user account** — a user who signs in on a new computer will see all onboarding again

**Code:**
```typescript
// welcome-modal.tsx
const ONBOARDED_KEY = "hchq-onboarded"
export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(ONBOARDED_KEY) === "true"
}
```

**Impact:** Every returning user on a new device experiences the full onboarding flow again — welcome modal, sport selection, and all page-level tooltips. This is frustrating for paying Pro users who switch devices.

#### Proposed Fix

Move onboarding state to **Supabase user metadata**:

1. On `setOnboarded()`, write to both localStorage (for instant reads) AND Supabase `auth.users.raw_user_meta_data.onboarded = true`
2. On `isOnboarded()`, check localStorage first (fast path), then fall back to Supabase metadata if localStorage is empty
3. On login, sync Supabase onboarding state to localStorage (hydrate local cache)
4. Same pattern for per-page tooltip dismissals: store dismissed pages in user metadata as an array

This provides:
- ✅ Fast reads (localStorage first)
- ✅ Cross-device persistence (Supabase backup)
- ✅ Returning user recognition on new devices
- ✅ No breaking change for existing users (localStorage still checked)

#### Additional Issue: `/criteria` Pathname Bug

In `app/criteria/page.tsx`, the `ProtectedPage` component receives `pathname="/check"` instead of `pathname="/criteria"`:
```tsx
<ProtectedPage pathname="/check"> // ⚠️ Should be "/criteria"
```

This means the criteria page's access tier is evaluated against `/check`'s tier (free) rather than its own (which isn't even registered in `access-control.ts`).

---

## Phase 2 — Problem Identification

### Category A: Broken / Wrong

| # | Problem | Severity | Location | Impact |
|---|---------|----------|----------|--------|
| A1 | **NBA H2H tier mismatch** — `access-control.ts` says "free" but layout uses `ProtectedPage` (Pro gating) | 🔴 High | `lib/access-control.ts` line 28, `app/nba/head-to-head/layout.tsx` | Users told it's free but hit paywall |
| A2 | **Criteria pathname bug** — `ProtectedPage pathname="/check"` instead of `"/criteria"` | 🔴 High | `app/criteria/page.tsx` | Wrong access tier evaluation |
| A3 | **Criteria not in ROUTE_ACCESS** — `/criteria` missing from access control registry | 🟡 Medium | `lib/access-control.ts` | `getRouteAccess("/criteria")` returns null |
| A4 | **Onboarding bug** — localStorage-based `isOnboarded()` not tied to user account | 🔴 High | `components/welcome-modal.tsx` | Returning users re-onboarded on new devices |
| A5 | **Post-checkout redirect to `/mlb`** — new Pro users land on a directory page, not a Pro feature | 🟡 Medium | `app/checkout/return` | First Pro experience is underwhelming |

### Category B: Inconsistent

| # | Problem | Severity | Location | Impact |
|---|---------|----------|----------|--------|
| B1 | **Check My Prop uses `max-w-6xl` (1152px)** while all dashboards use `max-w-[1440px]` | 🟡 Medium | `app/check/page.tsx` | Visual inconsistency |
| B2 | **Check My Prop title is oversized** — `text-2xl sm:text-3xl font-bold` vs standard `text-lg sm:text-xl font-semibold` | 🟢 Low | `app/check/page.tsx` | Minor visual inconsistency |
| B3 | **Sport hub pages use standalone layout** — no DashboardShell, different header | 🟡 Medium | `app/mlb/page.tsx`, `app/nba/page.tsx`, `app/nfl/page.tsx` | Navigation discontinuity |
| B4 | **Situation Room & Criteria use `AppShell` in page.tsx** while other dashboards use `DashboardShell` in page.tsx with `ProtectedPage` in layout.tsx | 🟢 Low | `app/situation-room/page.tsx`, `app/criteria/page.tsx` | Inconsistent wrapper pattern |
| B5 | **Check My Prop vertical padding differs** — `py-6 sm:py-10` vs standard `py-4 sm:py-8` | 🟢 Low | `app/check/page.tsx` | Minor spacing difference |
| B6 | **NBA hub has promotional message** ("All NBA dashboards are free during our launch promotion") that may be outdated | 🟡 Medium | `app/nba/page.tsx` | Potentially misleading |

### Category C: Missing

| # | Problem | Severity | Location | Impact |
|---|---------|----------|----------|--------|
| C1 | **Landing page Features section doesn't mention the 3 core tools** (Check My Prop, Situation Room, Alerts) | 🔴 High | `components/landing/features-section.tsx` | Key value props invisible to prospects |
| C2 | **No onboarding tips for Check, Situation Room, or Criteria** | 🟡 Medium | `components/onboarding-tooltip.tsx` | Users miss guidance on core tools |
| C3 | **No return-to-origin after Pro upgrade** — user can't get back to the dashboard they were viewing | 🟡 Medium | `app/checkout/return` | Frustrating post-upgrade flow |
| C4 | **Landing page Pricing section doesn't list tools** in Pro features | 🟡 Medium | `components/landing/pricing-section.tsx` | Pro value not fully communicated |
| C5 | **No post-signup onboarding destination** — unclear where new users land after email confirmation | 🟡 Medium | Auth flow | New users may land on empty dashboard |
| C6 | **Tools dropdown feels sparse** — only 3 items after consolidation | 🟢 Low | Navbar + DashboardShell | Product may appear thin |

### Category D: Confusing

| # | Problem | Severity | Location | Impact |
|---|---------|----------|----------|--------|
| D1 | **Sport hub → Dashboard navigation "reset"** — going from hub's standalone header to DashboardShell is jarring | 🟡 Medium | Sport hub pages | Users lose navigation context |
| D2 | **Two unrelated navigation systems** with no cross-linking — landing Navbar has no "back to dashboards" once inside DashboardShell | 🟢 Low | Navbar vs DashboardShell | Users in dashboards can't easily reach landing sections |
| D3 | **Hero links to Pro dashboard (`/nfl/matchup`)** for anonymous users who will hit paywall | 🟢 Low | `components/landing/hero-section.tsx` | Mild friction for unauth users |
| D4 | **"Criteria" vs "Alerts" naming** — route is `/criteria`, display name is "Alerts" in nav, feature description says "Research-based alerts" | 🟡 Medium | Multiple files | Confusing identity |

---

## Phase 3 — Realignment Proposal

### 3A. Proposed Site Map

```
heatcheckhq.com
├── / (Landing Page — marketing, features, pricing)
├── /blog, /blog/[slug]
├── /privacy, /terms
│
├── /auth/sign-up → /auth/sign-up-success
├── /auth/login
├── /checkout → /checkout/return
├── /account
│
├── /check (Check My Prop — core tool, Free tier)
├── /situation-room (Situation Room — Pro tier)
├── /alerts (renamed from /criteria — Pro tier)
│
├── /mlb (Sport Hub — wrap in DashboardShell)
│   ├── /mlb/nrfi (Public)
│   ├── /mlb/weather (Public)
│   ├── /mlb/due-for-hr (Free)
│   ├── /mlb/hitting-stats (Pro)
│   ├── /mlb/pitching-stats (Pro)
│   ├── /mlb/hot-hitters (Pro)
│   └── /mlb/streaks (Pro)
│
├── /nba (Sport Hub — wrap in DashboardShell)
│   ├── /nba/first-basket (Free — all NBA dashboards free per promotion)
│   ├── /nba/defense-vs-position (Free)
│   ├── /nba/head-to-head (Free — fix layout to match)
│   └── /nba/streaks (Free — downgrade from Pro per promotion)
│
└── /nfl (Sport Hub — wrap in DashboardShell)
    ├── /nfl/defense-vs-position (Free)
    ├── /nfl/matchup (Pro)
    └── /nfl/streaks (Pro)
```

**Key Changes:**
1. Rename `/criteria` → `/alerts` (match display name)
2. Wrap sport hub pages in DashboardShell (eliminate standalone header)
3. Fix NBA H2H to actually be Free tier (match access-control.ts)
4. No new routes needed

### 3B. Navigation Structure Proposal

#### DashboardShell (no changes needed to structure)

The current DashboardShell structure is solid:
- Sport nav tabs (MLB | NBA | NFL) showing sport-specific dashboards
- Tool dropdown (Analyze, Game Day, Track)
- QuickAccessBar for fast switching

**Proposed enhancement:** Add sport hub pages to the sport nav dropdown as the first item — "All MLB Dashboards" → `/mlb` — so users can always get back to the hub from within DashboardShell.

#### Landing Navbar

**Proposed enhancement:** Add a "Tools" CTA or more prominent placement. Currently tools are in a dropdown that requires hover/click discovery. Consider:
- Making "Check My Prop" a top-level nav link (it's the primary free tool)
- Adding tools to the hero section

#### Sport Hub Pages

**Proposal:** Wrap sport hubs in DashboardShell so they use the same navigation as dashboards. This eliminates the jarring layout switch and keeps users in a consistent environment. The hub content (dashboard cards) remains the same but gets the benefit of the full nav shell.

### 3C. Naming Consistency Table

| Current Route | Current Nav Label | Proposed Route | Proposed Label | Notes |
|---------------|-------------------|----------------|----------------|-------|
| `/criteria` | "Alerts" | `/alerts` | "Alerts" | Route matches label |
| `/check` | "Check My Prop" | `/check` | "Check My Prop" | No change |
| `/situation-room` | "Situation Room" | `/situation-room` | "Situation Room" | No change |
| `/nba/head-to-head` | "Head-to-Head" | `/nba/head-to-head` | "Head-to-Head" | Fix tier to Free |
| `/mlb/hitting-stats` | "Hitter vs Pitcher" | `/mlb/hitting-stats` | "Hitter vs Pitcher" | No change |
| `/nba/defense-vs-position` | "Defense vs Position" | `/nba/defense-vs-position` | "Defense vs Position" | No change |

### 3D. Conversion Path Improvements

#### Post-Signup Flow

```
Current:  Sign up → Confirmation → ??? (unclear destination)
Proposed: Sign up → Confirmation → /check (Check My Prop)
```

Rationale: Check My Prop is the core free tool. Landing new users here immediately demonstrates value and teaches them the product.

#### Post-Checkout Flow (New Pro Users)

```
Current:  Checkout → /checkout/return → "Explore dashboards" → /mlb
Proposed: Checkout → /checkout/return → "Try Situation Room" → /situation-room
                                       + "Check a Pro Prop" → /check
```

Rationale: New Pro users should immediately experience Pro-exclusive value. Offer two paths: the flagship Pro tool (Situation Room) or the enhanced Check My Prop with Pro overlays.

#### Post-Upgrade Flow (Existing Free → Pro)

```
Current:  ProGate → /checkout → /checkout/return → /mlb
Proposed: ProGate → /checkout?return=/[original-page] → /checkout/return → /[original-page]
```

Rationale: Users upgrading from a specific dashboard should return to that dashboard to immediately use the Pro feature they were trying to access.

#### Onboarding Fix

```
Current:  localStorage-only → breaks on new devices
Proposed: Supabase user metadata + localStorage cache → persists across devices
```

See [Section 1G](#1g-onboarding-system-review) for full technical proposal.

### 3E. Layout Structure Proposal

#### Standard Dashboard Layout

All dashboard pages should follow this pattern:

```
Layout.tsx:
  ProtectedPage (or UserTierProvider for public pages)
    └── {children}

Page.tsx:
  DashboardShell
    └── <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
          └── <div className="flex flex-col gap-4 sm:gap-6">
                ├── Title section (text-lg sm:text-xl font-semibold)
                ├── Filters/Controls
                └── Content (tables, charts, etc.)
```

#### Check My Prop Alignment

```
Change:
  max-w-6xl       → max-w-[1440px]
  py-6 sm:py-10   → py-4 sm:py-8
  text-2xl…bold   → text-lg sm:text-xl font-semibold
```

#### Sport Hub Alignment

```
Current:  Standalone header (no DashboardShell)
Proposed: Wrap in DashboardShell, keep card grid content
```

### 3F. Landing Page Realignment

#### Features Section Overhaul

The Features section should pivot from describing dashboard-level features to describing the **three core tools**:

| Current Feature | Proposed Replacement |
|-----------------|---------------------|
| "Heatmap Tables" | **Check My Prop** — "7-factor convergence analysis for any player prop. Validate any bet in seconds." |
| "Trend Detection" | **Situation Room** — "Live game-day command center. Line movements, injury alerts, and convergence shifts in real-time." |
| "Deep Filtering" | **Alerts** — "Set custom research criteria and get notified when props match your strategy." |
| "H2H Breakdowns" | **14 Sport Dashboards** — "Deep data for MLB, NBA, and NFL. Streaks, matchups, pitcher analysis, and more." |
| "Pitch Arsenal" | *Remove or merge into dashboards description* |
| "Injury Tracking" | *Remove or merge into Situation Room description* |

#### Pricing Section Enhancement

Add tool mentions to Pro tier:
- Current: "All pro dashboards + early access to new features"
- Proposed: "All pro dashboards + Situation Room + Alerts + Pro overlays on Check My Prop + early access to new features"

---

## Phase 4 — Execution Plan

### Chunk 1: Bug Fixes + NBA All-Free (Critical — Independently Mergeable)

**Priority:** 🔴 Highest — fixes broken behavior + applies NBA promotion

**Files to modify:**
1. `lib/access-control.ts` — Add `/alerts` route (pro tier), change `/nba/streaks` from `pro` to `free`
2. `app/criteria/page.tsx` — Fix `pathname="/check"` → `pathname="/criteria"`
3. `app/nba/head-to-head/layout.tsx` — Change from `ProtectedPage` to `UserTierProvider` (Free tier)
4. `app/nba/streaks/layout.tsx` — Change from `ProtectedPage` to `UserTierProvider` (Free tier, per NBA promotion)

**Decisions resolved:**
- NBA Head-to-Head: **Free** (layout was the outlier, access-control + hub page already said free)
- NBA promotion active: **Yes** — ALL NBA dashboards are Free (NBA Streaks moves from Pro to Free)

**Estimated scope:** 4 files, ~20 lines changed
**Risk:** Low — isolated fixes with clear before/after behavior

---

### Chunk 2: Onboarding Fix (High Priority — Independently Mergeable)

**Priority:** 🔴 High — fixes poor returning user experience

**Files to modify:**
1. `components/welcome-modal.tsx` — Add Supabase user metadata read/write alongside localStorage
2. `components/onboarding-tooltip.tsx` — Same Supabase metadata pattern for tooltip dismissals
3. `components/dashboard-shell.tsx` — Pass user object to onboarding check (may need to thread through from ProtectedPage)
4. New: `lib/onboarding.ts` — Centralize onboarding state management (read from localStorage first, fall back to Supabase, sync on login)

**Approach:**
- Create `lib/onboarding.ts` with `getOnboardingState(userId)` and `setOnboardingState(userId, state)`
- On login: hydrate localStorage from Supabase metadata
- On onboarding complete: write to both localStorage and Supabase
- On tooltip dismiss: write to both localStorage and Supabase
- Gracefully degrade: if Supabase call fails, localStorage still works

**Estimated scope:** 4 files, ~100 lines changed
**Risk:** Medium — touches auth flow, needs testing on new device scenario

---

### Chunk 3: Route Rename & Sport Hub Alignment (Medium Priority — Independently Mergeable)

**Priority:** 🟡 Medium — improves consistency

**Files to modify:**
1. `app/criteria/` → rename directory to `app/alerts/`
2. `app/alerts/page.tsx` — Update pathname and any internal references
3. `components/dashboard-shell.tsx` — Update TOOL_NAV href from `/criteria` to `/alerts`
4. `components/landing/navbar.tsx` — Update toolLinks href
5. `lib/access-control.ts` — Update route pattern
6. `app/mlb/page.tsx` — Wrap in DashboardShell (add layout.tsx or modify page.tsx)
7. `app/nba/page.tsx` — Same DashboardShell wrap
8. `app/nfl/page.tsx` — Same DashboardShell wrap
9. Add Next.js redirect: `/criteria` → `/alerts` in `next.config.ts`

**Also add onboarding tips for:**
10. `components/onboarding-tooltip.tsx` — Add tips for Check My Prop, Situation Room, Alerts

**Estimated scope:** ~10 files, ~150 lines changed
**Risk:** Medium — route rename needs redirect for bookmarks/links; sport hub layout change needs visual QA

---

### Chunk 4: Check My Prop Alignment (Low-Medium Priority — Independently Mergeable)

**Priority:** 🟡 Medium — visual consistency

**Files to modify:**
1. `app/check/page.tsx` — Change container width, title size, padding to match dashboard standard
2. Consider adding empty state improvements (popular props, recent checks)

**Specific changes:**
```
max-w-6xl       → max-w-[1440px]
py-6 sm:py-10   → py-4 sm:py-8
text-2xl…bold   → text-lg sm:text-xl font-semibold
```

**Estimated scope:** 1-2 files, ~10 lines changed
**Risk:** Low — purely visual, no logic changes

---

### Chunk 5: Conversion Path Improvements (Medium Priority — Independently Mergeable)

**Priority:** 🟡 Medium — improves conversion quality

**Files to modify:**
1. `app/checkout/return/page.tsx` — Change "Explore dashboards" destination from `/mlb` to `/situation-room` for Pro, `/check` for Free
2. `app/checkout/page.tsx` — Accept and preserve `return` query param
3. `components/check/pro-gate.tsx` (or equivalent) — Pass current URL as `?return=` param to checkout
4. Auth redirect handling — Set default post-signup destination to `/check`

**Estimated scope:** 3-4 files, ~30 lines changed
**Risk:** Low-Medium — needs to handle edge cases (no return param, expired sessions)

---

### Chunk 6: Landing Page Realignment (Medium Priority — Independently Mergeable)

**Priority:** 🟡 Medium — marketing alignment

**Files to modify:**
1. `components/landing/features-section.tsx` — Rewrite to highlight core tools (Check My Prop, Situation Room, Alerts, 14 Dashboards)
2. `components/landing/pricing-section.tsx` — Add tool mentions to Pro tier description
3. `components/landing/hero-section.tsx` — Consider adding Check My Prop CTA
4. `app/nba/page.tsx` — Remove outdated "launch promotion" message (if no longer valid)

**Estimated scope:** 3-4 files, ~80 lines changed
**Risk:** Low — marketing copy changes, no logic

---

### Execution Order

```
Chunk 1 (Bug Fixes)          ─── Immediate ─── MUST DO FIRST
  │
Chunk 2 (Onboarding Fix)     ─── Immediate ─── Independent
  │
Chunk 3 (Route Rename + Hubs) ── Next Sprint ── Depends on Chunk 1 (for /criteria route)
  │
Chunk 4 (Check My Prop)      ─── Next Sprint ── Independent
  │
Chunk 5 (Conversion Paths)   ─── Next Sprint ── Independent
  │
Chunk 6 (Landing Page)       ─── Next Sprint ── Independent (but benefits from Chunks 3-5 being done)
```

Each chunk should be its own branch and PR. Chunks 1 and 2 are critical fixes. Chunks 3-6 can be parallelized or sequenced based on sprint capacity.

---

### Decisions — Resolved

| # | Decision | Answer | Impact |
|---|----------|--------|--------|
| 1 | Is NBA Head-to-Head Free or Pro? | **Free** — update layout.tsx to remove Pro gate | Also: all NBA dashboards should be Free (see #2) |
| 2 | Is the NBA "launch promotion" still active? | **Yes — make ALL NBA dashboards Free** | NBA Streaks moves from Pro → Free in access-control.ts + layout.tsx |
| 3 | Should sport hub pages be in DashboardShell? | **Yes** — consistent navigation everywhere | Chunk 3 scope |
| 4 | Should `/criteria` be renamed to `/alerts`? | **Yes** — permanent redirect via Next.js config | Chunk 3 scope |
| 5 | Post-checkout destination for Pro users? | **Configurable via `?return=` param** with Situation Room as default | Chunk 5 scope |

**Important Chunk 1 update:** Decision #2 means NBA Streaks (`/nba/streaks`) must also be moved from Pro to Free tier. This affects:
- `lib/access-control.ts` — change `/nba/streaks` from `pro` to `free`
- `app/nba/streaks/layout.tsx` — change from `ProtectedPage` to `UserTierProvider`
- `app/nba/head-to-head/layout.tsx` — same change (already planned)

---

### Chunk 7: Design Pass — Check My Prop Redesign + Landing Page Redesign (Dedicated Phase)

**Priority:** 🟡 Medium — UX/UI quality uplift

**Scope:** Full frontend design pass using UI/UX development skills.

#### 7A. Check My Prop Redesign

**Goals:**
- Rethink the **empty state** — currently shows minimal guidance when no prop has been checked
- Improve the **results layout** — visual hierarchy of verdict → ring → convergence → narratives
- Add **trending/popular props** — give users quick-start options
- Enhance the **HeatRing/Convergence visual hierarchy** — make the 7-factor analysis more scannable and impactful
- Consider **recent checks** section for returning users

**Design areas:**
1. **Empty state redesign** — trending props grid, "try these" suggestions, search-forward hero
2. **Results layout** — tighter verdict → analysis flow, better mobile experience
3. **HeatRing enhancement** — larger default size, interactive segments, tooltip improvements
4. **Convergence breakdown** — visual weight rebalancing, factor grouping, signal clarity
5. **Mobile experience** — ensure the full results flow works well on phones

#### 7B. Landing Page Redesign

**Goals:**
- Restructure the **hero** — lead with tools as the main value prop, but showcase the full product mix
- Redesign the **Features section** — tools as primary, dashboards as supporting depth, presented as a unified product
- Improve **CTAs** — clearer free vs pro value proposition throughout
- Better **social proof** and trust signals
- Pricing section copy updates to highlight the complete offering (tools + dashboards)

**Design principle:** Tools are the **main value proposition** but the landing page should present a **mix of all product offerings** — tools, sport dashboards, and data depth working together as one platform, not tools replacing dashboards.

**Design areas:**
1. **Hero section** — tool-forward messaging with prop check CTA, but dashboards visible as supporting depth
2. **Features section** — lead with 3 core tools, then showcase 14 dashboards as the data engine powering them
3. **Sports section** — integrate tools + dashboards per sport as a unified experience
4. **Pricing section** — explicit tool + dashboard mentions in tier descriptions showing the full value stack
5. **CTA section** — conversion copy that sells the complete platform (analyze, track, act)

**Estimated scope:** Multiple components, significant visual/copy changes
**Risk:** Medium — needs visual QA across breakpoints
**Depends on:** Chunks 1-6 should be complete first (especially route rename and conversion path fixes)

---

### Updated Execution Order

```
Chunk 1 (Bug Fixes + NBA All-Free) ─── Immediate ─── MUST DO FIRST
  │
Chunk 2 (Onboarding Fix)           ─── Immediate ─── Independent
  │
Chunk 3 (Route Rename + Hubs)      ─── Next ──────── Depends on Chunk 1
  │
Chunk 4 (Check My Prop Alignment)  ─── Next ──────── Independent
  │
Chunk 5 (Conversion Paths)         ─── Next ──────── Independent
  │
Chunk 6 (Landing Page Copy)        ─── Next ──────── Independent
  │
Chunk 7A (Check My Prop Redesign)  ─── Design Pass ─ Depends on Chunk 4
  │
Chunk 7B (Landing Page Redesign)   ─── Design Pass ─ Depends on Chunk 6
```

Chunks 1-6 are structural/functional fixes. Chunk 7 is the dedicated design pass that builds on top of the corrected foundation.

---

*End of audit. This document is analysis and planning only — no code changes have been made.*
