# Claude Code Context - HeatCheckHQ

## Repository Information
- **Repository**: HeatCheckHQ
- **GitHub URL**: https://github.com/jasonbowman97/HeatCheckHQ
- **Local Path**: C:\Users\jason\OneDrive\Documents\GitHub\HeatCheckHQ
- **Owner**: Jason Bowman (@jasonbowman97)
- **Production URL**: https://heatcheckhq.io

## About Me
- Name: Jason
- Platform: Windows

## Project Overview
HeatCheck HQ is a sports analytics platform offering advanced sports analytics dashboards for MLB, NBA, and NFL with real-time player statistics. It also includes an automated social media content system for @heatcheckio on Twitter/X.

### Features
- **12 Total Dashboards** across MLB, NBA, and NFL
- Heatmap-colored tables for instant insights
- Hot & cold trend detection with multi-game streak identification
- Deep filtering by hand, timeframe, and date windows
- Head-to-head breakdowns with team history
- Pitch arsenal analysis for MLB
- Injury tracking with live availability updates
- **Automated social media content** — cheat sheet PNGs + AI-generated tweet copy

### Dashboard Types

**MLB (5 dashboards):**
- Hitting Stats - batter matchups and performance metrics
- NRFI - no-run first inning probabilities
- Pitching Stats - pitcher performance and arsenals
- Trends - hitting streaks and cold slumps
- Weather - game conditions and impacts

**NBA (3 dashboards):**
- First Basket - tip-off win percentages and player rankings
- Head-to-Head - team matchup history and momentum
- Trends - scoring runs and performance surges

**NFL (3 dashboards):**
- Matchup - team statistics with league rankings
- Trends - passing yards and rushing performance
- Redzone - redzone efficiency analytics

## Social Media Content System
- **Full docs**: See `lib/social/README.md` for complete architecture, brand guidelines, and how-to
- **Architecture**: `lib/social/` (components), `app/api/social/` (endpoints), `app/admin/social/` (admin UI)
- **Pipeline**: GitHub Actions cron → `POST /api/social/generate` → 8 sheet PNGs + Claude AI tweet copy
- **Sheet rendering**: Satori via `@vercel/og` at `/api/social/sheets/{type}` (no CSS gradients, flex-only, inline styles)
- **Brand voice**: "Velma" persona in `lib/social/claude-copywriter.ts`
- **Design**: Teal gradient headers (`#2dd4a8`), sport accent stripes (NBA orange `#F97316`, MLB blue `#3B82F6`, NFL green `#10B981`)
- **Twitter**: @heatcheckio
- **Admin**: `/admin/social` for preview, copy, and download

### Social API Endpoints
- `GET /api/social/sheets/{type}` — renders sheet PNG (nba_dvp, nba_parlay, mlb_nrfi, mlb_strikeout, daily_recap, nba_pts/reb/ast_streaks)
- `GET /api/social/tweets` — generates tweet templates
- `POST /api/social/generate` — master orchestrator (data + sheets + copy)

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.7.3
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.15.0
- **Data Fetching**: SWR 2.4.0
- **Theme**: next-themes
- **Icons**: Lucide React
- **Social**: @vercel/og (Satori), @anthropic-ai/sdk (Claude copywriter)
- **Payments**: Stripe
- **Auth**: Supabase Auth (email + Google OAuth)

## Project Structure
```
app/
├── api/
│   ├── mlb/ (batting, pitching, schedule, trends)
│   ├── nba/ (schedule, trends)
│   ├── nfl/ (matchup, schedule, trends)
│   └── social/ (generate, sheets/[type], tweets)
├── admin/social/ (content management UI)
├── auth/ (login, sign-up, callback)
├── mlb/ (hitting-stats, nrfi, pitching-stats, trends, weather)
├── nba/ (first-basket, head-to-head, trends)
├── nfl/ (matchup, redzone, trends)
├── layout.tsx
└── page.tsx (landing page)
components/
hooks/
lib/
├── social/ (sheet components, config, copywriter — see lib/social/README.md)
├── nba-api.ts, mlb-api.ts, nfl-api.ts (data fetchers)
├── nba-streaks.ts, nba-defense-vs-position.ts (analytics)
├── supabase/ (auth client)
└── products.ts (Stripe pricing)
public/
styles/
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes
- Using pnpm as package manager (pnpm-lock.yaml present)
- Working directory set to HeatCheckHQ repository
- Production at https://heatcheckhq.io (Vercel Hobby plan)
