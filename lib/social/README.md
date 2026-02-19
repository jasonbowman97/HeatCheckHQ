# Social Media Content System

Automated cheat sheet graphics + AI-generated tweet copy for @heatcheckio on Twitter/X.

## Architecture

```
Data Sources (ESPN, BettingPros, MLB Stats API)
        ↓
Core Analytics (lib/nba-api, lib/mlb-api, lib/nba-streaks, etc.)
        ↓
Social Content System
├── lib/social/social-config.ts        — brand colors, gradients, layout constants
├── lib/social/shared/gradient-header.tsx — Satori-compatible teal gradient header
├── lib/social/shared/sheet-layout.tsx  — shared wrapper (header + footer + content)
├── lib/social/shared/header-cell.tsx   — shared column header component
├── lib/social/shared/color-utils.ts    — rankColor, hitRateColor, fireLevel, etc.
├── lib/social/shared/team-logo.ts      — ESPN CDN logo → base64 converter
├── lib/social/sheets/                  — one component per sheet type
├── lib/social/claude-copywriter.ts     — Claude AI tweet generation ("Velma" persona)
└── lib/social/card-types.ts            — TypeScript interfaces for sheet rows
        ↓
API Endpoints
├── GET  /api/social/sheets/{type}      — renders sheet as PNG image
├── GET  /api/social/tweets             — generates tweet templates
└── POST /api/social/generate           — master orchestrator (data + sheets + copy)
        ↓
Admin UI → /admin/social (preview, copy, download)
```

## Pipeline

1. **GitHub Actions cron** (`.github/workflows/social-content.yml`) runs 3x daily: 9 AM, 12 PM, 4 PM ET
2. Calls `POST /api/social/generate` with `SOCIAL_SECRET`
3. Fetches live data in parallel (DVP, streaks, MLB schedule, etc.)
4. Generates 8 sheet PNGs via Satori (`@vercel/og`)
5. Generates Claude AI tweet copy for each sheet
6. Returns JSON with sheet URLs + tweets + hashtags

## Sheet Types

| Type | Sport | Data Source | What It Shows |
|------|-------|-------------|---------------|
| `nba_dvp` | NBA | `getTodayMatchupInsights()` | Best defense-vs-position matchups |
| `nba_parlay` | NBA | DVP + streaks | High hit-rate prop suggestions |
| `mlb_nrfi` | MLB | `computePitcherNrfi()` | Pitcher NRFI matchups + streaks |
| `mlb_strikeout` | MLB | `getPitcherSeasonStats()` | K line over/under verdicts |
| `daily_recap` | Multi | DVP + parlay data | Best picks summary |
| `nba_pts_streaks` | NBA | `getNBAStreakTrends()` | Players on scoring streaks |
| `nba_reb_streaks` | NBA | `getNBAStreakTrends()` | Players on rebound streaks |
| `nba_ast_streaks` | NBA | `getNBAStreakTrends()` | Players on assist streaks |

## Brand Guidelines (Social Graphics)

### Colors
| Element | Value | Usage |
|---------|-------|-------|
| Header gradient | `#0a1a1a` → `#0d9373` → `#2dd4a8` | Always teal — this IS HeatCheck HQ |
| Background | `#0d1117` | Matches web app |
| Foreground | `#e3e8ef` | Primary text |
| Primary teal | `#2dd4a8` | Brand accent, watermark, footer |
| NBA accent | `#F97316` (orange) | 4px sport stripe only |
| MLB accent | `#3B82F6` (blue) | 4px sport stripe only |
| NFL accent | `#10B981` (green) | 4px sport stripe only |
| Stat green | `#22c55e` | Good/hot/hit |
| Stat amber | `#f59e0b` | Neutral/moderate |
| Stat red | `#ef4444` | Bad/cold/miss |

### Design Rules
- **Header is ALWAYS teal gradient** — never change to sport-specific colors
- Sport differentiation uses ONLY the 4px accent stripe below the header
- Footer: left = logo + `heatcheckhq.io`, center = `FREE DAILY ANALYTICS`, right = `@HEATCHECKIO`
- Team logos: 36px, fetched from ESPN CDN and converted to base64
- Fire emojis for hot streaks: 🔥🔥🔥 (≥90%), 🔥🔥 (≥80%), 🔥 (≥70%)

### Brand Voice ("Velma")
- Confident, data-driven, playful — "she brings the receipts and the personality"
- 270 char max per tweet, 1-3 emojis max
- Never say "lock of the day" — present data, let users decide
- End with engagement question or CTA
- Full prompt in `lib/social/claude-copywriter.ts`

## Satori Technical Constraints

When writing sheet components, remember Satori (the JSX→PNG renderer) has strict limitations:

- **No CSS `linear-gradient`** — simulate with layered `<div>`s at different opacities
- **Flex-only layout** — no CSS Grid, no `position: absolute` (use flex workarounds)
- **Inline styles only** — no `className`, no Tailwind
- **No `<img>` tags for remote URLs** — images must be base64 data URIs
- **Fonts loaded manually** — Inter Bold/SemiBold/Regular from `public/fonts/` as OTF binary
- **`ImageResponse`** from `@vercel/og` creates the final PNG

## How to Test

Visit any sheet endpoint directly in browser:
```
http://localhost:3000/api/social/sheets/nba_dvp
http://localhost:3000/api/social/sheets/mlb_nrfi
http://localhost:3000/api/social/sheets/nba_parlay
http://localhost:3000/api/social/sheets/mlb_strikeout
http://localhost:3000/api/social/sheets/daily_recap
http://localhost:3000/api/social/sheets/nba_pts_streaks
http://localhost:3000/api/social/sheets/nba_reb_streaks
http://localhost:3000/api/social/sheets/nba_ast_streaks
```

Or in production:
```
https://heatcheckhq.io/api/social/sheets/{type}
```

## How to Add a New Sheet Type

1. Define row interface in `lib/social/card-types.ts`
2. Create sheet component in `lib/social/sheets/{name}-sheet.tsx`
   - Import `SheetLayout` for consistent header/footer
   - Import `HeaderCell` for column headers
   - Use color utils for semantic coloring
   - Use `getTeamLogos()` for logo base64 conversion
3. Add data fetching in `app/api/social/sheets/[type]/route.tsx` (add case to switch)
4. Add to `app/api/social/generate/route.ts` orchestrator
5. Add tweet templates in `app/api/social/tweets/route.ts`
6. Test via `/api/social/sheets/{new_type}`

## Competitor References
- TheProfessor305 (224K followers) — premium cheat sheet graphics, 755K views
- xEP_Network (107K) — projections and data tools
- GoldBoys (82K) — win celebration posts
- Heisenbets (12K) — NBA cheat sheets

## Roadmap Status
- [x] Sprint 0: Memory & documentation for cross-session continuity
- [x] Sprint 1: Sheet visual redesign (teal gradient headers, sport accents, larger logos)
- [ ] Sprint 2: MLB tweet generators, meme templates, hashtag strategy
- [ ] Sprint 3: Canva templates for win celebrations, carousels
- [ ] Sprint 4: Supabase persistence, content calendar, Twitter API v2
