// ============================================================
// convergenceEngine/types.ts — Internal types for the convergence engine
// ============================================================

import type { ConvergenceFactor } from '@/types/check-prop'
import type { Player, Game, GameLog, SeasonStats, DefenseRanking, Sport } from '@/types/shared'

/** Internal factor result before being mapped to the public ConvergenceFactor */
export interface FactorResult {
  signal: 'over' | 'under' | 'neutral'
  strength: number  // 0-1
  detail: string
  dataPoint: string
}

/** A weighted convergence factor (extends ConvergenceFactor with weight info) */
export interface WeightedFactor extends ConvergenceFactor {
  weight: number      // 0-1 (sum to 1.0 across all 9 factors)
  direction: number   // +1 = over, -1 = under, 0 = neutral
  fired: boolean      // did this factor meet its minimum threshold?
}

/** Input data passed to all factor scoring functions */
export interface FactorInput {
  player: Player
  game: Game
  gameLogs: GameLog[]
  seasonStats: SeasonStats
  defenseRanking: DefenseRanking
  stat: string
  line: number
  isHome: boolean
}

/** Lean result from the weighted scoring system */
export interface Lean {
  direction: 'over' | 'under' | 'toss-up'
  confidence: number  // 0-100
  tier: 'STRONG' | 'MODERATE' | 'NEUTRAL'
  factors: WeightedFactor[]
}

/** Sport-specific alpha values for EWMA */
export type SportAlpha = typeof import('./utils/ewma').ALPHA
