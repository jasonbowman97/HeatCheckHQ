# Claude Code Context - HeatCheckHQ

## Repository Information
- **Repository**: HeatCheckHQ
- **GitHub URL**: https://github.com/jasonbowman97/HeatCheckHQ
- **Local Path**: C:\Users\jason\OneDrive\Documents\GitHub\HeatCheckHQ
- **Owner**: Jason Bowman (@jasonbowman97)
- **Original Deployment**: https://v0-motion-sports-hub.vercel.app/

## About Me
- Name: Jason
- Platform: Windows

## Project Overview
HeatCheck HQ is a sports analytics platform offering advanced sports analytics dashboards for MLB, NBA, and NFL with real-time player statistics.

### Features
- **12 Total Dashboards** across MLB, NBA, and NFL
- Heatmap-colored tables for instant insights
- Hot & cold trend detection with multi-game streak identification
- Deep filtering by hand, timeframe, and date windows
- Head-to-head breakdowns with team history
- Pitch arsenal analysis for MLB
- Injury tracking with live availability updates

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

## Project Structure
```
app/
├── api/
│   ├── mlb/ (batting, pitching, schedule, trends)
│   ├── nba/ (schedule, trends)
│   └── nfl/ (matchup, schedule, trends)
├── mlb/ (hitting-stats, nrfi, pitching-stats, trends, weather)
├── nba/ (first-basket, head-to-head, trends)
├── nfl/ (matchup, redzone, trends)
├── layout.tsx
└── page.tsx (landing page)
components/
hooks/
lib/
public/
styles/
```

## Current Focus
- Rebuilding the site after original deployment broke
- Migrating from v0-motion-sports-hub to HeatCheckHQ repository
- All source code successfully copied to new repository

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes
- Using pnpm as package manager (pnpm-lock.yaml present)
- Working directory set to HeatCheckHQ repository
- Original site working at https://v0-motion-sports-hub.vercel.app/
