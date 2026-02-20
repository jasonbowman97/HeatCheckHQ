// ============================================================
// types/analyzer.ts — Types for the Prop Analyzer (multi-prop view)
// ============================================================

import type { Player, Game, GameLog, Sport } from './shared'

// ──── API RESPONSE ────

export interface PlayerAnalysis {
  player: Player
  nextGame: Game | null
  sport: Sport
  /** All computed prop summaries for this player */
  props: PropSummary[]
  /** Season averages for all stats (keyed by stat name) */
  seasonAverages: Record<string, number>
  /** Total games in sample */
  gamesPlayed: number
  /** Lightweight matchup context for card-level narrative tags */
  matchupContext?: {
    opponentAbbrev: string
    opponentDefRank: number
    isHome: boolean
    restDays: number
    isB2B: boolean
  }
}

// ──── PROP SUMMARY (lightweight, for the grid card) ────

export interface PropSummary {
  stat: string
  statLabel: string
  /** The smart-default line chosen for this stat */
  line: number
  /** Season average for this stat */
  seasonAvg: number
  /** Last 5 game average */
  last5Avg: number
  /** Last 10 game average */
  last10Avg: number
  /** Hit rate (over the line) for last 10 games */
  hitRateL10: number
  /** Hit rate for last 5 games */
  hitRateL5: number
  /** Hit rate for full season */
  hitRateSeason: number
  /** Hit rate vs this specific opponent (null if < 3 games) */
  hitRateH2H: number | null
  /** Trend: hot if L5 > season avg + threshold, cold if below, steady otherwise */
  trend: 'hot' | 'cold' | 'steady'
  /** Quick convergence: how many of 7 factors lean over vs under */
  convergenceOver: number
  convergenceUnder: number
  /** Overall verdict direction */
  verdict: 'over' | 'under' | 'neutral'
  /** Confidence score 0-100 */
  confidence: number
  /** Last 10 game values (newest first) for mini bar chart */
  last10Values: number[]
  /** Last 10 game opponents (newest first) for chart labels */
  last10Opponents: string[]
  /** Last 10 game dates (newest first) */
  last10Dates: string[]
  /** All game values for the season (newest first) — enables client-side line cycling */
  allValues: number[]
  /** Volatility score 1-10 (1 = consistent, 10 = volatile). Computed from allValues stdDev. */
  volatility?: number
}

// ──── API REQUEST ────

export interface AnalyzePlayerRequest {
  playerId: string
  sport: Sport
}

// ──── CLIENT-SIDE STATE ────

export interface PropCardState {
  stat: string
  /** Currently selected line (may differ from default after user cycles) */
  currentLine: number
  /** Whether this card's drill-down is expanded */
  isExpanded: boolean
}

// ──── STAT FILTER ────

export type StatFilter = 'all' | string // 'all' or a category label like 'Scoring', 'Passing', etc.
