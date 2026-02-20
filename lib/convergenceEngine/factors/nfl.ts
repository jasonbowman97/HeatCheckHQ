// ============================================================
// convergenceEngine/factors/nfl.ts — NFL 9-factor convergence
// ============================================================
// 1 DEAD FACTOR REPLACED:
//   Minutes Trend -> Snap % + Target Share Trend
//
// Weather & Dome Status is a standalone factor at 5%.
// EWMA alpha=0.90, L4 lookback (17-game season = high info per game).

import { ALPHA } from '../utils/ewma'
import { getWeatherSignal } from '../utils/weather'
import type { LiveWeather } from '@/lib/weather-api'
import {
  scoreRecentTrend,
  scoreSeasonAvg,
  scoreOpponentDef,
  scoreHomeAway,
  scoreMomentum,
  scoreGameEnvironment,
} from './universal'
import type { FactorInput, WeightedFactor, FactorResult } from '../types'

// ─── WEIGHTS (sum to 1.0) ─────────────────────────────────────
const W = {
  recentTrend:     0.25, // Factor 1
  seasonAvg:       0.18, // Factor 2
  opponentDef:     0.17, // Factor 3
  snapTargetShare: 0.15, // Factor 4 — NEW
  restGameScript:  0.10, // Factor 5
  gameEnvironment: 0.08, // Factor 6
  weatherDome:     0.05, // Factor 7
  homeAwayDiv:     0.01, // Factor 8
  momentum:        0.01, // Factor 9 — tiebreaker only
} as const

const NFL_MEDIAN_TOTAL = 44

// NFL dome / indoor stadiums
const NFL_INDOOR_STADIUMS: Record<string, boolean> = {
  ARI: true, ATL: true, DAL: true, DET: true,
  HOU: true, IND: true, LV: true, LAC: true, // SoFi technically open-air but covered
  LAR: true, MIN: true, NO: true,
}

function toWeighted(
  id: string,
  label: string,
  weight: number,
  result: FactorResult,
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

// ──── NEW FACTOR: SNAP % + TARGET SHARE TREND ──────────────────
// Replaces "Minutes Trend" — NFL has no minute-tracking that's comparable.
// Target share is the most reliable opportunity signal for WR/TE props.
// For RBs, carries share is used instead.
function scoreSnapTargetShare(input: FactorInput): FactorResult {
  // Snap and target data would come from player stats
  const snapData = (input.player as any)?.snapPct as number | undefined
  const seasonAvgSnapPct = (input.player as any)?.seasonAvgSnapPct as number | undefined
  const targetShare = (input.player as any)?.targetShare as number | undefined
  const seasonAvgTargetShare = (input.player as any)?.seasonAvgTargetShare as number | undefined
  const carriesShare = (input.player as any)?.carriesShare as number | undefined
  const seasonAvgCarriesShare = (input.player as any)?.seasonAvgCarriesShare as number | undefined
  const position = input.player.position?.toUpperCase()

  // For RBs: use carries share
  if (position === 'RB' && carriesShare != null && seasonAvgCarriesShare != null) {
    const delta = carriesShare - seasonAvgCarriesShare
    const signal: FactorResult['signal'] =
      delta > 0.08 ? 'over' :
      delta < -0.08 ? 'under' :
      'neutral'

    return {
      signal,
      strength: Math.min(1, Math.abs(delta) / 0.15),
      detail: `Carries share: ${(carriesShare * 100).toFixed(0)}% (season: ${(seasonAvgCarriesShare * 100).toFixed(0)}%)`,
      dataPoint: `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(0)}% carries share`,
    }
  }

  // For WR/TE: use target share + snap %
  if (targetShare != null && seasonAvgTargetShare != null) {
    const snapDelta = (snapData ?? 0) - (seasonAvgSnapPct ?? 0)
    const targetDelta = targetShare - seasonAvgTargetShare
    // 60% target share weight, 40% snap% weight
    const combinedSignal = (targetDelta * 0.60) + (snapDelta * 0.40)

    const signal: FactorResult['signal'] =
      combinedSignal > 0.08 ? 'over' :
      combinedSignal < -0.08 ? 'under' :
      'neutral'

    return {
      signal,
      strength: Math.min(1, Math.abs(combinedSignal) / 0.15),
      detail: `Target share: ${(targetShare * 100).toFixed(0)}% (season: ${(seasonAvgTargetShare * 100).toFixed(0)}%)`,
      dataPoint: `${targetDelta > 0 ? '+' : ''}${(targetDelta * 100).toFixed(0)}% target share`,
    }
  }

  // Fallback: no snap/target data — use minutes trend if available
  const minutesData = input.gameLogs
    .slice(0, 6)
    .map(g => g.minutesPlayed)
    .filter((m): m is number => m != null && m > 0)

  if (minutesData.length >= 3) {
    const recent = minutesData.slice(0, 3).reduce((s, v) => s + v, 0) / 3
    const older = minutesData.slice(3).reduce((s, v) => s + v, 0) / Math.max(1, minutesData.slice(3).length)
    const delta = recent - older

    return {
      signal: delta > 3 ? 'over' : delta < -3 ? 'under' : 'neutral',
      strength: Math.min(1, Math.abs(delta) / 8),
      detail: `Snap data unavailable. Using play time proxy: L3 avg ${recent.toFixed(0)} vs prior ${older.toFixed(0)}`,
      dataPoint: `${delta > 0 ? '+' : ''}${delta.toFixed(0)} min shift`,
    }
  }

  return {
    signal: 'neutral',
    strength: 0,
    detail: 'Snap % and target share data unavailable',
    dataPoint: 'N/A',
  }
}

// ──── FACTOR: REST & GAME SCRIPT RISK ──────────────────────────
// Short week (Thursday) = under lean on skill positions.
// Spread > 14 = game script risk — blowouts change play-calling.
function scoreRestGameScript(input: FactorInput): FactorResult {
  const restDays = input.gameLogs[0]?.restDays ?? 7
  const spread = input.game.spread ?? 0
  const absSpread = Math.abs(spread)
  const isHome = input.isHome

  let signalVal = 0
  const details: string[] = []

  // Short week (Thursday game after Sunday) = ~4 days rest
  if (restDays <= 4) {
    signalVal -= 0.3
    details.push(`Short week (${restDays}d rest)`)
  } else if (restDays >= 10) {
    signalVal += 0.15
    details.push(`Extended rest (${restDays}d)`)
  }

  // Game script risk: blowout potential reduces late-game opportunities
  if (absSpread > 14) {
    // Large favorite: might sit starters / run clock
    const isFavored = (isHome && spread < -14) || (!isHome && spread > 14)
    if (isFavored) {
      signalVal -= 0.2
      details.push(`Heavy favorite (${spread > 0 ? '+' : ''}${spread}) — garbage time risk`)
    } else {
      // Underdog: garbage time can inflate or deflate — push neutral-ish
      signalVal -= 0.1
      details.push(`Heavy underdog — game script volatile`)
    }
  } else if (absSpread > 10) {
    signalVal -= 0.1
    details.push(`Moderate spread (${spread > 0 ? '+' : ''}${spread})`)
  }

  const signal: FactorResult['signal'] =
    signalVal > 0.15 ? 'over' :
    signalVal < -0.15 ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(signalVal) / 0.5),
    detail: details.length > 0 ? details.join(' | ') : `${restDays}d rest, spread ${spread}`,
    dataPoint: `${restDays}d rest | Spread ${spread > 0 ? '+' : ''}${spread}`,
  }
}

// ──── FACTOR: HOME/AWAY + DIVISIONAL ───────────────────────────
function scoreHomeAwayDivisional(input: FactorInput): FactorResult {
  // Get base home/away result
  const baseResult = scoreHomeAway(input, 0.10)

  // Check if divisional (would need division data — for now use conference proxy)
  const isDivisional = (input.game as any)?.isDivisional ?? false

  if (isDivisional) {
    // Divisional games: historically lower-scoring, more conservative
    return {
      ...baseResult,
      detail: `${baseResult.detail} | Divisional matchup (historically tighter)`,
    }
  }

  return baseResult
}

// ──── NFL MAIN EXPORT ──────────────────────────────────────────

export interface NFLExtraData {
  weather?: LiveWeather | null
}

export function getNFLFactors(input: FactorInput, extra?: NFLExtraData): WeightedFactor[] {
  const homeAbbrev = input.game.homeTeam.abbrev
  const isIndoor = NFL_INDOOR_STADIUMS[homeAbbrev] ?? false

  // Convert weather
  const weatherData = extra?.weather ? {
    windSpeedMph: extra.weather.windSpeed,
    windDirection: extra.weather.windDirection,
    tempF: extra.weather.temperature,
    humidity: extra.weather.humidity,
    condition: extra.weather.condition,
    isIndoor,
  } : isIndoor ? {
    windSpeedMph: 0,
    windDirection: 'N/A',
    tempF: 72,
    humidity: 45,
    condition: 'Dome',
    isIndoor: true,
  } : undefined

  const weatherResult = getWeatherSignal(weatherData, 'nfl', input.stat, homeAbbrev)

  return [
    toWeighted('recentTrend', 'Recent Trend (L4 EWMA)', W.recentTrend,
      scoreRecentTrend(input, ALPHA.nfl, 4, 0.08)),

    toWeighted('seasonAvg', 'Season Average vs Line', W.seasonAvg,
      scoreSeasonAvg(input, true, 0.05)), // Use MEDIAN — RB/WR are positively skewed

    toWeighted('opponentDef', 'Opponent Defense (vs Position)', W.opponentDef,
      scoreOpponentDef(input, 5, 21)), // NFL: top 5 = tough (not top 10)

    toWeighted('snapTargetShare', 'Snap % + Target Share Trend', W.snapTargetShare,
      scoreSnapTargetShare(input)),

    toWeighted('restGameScript', 'Rest & Game Script Risk', W.restGameScript,
      scoreRestGameScript(input)),

    toWeighted('gameEnvironment', 'Game Environment (Implied Points)', W.gameEnvironment,
      scoreGameEnvironment(input, NFL_MEDIAN_TOTAL, 0.05)),

    toWeighted('weatherDome', 'Weather & Dome Status', W.weatherDome, {
      signal: weatherResult.signal > 0.15 ? 'over' : weatherResult.signal < -0.15 ? 'under' : 'neutral',
      strength: Math.abs(weatherResult.signal),
      detail: weatherResult.detail,
      dataPoint: isIndoor ? 'Indoor dome' : weatherResult.dataPoint,
    }),

    toWeighted('homeAwayDiv', 'Home / Away + Divisional', W.homeAwayDiv,
      scoreHomeAwayDivisional(input)),

    toWeighted('momentum', 'Momentum / Streak', W.momentum,
      scoreMomentum(input, 4)),
  ]
}
