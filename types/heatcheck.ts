// ============================================================
// types/heatcheck.ts — Types for The HeatCheck (daily top picks)
// ============================================================

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
  /** Common line threshold from COMMON_LINES */
  line: number
  /** Our projected value for tonight */
  projection: number
  /** Edge = (projection - line) / line as a percentage (e.g. 11.2 = 11.2%) */
  edge: number
  /** Which side the edge favors */
  direction: 'over' | 'under'
  /** Confidence score 0-100 from convergence lean */
  confidence: number
  /** Composite ranking score: |edge| * (confidence / 100) */
  compositeScore: number
  /** How many of 9 convergence factors lean over */
  convergenceOver: number
  /** How many of 9 convergence factors lean under */
  convergenceUnder: number
  /** Season average for this stat */
  seasonAvg: number
  /** Last 5 game average */
  last5Avg: number
  /** Hit rate over the line in last 10 games (0-1) */
  hitRateL10: number
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
