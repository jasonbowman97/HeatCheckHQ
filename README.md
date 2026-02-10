# HeatCheck HQ

Advanced sports analytics dashboards for MLB, NBA, and NFL with real-time player statistics.

## Overview

HeatCheck HQ is a comprehensive sports analytics platform featuring 12 specialized dashboards across three major sports leagues.

## Features

- **Heatmap-Colored Tables** - Color-coded stat cells for instant insights
- **Hot & Cold Trend Detection** - Multi-game streak identification
- **Deep Filtering** - Slice by hand, timeframe, and date windows
- **H2H Breakdowns** - Team matchup history and momentum
- **Pitch Arsenal Analysis** - Per-pitch performance details (MLB)
- **Injury Tracking** - Live availability status updates

## Dashboards

### MLB (5 dashboards)
- **Hitting Stats** - Batter matchups and performance metrics
- **NRFI** - No-run first inning probabilities
- **Pitching Stats** - Pitcher performance and arsenals
- **Trends** - Hitting streaks and cold slumps
- **Weather** - Game conditions and impacts

### NBA (3 dashboards)
- **First Basket** - Tip-off win percentages and player rankings
- **Head-to-Head** - Team matchup history and momentum
- **Trends** - Scoring runs and performance surges

### NFL (3 dashboards)
- **Matchup** - Team statistics with league rankings
- **Trends** - Passing yards and rushing performance
- **Redzone** - Redzone efficiency analytics

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.7.3
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **Charts**: Recharts 2.15.0
- **Data Fetching**: SWR 2.4.0
- **Animation**: Framer Motion 12.33.0

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
app/
├── api/              # API routes
│   ├── mlb/         # MLB data endpoints
│   ├── nba/         # NBA data endpoints
│   └── nfl/         # NFL data endpoints
├── mlb/             # MLB dashboard pages
├── nba/             # NBA dashboard pages
├── nfl/             # NFL dashboard pages
├── layout.tsx       # Root layout
└── page.tsx         # Landing page
components/          # Reusable UI components
hooks/              # Custom React hooks
lib/                # Utilities and helpers
public/             # Static assets
styles/             # Global styles
```

## Deployment

This project is configured for deployment on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jasonbowman97/HeatCheckHQ)

## License

© 2026 HeatCheck HQ. All rights reserved.
