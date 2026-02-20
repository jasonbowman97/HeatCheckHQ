// ============================================================
// convergenceEngine/factors/nba.ts — NBA 9-factor convergence
// ============================================================
// All 9 factors are valid for NBA — no replacements needed.
// EWMA with alpha=0.85, L10 lookback. Weights sum to 1.0.
// Sharp line movement weight (0.06) redistributed to
// recentTrend and seasonAvg.

import { ALPHA } from '../utils/ewma'
import {
  scoreRecentTrend,
  scoreSeasonAvg,
  scoreOpponentDef,
  scoreHomeAway,
  scoreRestFatigue,
  scoreH2H,
  scoreMomentum,
  scoreMinutesTrend,
  scoreGameEnvironment,
} from './universal'
import type { FactorInput, WeightedFactor } from '../types'

// ─── WEIGHTS (sum to 1.0) ─────────────────────────────────────
const W = {
  recentTrend:     0.26, // Factor 1 — highest weight (most predictive)
  seasonAvg:       0.20, // Factor 2
  opponentDef:     0.18, // Factor 3
  minutesTrend:    0.14, // Factor 4 — valid in NBA
  restFatigue:     0.10, // Factor 5
  gameEnvironment: 0.07, // Factor 6
  homeAway:        0.03, // Factor 7
  headToHead:      0.01, // Factor 8
  momentum:        0.01, // Factor 9 — tiebreaker only
} as const

const NBA_MEDIAN_TOTAL = 224

function toWeighted(
  id: string,
  label: string,
  weight: number,
  result: { signal: 'over' | 'under' | 'neutral'; strength: number; detail: string; dataPoint: string },
): WeightedFactor {
  const icon = result.signal === 'over' ? '▲' : result.signal === 'under' ? '▼' : '—'
  return {
    key: id,
    name: label,
    signal: result.signal,
    strength: result.strength,
    detail: result.detail,
    dataPoint: result.dataPoint,
    icon,
    weight,
    direction: result.signal === 'over' ? 1 : result.signal === 'under' ? -1 : 0,
    fired: result.signal !== 'neutral' && result.strength > 0.1,
  }
}

export function getNBAFactors(input: FactorInput): WeightedFactor[] {
  return [
    toWeighted('recentTrend', 'Recent Trend (L10 EWMA)', W.recentTrend,
      scoreRecentTrend(input, ALPHA.nba, 10, 0.08)),

    toWeighted('seasonAvg', 'Season Average vs Line', W.seasonAvg,
      scoreSeasonAvg(input, true, 0.05)), // Use MEDIAN for NBA

    toWeighted('opponentDef', 'Opponent Defense Rank', W.opponentDef,
      scoreOpponentDef(input, 10, 21)),

    toWeighted('minutesTrend', 'Minutes & Usage Trend', W.minutesTrend,
      scoreMinutesTrend(input, 2)),

    toWeighted('restFatigue', 'Rest / Fatigue (B2B)', W.restFatigue,
      scoreRestFatigue(input)),

    toWeighted('gameEnvironment', 'Game Environment (O/U + Pace)', W.gameEnvironment,
      scoreGameEnvironment(input, NBA_MEDIAN_TOTAL, 0.04)),

    toWeighted('homeAway', 'Home / Away Split', W.homeAway,
      scoreHomeAway(input, 0.10)),

    toWeighted('headToHead', 'H2H vs Opponent', W.headToHead,
      scoreH2H(input, 3)),

    toWeighted('momentum', 'Momentum / Streak', W.momentum,
      scoreMomentum(input, 4)),
  ]
}
