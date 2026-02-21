// ============================================================
// types/heatcheck.ts — Types for The HeatCheck (daily top picks)
// ============================================================
// Projection-only model: ranks by convergence confidence + trend
// alignment. No sportsbook lines — shows what our model projects.

import type { Player, Game, Sport } from './shared'

// ──── SINGLE PICK ────

export interface HeatCheckPick {
  /** Rank position (1 = best pick) */
  rank: number
  /** Player info */
  player: Player
  /** Tonight's game */
  game: Game
  /** Stat key (e.g. 'points', 'passing_yards') */
  stat: string
  /** Display label (e.g. 'Points', 'Pass Yards') */
  statLabel: string
  /** Our projected value for tonight */
  projection: number
  /** Season average for this stat */
  seasonAvg: number
  /** Last 5 game average */
  last5Avg: number
  /** EWMA-weighted recent average (L10) */
  ewmaRecent: number
  /** Matchup adjustment factor applied (-10% to +10%) */
  matchupAdj: number
  /** Defense rank of opponent for this stat (1=best D, 30=worst D) */
  defenseRank: number
  /** Confidence score 0-100 from convergence engine */
  confidence: number
  /** Composite ranking score for sorting */
  compositeScore: number
  /** How many of 9 convergence factors lean over */
  convergenceOver: number
  /** How many of 9 convergence factors lean under */
  convergenceUnder: number
  /** Convergence lean direction */
  convergenceLean: 'over' | 'under' | 'neutral'
  /** Recent trend */
  trend: 'hot' | 'cold' | 'steady'
  /** Short narrative flags (e.g. "3-game streak", "vs weak DEF") */
  narratives: string[]
}

// ──── BOARD RESULT ────

export interface HeatCheckBoardResult {
  /** Which sport this board is for */
  sport: Sport
  /** ISO timestamp when the board was generated */
  generatedAt: string
  /** Number of games scanned */
  gamesScanned: number
  /** Number of players evaluated */
  playersScanned: number
  /** Top picks, sorted by composite score (best first) */
  picks: HeatCheckPick[]
}
