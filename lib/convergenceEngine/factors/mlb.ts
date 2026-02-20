// ============================================================
// convergenceEngine/factors/mlb.ts — MLB 9-factor convergence
// ============================================================
// 3 DEAD FACTORS REPLACED:
//   Rest/Fatigue  -> Opposing Pitcher Quality (highest single weight)
//   H2H vs Team   -> Ballpark Factor
//   Minutes Trend  -> Platoon / Handedness Split
//
// Weather & Wind is a new standalone factor at 11%.
// EWMA alpha=0.70, L7 lookback (daily play = smaller per-game variance).

import { ALPHA } from '../utils/ewma'
import { getWeatherSignal } from '../utils/weather'
import type { LiveWeather } from '@/lib/weather-api'
import {
  scoreRecentTrend,
  scoreSeasonAvg,
  scoreMomentum,
  scoreGameEnvironment,
} from './universal'
import type { FactorInput, WeightedFactor, FactorResult } from '../types'

// ─── WEIGHTS (sum to 1.0) ─────────────────────────────────────
const W = {
  recentTrend:     0.20, // Factor 1
  seasonAvg:       0.16, // Factor 2
  opposingPitcher: 0.22, // Factor 3 — NEW (highest weight — most predictive MLB signal)
  platoonSplit:    0.15, // Factor 4 — NEW
  ballparkFactor:  0.11, // Factor 5 — NEW
  weatherWind:     0.11, // Factor 6 — NEW
  lineupPosition:  0.03, // Factor 7
  gameEnvironment: 0.01, // Factor 8
  momentum:        0.01, // Factor 9 — tiebreaker only
} as const

const MLB_MEDIAN_TOTAL = 8.5

// League averages (updated seasonally — 2024 values)
const LEAGUE_AVG_ERA = 4.20
const LEAGUE_AVG_K9 = 8.9
const LEAGUE_AVG_WHIP = 1.30

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

// ──── NEW FACTOR: OPPOSING PITCHER QUALITY ─────────────────────
// Replaces "Opponent Defense Rank" — in MLB, batter vs pitcher is the correct lens.
// Uses FIP (defense-independent), K/9, and WHIP from the matchup service.
function scoreOpposingPitcher(input: FactorInput): FactorResult {
  // The matchup data passes pitcher info through the game or we extract from what's available
  // In the current system, opposing pitcher data flows through the matchup service
  // We check if defense ranking has pitcher-level granularity; for now use defense rank
  // as a proxy AND enhance with any pitcher data available on the game object

  // Access pitcher data if available (populated by matchup service)
  const pitcherData = (input.game as any)?.opposingPitcher as {
    name?: string; hand?: string; era?: number; whip?: number;
    fip?: number; kPer9?: number; daysRest?: number
  } | undefined

  if (!pitcherData || pitcherData.era == null) {
    // Fallback: use defense ranking as proxy for pitcher quality
    const rank = input.defenseRanking.rank
    const signal: FactorResult['signal'] =
      rank >= 21 ? 'over' : rank <= 10 ? 'under' : 'neutral'
    return {
      signal,
      strength: rank >= 21 ? (rank - 20) / 10 : rank <= 10 ? (11 - rank) / 10 : 0.2,
      detail: `Using team defense proxy (#${rank}) — no pitcher data available`,
      dataPoint: `DEF #${rank}`,
    }
  }

  let signalVal = 0

  // FIP preferred over ERA (strips out defense behind pitcher)
  const pitcherQuality = pitcherData.fip ?? pitcherData.era
  signalVal += (pitcherQuality - LEAGUE_AVG_ERA) * 0.4 // Bad pitcher (high ERA) = positive signal (OVER)

  // K/9 suppresses hit props directly
  if (pitcherData.kPer9 != null) {
    if (pitcherData.kPer9 > LEAGUE_AVG_K9 + 1.5) signalVal -= 0.3  // elite K pitcher -> UNDER
    if (pitcherData.kPer9 < LEAGUE_AVG_K9 - 1.5) signalVal += 0.2  // low K pitcher -> OVER
  }

  // WHIP for hits/walks props
  if (pitcherData.whip != null) {
    signalVal += (pitcherData.whip - LEAGUE_AVG_WHIP) * 0.5 // High WHIP = more baserunners = OVER
  }

  // Pitcher rest: extra rest = better stuff; short rest = tired arm
  if (pitcherData.daysRest != null) {
    if (pitcherData.daysRest >= 5) signalVal -= 0.2 // Well-rested = tougher
    if (pitcherData.daysRest <= 3) signalVal += 0.2 // Short rest = hittable
  }

  const signal: FactorResult['signal'] =
    signalVal > 0.3 ? 'over' :
    signalVal < -0.3 ? 'under' :
    'neutral'

  const pitcherName = pitcherData.name ?? 'Unknown'
  const hand = pitcherData.hand ?? '?'

  return {
    signal,
    strength: Math.min(1, Math.abs(signalVal) / 0.8),
    detail: `${pitcherName} (${hand}HP) — ERA ${pitcherData.era.toFixed(2)}, WHIP ${pitcherData.whip?.toFixed(2) ?? 'N/A'}`,
    dataPoint: `ERA ${pitcherData.era.toFixed(2)} | K/9 ${pitcherData.kPer9?.toFixed(1) ?? 'N/A'}`,
  }
}

// ──── NEW FACTOR: PLATOON / HANDEDNESS SPLIT ───────────────────
// Replaces "Minutes Trend" — MLB has no minutes. Platoon splits are the
// correct opportunity-quality signal (batter performance vs LHP/RHP).
function scorePlatoonSplit(input: FactorInput): FactorResult {
  // Platoon data would come from player splits — check if available
  const splits = (input.player as any)?.splits as {
    wrcVsLHP?: number; wrcVsRHP?: number
  } | undefined

  const pitcherHand = ((input.game as any)?.opposingPitcher?.hand as string)?.toUpperCase()

  if (!splits || !pitcherHand || (splits.wrcVsLHP == null && splits.wrcVsRHP == null)) {
    // Fallback: use home/away split as proxy since we don't have platoon data yet
    return {
      signal: 'neutral',
      strength: 0,
      detail: 'Platoon split data unavailable',
      dataPoint: 'N/A',
    }
  }

  // 100 = league average wRC+
  const relevantWRC = pitcherHand === 'L' ? (splits.wrcVsLHP ?? 100) : (splits.wrcVsRHP ?? 100)
  const gap = relevantWRC - 100

  const signal: FactorResult['signal'] =
    gap > 15 ? 'over' :
    gap < -15 ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(gap) / 40), // 40pt gap = full signal strength
    detail: `wRC+ vs ${pitcherHand}HP: ${relevantWRC} (league avg: 100)`,
    dataPoint: `${gap > 0 ? '+' : ''}${gap} wRC+`,
  }
}

// ──── NEW FACTOR: BALLPARK FACTOR ──────────────────────────────
// Replaces "Rest / Fatigue" — position players play 162 games,
// no B2B concept applies. Ballpark factor fires every game and
// has documented +20-30% swing at Coors.
function scoreBallparkFactor(input: FactorInput): FactorResult {
  // Ballpark factors: 100 = neutral
  // Coors = 115-125, Petco = 85-92, Fenway = 105-110
  const parkFactors: Record<string, number> = {
    COL: 120, CIN: 108, TEX: 105, BOS: 107, CHC: 105,
    NYY: 103, ATL: 102, PHI: 102, MIL: 101, MIN: 101,
    CLE: 100, STL: 100, DET: 100, BAL: 100, WSH: 100,
    KC: 99, CWS: 99, LAA: 98, PIT: 98, ARI: 97,
    TOR: 97, HOU: 97, NYM: 96, LAD: 96, SEA: 95,
    TB: 94, SF: 93, SD: 92, MIA: 91, OAK: 94,
  }

  // Determine which team is home (game is at their park)
  const homeAbbrev = input.game.homeTeam.abbrev
  const parkFactor = parkFactors[homeAbbrev] ?? 100

  const deviation = (parkFactor - 100) / 100

  const signal: FactorResult['signal'] =
    parkFactor > 105 ? 'over' :
    parkFactor < 95 ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(deviation) * 5), // 20% deviation = full strength
    detail: `${input.game.venue} — Park factor: ${parkFactor}`,
    dataPoint: `PF ${parkFactor}`,
  }
}

// ──── FACTOR: LINEUP POSITION / AB OPPORTUNITY ─────────────────
// Batting 1-2 = ~4.5 expected ABs vs bottom of order ~3.5 ABs
function scoreLineupPosition(input: FactorInput): FactorResult {
  // Lineup position would come from confirmed lineup data
  const lineupSpot = (input.player as any)?.lineupSpot as number | undefined

  if (lineupSpot == null) {
    return {
      signal: 'neutral',
      strength: 0,
      detail: 'Lineup position unavailable',
      dataPoint: 'N/A',
    }
  }

  const expectedABs = 4.8 - (lineupSpot * 0.15)
  const rawSignal = (expectedABs - 3.9) / 0.5

  const signal: FactorResult['signal'] =
    lineupSpot <= 2 ? 'over' :
    lineupSpot >= 7 ? 'under' :
    'neutral'

  return {
    signal,
    strength: Math.min(1, Math.abs(rawSignal)),
    detail: `Batting #${lineupSpot} — ~${expectedABs.toFixed(1)} expected ABs`,
    dataPoint: `#${lineupSpot} in order`,
  }
}

// ──── MLB MAIN EXPORT ──────────────────────────────────────────

export interface MLBExtraData {
  weather?: LiveWeather | null
}

export function getMLBFactors(input: FactorInput, extra?: MLBExtraData): WeightedFactor[] {
  // Convert weather from LiveWeather to our WeatherData format
  const weatherData = extra?.weather ? {
    windSpeedMph: extra.weather.windSpeed,
    windDirection: extra.weather.windDirection,
    tempF: extra.weather.temperature,
    humidity: extra.weather.humidity,
    condition: extra.weather.condition,
    isIndoor: extra.weather.condition === 'Dome',
  } : undefined

  const homeAbbrev = input.game.homeTeam.abbrev
  const weatherResult = getWeatherSignal(weatherData, 'mlb', input.stat, homeAbbrev)

  return [
    toWeighted('recentTrend', 'Recent Trend (L7 EWMA)', W.recentTrend,
      scoreRecentTrend(input, ALPHA.mlb, 7, 0.08)),

    toWeighted('seasonAvg', 'Season Average vs Line', W.seasonAvg,
      scoreSeasonAvg(input, true, 0.05)), // Use MEDIAN for MLB too

    toWeighted('opposingPitcher', 'Opposing Pitcher Quality', W.opposingPitcher,
      scoreOpposingPitcher(input)),

    toWeighted('platoonSplit', 'Platoon / Handedness Split', W.platoonSplit,
      scorePlatoonSplit(input)),

    toWeighted('ballparkFactor', 'Ballpark Factor', W.ballparkFactor,
      scoreBallparkFactor(input)),

    toWeighted('weatherWind', 'Weather & Wind', W.weatherWind, {
      signal: weatherResult.signal > 0.2 ? 'over' : weatherResult.signal < -0.2 ? 'under' : 'neutral',
      strength: Math.abs(weatherResult.signal),
      detail: weatherResult.detail,
      dataPoint: weatherResult.dataPoint,
    }),

    toWeighted('lineupPosition', 'Lineup Position', W.lineupPosition,
      scoreLineupPosition(input)),

    toWeighted('gameEnvironment', 'Game Environment (Run Total)', W.gameEnvironment,
      scoreGameEnvironment(input, MLB_MEDIAN_TOTAL, 0.05)),

    toWeighted('momentum', 'Momentum / Streak', W.momentum,
      scoreMomentum(input, 4)),
  ]
}
