// ============================================================
// convergenceEngine/index.ts — Sport-specific convergence router
// ============================================================
// Routes to the correct sport-specific factor set.
// Every sport produces exactly 9 factors — UI stays consistent.
// The internal implementations differ per sport, with sport-specific
// replacements for dead factors (MLB: 3 replaced, NFL: 1 replaced).

import type { Player, Game, GameLog, SeasonStats, DefenseRanking } from '@/types/shared'
import type { ConvergenceFactor } from '@/types/check-prop'
import type { WeightedFactor, FactorInput, Lean } from './types'
import { getNBAFactors } from './factors/nba'
import { getMLBFactors, type MLBExtraData } from './factors/mlb'
import { getNFLFactors, type NFLExtraData } from './factors/nfl'

// ──── CONVERGENCE RESULT ────────────────────────────────────────

export interface ConvergenceResult {
  factors: ConvergenceFactor[]         // Public interface (backward compat)
  weightedFactors: WeightedFactor[]    // New: includes weight, direction, fired
  overCount: number
  underCount: number
  neutralCount: number
  lean: Lean                           // New: weighted lean with confidence tier
}

// ──── EXTRA DATA (optional, per-sport) ──────────────────────────

export interface ExtraData {
  mlb?: MLBExtraData
  nfl?: NFLExtraData
}

// ──── MAIN EVALUATE FUNCTION ────────────────────────────────────

export function evaluate(
  player: Player,
  game: Game,
  gameLogs: GameLog[],
  seasonStats: SeasonStats,
  defenseRanking: DefenseRanking,
  stat: string,
  line: number,
  extra?: ExtraData,
): ConvergenceResult {
  const isHome = game.homeTeam.id === player.team.id

  const input: FactorInput = {
    player,
    game,
    gameLogs,
    seasonStats,
    defenseRanking,
    stat,
    line,
    isHome,
  }

  // Route to sport-specific factor set
  let weightedFactors: WeightedFactor[]

  switch (player.sport) {
    case 'nba':
      weightedFactors = getNBAFactors(input)
      break
    case 'mlb':
      weightedFactors = getMLBFactors(input, extra?.mlb)
      break
    case 'nfl':
      weightedFactors = getNFLFactors(input, extra?.nfl)
      break
    default:
      // Unknown sport — fall back to NBA-style factors
      weightedFactors = getNBAFactors(input)
  }

  // Compute counts
  const overCount = weightedFactors.filter(f => f.signal === 'over').length
  const underCount = weightedFactors.filter(f => f.signal === 'under').length
  const neutralCount = weightedFactors.filter(f => f.signal === 'neutral').length

  // Compute weighted lean
  const lean = computeLean(weightedFactors)

  // Map to public ConvergenceFactor interface (backward compat)
  const factors: ConvergenceFactor[] = weightedFactors.map(wf => ({
    key: wf.key,
    name: wf.name,
    signal: wf.signal,
    strength: wf.strength,
    detail: wf.detail,
    dataPoint: wf.dataPoint,
    icon: wf.icon,
  }))

  return {
    factors,
    weightedFactors,
    overCount,
    underCount,
    neutralCount,
    lean,
  }
}

// ──── WEIGHTED LEAN COMPUTATION ─────────────────────────────────
// Confidence = |SUM(weight * direction * strength)| * 100
//   direction: +1 = OVER, -1 = UNDER, 0 = neutral
//   strength:  0.0-1.0 (how far above firing threshold)
//
//   >= 65 -> Strong Lean
//   50-64 -> Moderate Lean
//   < 50  -> Neutral

export function computeLean(factors: WeightedFactor[]): Lean {
  const score = factors.reduce(
    (sum, f) => sum + f.weight * f.direction * f.strength,
    0,
  ) * 100

  const absScore = Math.abs(score)
  const direction: Lean['direction'] =
    absScore < 10 ? 'toss-up' :
    score > 0 ? 'over' :
    'under'

  return {
    direction,
    confidence: Math.min(99, Math.max(1, Math.round(absScore))),
    tier: absScore >= 65 ? 'STRONG' : absScore >= 50 ? 'MODERATE' : 'NEUTRAL',
    factors,
  }
}

// ──── RE-EXPORT TYPES ───────────────────────────────────────────
export type { WeightedFactor, Lean, FactorInput } from './types'
export type { MLBExtraData } from './factors/mlb'
export type { NFLExtraData } from './factors/nfl'
