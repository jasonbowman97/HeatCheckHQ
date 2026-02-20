// ============================================================
// lib/convergence-engine.ts — Convergence engine (delegates to sport-specific)
// ============================================================
// This file maintains the original API surface for backward compatibility.
// Internally, it delegates to the sport-specific convergence engine
// at lib/convergenceEngine/index.ts which uses EWMA, weighted factors,
// and sport-specific replacement factors.

import type { Player, Game, GameLog, SeasonStats, DefenseRanking } from '@/types/shared'
import type { ConvergenceFactor } from '@/types/check-prop'
import {
  evaluate as evaluateV2,
  type ConvergenceResult as ConvergenceResultV2,
  type ExtraData,
} from './convergenceEngine'

// Legacy interface — kept for backward compatibility
interface ConvergenceResult {
  factors: ConvergenceFactor[]
  overCount: number
  underCount: number
  neutralCount: number
}

/**
 * Evaluate convergence factors for a prop.
 *
 * This is the backward-compatible entry point. It routes to the
 * sport-specific engine and returns the standard ConvergenceResult.
 *
 * For access to weighted factors and lean data, use evaluateV2 directly
 * from lib/convergenceEngine.
 */
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
  const result = evaluateV2(player, game, gameLogs, seasonStats, defenseRanking, stat, line, extra)

  return {
    factors: result.factors,
    overCount: result.overCount,
    underCount: result.underCount,
    neutralCount: result.neutralCount,
  }
}

/**
 * Full V2 evaluation — returns weighted factors, lean, and confidence tier.
 * Use this when you need the complete weighted analysis.
 */
export function evaluateFull(
  player: Player,
  game: Game,
  gameLogs: GameLog[],
  seasonStats: SeasonStats,
  defenseRanking: DefenseRanking,
  stat: string,
  line: number,
  extra?: ExtraData,
): ConvergenceResultV2 {
  return evaluateV2(player, game, gameLogs, seasonStats, defenseRanking, stat, line, extra)
}

// Re-export for direct access
export type { ConvergenceResultV2, ExtraData }
export { computeLean } from './convergenceEngine'
