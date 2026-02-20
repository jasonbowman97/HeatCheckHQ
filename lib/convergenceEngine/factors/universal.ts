// ============================================================
// convergenceEngine/factors/universal.ts — Shared factor scorers
// ============================================================
// These scoring functions are used by all three sports. Sport-specific
// files call into these with their tuned parameters.

import { ewma, ewmaVsLine, type ALPHA } from '../utils/ewma'
import { mean, median } from '@/lib/math-utils'
import type { FactorInput, FactorResult } from '../types'

// ──── HELPER ────────────────────────────────────────────────────
/** Normalize a raw signal value to 0-1 strength using a threshold */
export function normalizeStrength(rawSignal: number, threshold: number = 1): number {
  return Math.min(1, Math.max(0, Math.abs(rawSignal) / threshold))
}

// ──── FACTOR: RECENT TREND (EWMA) ──────────────────────────────
export function scoreRecentTrend(
  input: FactorInput,
  alpha: number,
  lookback: number = 10,
  fireThreshold: number = 0.08, // 8% deviation
): FactorResult {
  const values = input.gameLogs
    .slice(0, lookback)
    .map(g => g.stats[input.stat] ?? 0)
    .reverse() // oldest first for EWMA

  if (values.length < 3) {
    return { signal: 'neutral', strength: 0, detail: 'Insufficient recent data', dataPoint: 'N/A' }
  }

  const ewmaVal = ewma(values, alpha)
  const deviationPct = input.line > 0 ? ((ewmaVal - input.line) / input.line) * 100 : 0
  const absDeviation = Math.abs(deviationPct)

  // Also compute simple hit rate for the detail string
  const hitCount = values.filter(v => v > input.line).length
  const hitRate = hitCount / values.length

  const signal: FactorResult['signal'] =
    deviationPct > fireThreshold * 100 ? 'over' :
    deviationPct < -fireThreshold * 100 ? 'under' :
    'neutral'

  // Strength scales from threshold to 2x threshold
  const strength = Math.min(1, absDeviation / (fireThreshold * 100 * 2))

  return {
    signal,
    strength,
    detail: `EWMA: ${ewmaVal.toFixed(1)} vs line ${input.line} (${Math.round(hitRate * 100)}% hit rate L${values.length})`,
    dataPoint: `${hitCount}/${values.length} over | EWMA ${ewmaVal.toFixed(1)}`,
  }
}

// ──── FACTOR: SEASON AVERAGE vs LINE ───────────────────────────
export function scoreSeasonAvg(
  input: FactorInput,
  useMedian: boolean = false,
  fireThresholdPct: number = 0.05, // 5% deviation
): FactorResult {
  const allValues = input.gameLogs.map(g => g.stats[input.stat] ?? 0)
  const center = useMedian ? median(allValues) : input.seasonStats.average
  const gap = center - input.line
  const deviationPct = input.line > 0 ? Math.abs(gap) / input.line : 0
  const threshold = Math.max(0.5, input.line * fireThresholdPct)

  const signal: FactorResult['signal'] =
    gap > threshold ? 'over' :
    gap < -threshold ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, deviationPct / (fireThresholdPct * 2.5)),
    detail: `Season ${useMedian ? 'median' : 'avg'}: ${center.toFixed(1)} vs line ${input.line}`,
    dataPoint: `${gap > 0 ? '+' : ''}${gap.toFixed(1)} ${gap > 0 ? 'above' : 'below'} line`,
  }
}

// ──── FACTOR: OPPONENT DEFENSE RANK ────────────────────────────
export function scoreOpponentDef(
  input: FactorInput,
  topThreshold: number = 10,   // top 10 = tough
  bottomThreshold: number = 21, // 21+ = easy
): FactorResult {
  const rank = input.defenseRanking.rank
  const allowed = input.defenseRanking.statsAllowed

  const signal: FactorResult['signal'] =
    rank >= bottomThreshold ? 'over' :
    rank <= topThreshold ? 'under' :
    'neutral'

  const strength = rank >= bottomThreshold
    ? (rank - 20) / 10
    : rank <= topThreshold
      ? (11 - rank) / 10
      : 0.2

  return {
    signal,
    strength: Math.min(1, strength),
    detail: `Opponent ranks #${rank} defending ${input.player.position}s`,
    dataPoint: `${allowed.toFixed(1)} ${input.stat}/game allowed`,
  }
}

// ──── FACTOR: HOME/AWAY SPLIT ──────────────────────────────────
export function scoreHomeAway(
  input: FactorInput,
  fireThresholdPct: number = 0.10, // 10% split difference
): FactorResult {
  const homeGames = input.gameLogs.filter(g => g.isHome)
  const awayGames = input.gameLogs.filter(g => !g.isHome)
  const homeAvg = homeGames.length > 0 ? mean(homeGames.map(g => g.stats[input.stat] ?? 0)) : input.seasonStats.average
  const awayAvg = awayGames.length > 0 ? mean(awayGames.map(g => g.stats[input.stat] ?? 0)) : input.seasonStats.average
  const venueAvg = input.isHome ? homeAvg : awayAvg
  const gap = venueAvg - input.line
  const threshold = Math.max(0.8, input.line * fireThresholdPct)

  const signal: FactorResult['signal'] =
    gap > threshold ? 'over' :
    gap < -threshold ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(gap) / (threshold * 2.5)),
    detail: `${input.isHome ? 'Home' : 'Away'} avg: ${venueAvg.toFixed(1)} (H: ${homeAvg.toFixed(1)} / A: ${awayAvg.toFixed(1)})`,
    dataPoint: `${input.isHome ? 'Home' : 'Away'} ${venueAvg.toFixed(1)} avg`,
  }
}

// ──── FACTOR: REST / FATIGUE (B2B) ─────────────────────────────
export function scoreRestFatigue(input: FactorInput): FactorResult {
  const isB2B = input.gameLogs[0]?.isBackToBack ?? false
  const restDays = input.gameLogs[0]?.restDays ?? 1
  const seasonAvg = input.seasonStats.average

  const b2bGames = input.gameLogs.filter(g => g.isBackToBack)
  const b2bAvg = b2bGames.length > 0 ? mean(b2bGames.map(g => g.stats[input.stat] ?? 0)) : seasonAvg
  const restedGames = input.gameLogs.filter(g => g.restDays >= 2)
  const restedAvg = restedGames.length > 0 ? mean(restedGames.map(g => g.stats[input.stat] ?? 0)) : seasonAvg

  const signal: FactorResult['signal'] =
    isB2B ? 'under' :
    restDays >= 2 ? 'over' :
    'neutral'

  const strength = isB2B
    ? Math.min(1, Math.abs(seasonAvg - b2bAvg) / 4)
    : restDays >= 2
      ? Math.min(1, Math.abs(restedAvg - seasonAvg) / 4)
      : 0.1

  return {
    signal,
    strength,
    detail: isB2B
      ? `Back-to-back. B2B avg: ${b2bAvg.toFixed(1)} vs season ${seasonAvg.toFixed(1)}`
      : `${restDays} days rest. Rested avg: ${restedAvg.toFixed(1)}`,
    dataPoint: isB2B ? `B2B: ${b2bAvg.toFixed(1)} avg` : `${restDays}d rest`,
  }
}

// ──── FACTOR: HEAD-TO-HEAD vs OPPONENT ─────────────────────────
export function scoreH2H(
  input: FactorInput,
  minGames: number = 3,
): FactorResult {
  const opponentAbbrev = input.isHome
    ? input.game.awayTeam.abbrev
    : input.game.homeTeam.abbrev

  const h2hGames = input.gameLogs.filter(g => g.opponent === opponentAbbrev)
  const h2hHitRate = h2hGames.length >= minGames
    ? h2hGames.filter(g => (g.stats[input.stat] ?? 0) > input.line).length / h2hGames.length
    : null

  if (h2hHitRate === null) {
    return {
      signal: 'neutral',
      strength: 0,
      detail: `Limited H2H data (${h2hGames.length} games vs ${opponentAbbrev})`,
      dataPoint: 'N/A',
    }
  }

  const signal: FactorResult['signal'] =
    h2hHitRate > 0.6 ? 'over' :
    h2hHitRate < 0.4 ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.abs(h2hHitRate - 0.5) * 2,
    detail: `${Math.round(h2hHitRate * 100)}% hit rate vs ${opponentAbbrev} (${h2hGames.length} games)`,
    dataPoint: `${h2hGames.filter(g => (g.stats[input.stat] ?? 0) > input.line).length}/${h2hGames.length} over`,
  }
}

// ──── FACTOR: MOMENTUM / STREAK ────────────────────────────────
export function scoreMomentum(
  input: FactorInput,
  fireThreshold: number = 4, // 4+ consecutive
): FactorResult {
  let streak = 0
  for (const g of input.gameLogs) {
    const val = g.stats[input.stat] ?? 0
    if (streak === 0) { streak = val > input.line ? 1 : -1 }
    else if (streak > 0 && val > input.line) { streak++ }
    else if (streak < 0 && val <= input.line) { streak-- }
    else { break }
  }

  const signal: FactorResult['signal'] =
    streak >= fireThreshold ? 'over' :
    streak <= -fireThreshold ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(streak) / 7),
    detail: streak > 0
      ? `${streak}-game over streak`
      : streak < 0
        ? `${Math.abs(streak)}-game under streak`
        : 'No active streak',
    dataPoint: `${Math.abs(streak)} game streak`,
  }
}

// ──── FACTOR: MINUTES / USAGE TREND ────────────────────────────
export function scoreMinutesTrend(
  input: FactorInput,
  fireThreshold: number = 2, // 2+ min shift
): FactorResult {
  if (input.stat === 'minutes') {
    return { signal: 'neutral', strength: 0, detail: 'N/A (analyzing minutes prop)', dataPoint: 'N/A' }
  }

  const minutesData = input.gameLogs
    .slice(0, 10)
    .map(g => g.minutesPlayed)
    .filter((m): m is number => m != null && m > 0)

  if (minutesData.length < 5) {
    return { signal: 'neutral', strength: 0, detail: 'Insufficient minutes data', dataPoint: 'N/A' }
  }

  const recentMins = mean(minutesData.slice(0, 5))
  const olderMins = mean(minutesData.slice(5))
  const minsDelta = recentMins - olderMins

  const signal: FactorResult['signal'] =
    minsDelta > fireThreshold ? 'over' :
    minsDelta < -fireThreshold ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(minsDelta) / 5),
    detail: `L5 avg: ${recentMins.toFixed(1)} min vs prior: ${olderMins.toFixed(1)} min`,
    dataPoint: `${minsDelta > 0 ? '+' : ''}${minsDelta.toFixed(1)} min shift`,
  }
}

// ──── FACTOR: GAME ENVIRONMENT (O/U + Pace) ────────────────────
export function scoreGameEnvironment(
  input: FactorInput,
  medianTotal: number,
  thresholdPct: number = 0.05, // 5% above/below median
): FactorResult {
  const gameTotal = input.game.total
  if (gameTotal == null || gameTotal <= 0) {
    return { signal: 'neutral', strength: 0, detail: 'Game total unavailable', dataPoint: 'N/A' }
  }

  const totalDelta = gameTotal - medianTotal
  const paceThreshold = medianTotal * thresholdPct
  const signal: FactorResult['signal'] =
    totalDelta > paceThreshold ? 'over' :
    totalDelta < -paceThreshold ? 'under' :
    'neutral'

  // Compute implied team total
  const spread = input.game.spread ?? 0
  const teamImplied = input.isHome
    ? (gameTotal / 2) - (spread / 2)
    : (gameTotal / 2) + (spread / 2)

  return {
    signal,
    strength: Math.min(1, Math.abs(totalDelta) / (paceThreshold * 3)),
    detail: `Game total: ${gameTotal} (median: ${medianTotal}). Team implied: ${teamImplied.toFixed(1)}`,
    dataPoint: `O/U ${gameTotal} | Implied ${teamImplied.toFixed(1)}`,
  }
}
