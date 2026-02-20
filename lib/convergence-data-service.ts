// ============================================================
// lib/convergence-data-service.ts — Fetch sport-specific data
// for the convergence engine's enhanced factors.
// ============================================================
// Provides:
//   MLB: opposing pitcher quality (ERA, WHIP, K/9, hand, rest)
//         platoon splits (wRC+ vs LHP/RHP)
//         weather (via OpenWeather)
//   NFL: weather (via OpenWeather for outdoor stadiums)
//
// All functions return null/undefined on failure — the convergence
// engine factors have graceful fallbacks for missing data.

import "server-only"

import type { Player, Game } from '@/types/shared'
import type { LiveWeather } from '@/lib/weather-api'
import { getStadiumWeather, getNFLStadiumWeather } from '@/lib/weather-api'
import {
  getPitcherSeasonStats,
  getBatterPlatoonSplits,
  type PitcherSeasonStats,
  type PlatoonSplit,
} from '@/lib/mlb-api'
import { getSchedule, type ScheduleGame } from '@/lib/mlb-api'

// ──── TYPES ────────────────────────────────────────────────────

export interface OpposingPitcherData {
  name: string
  hand: 'L' | 'R'
  era: number
  whip: number
  kPer9: number
  fip?: number
  daysRest?: number
}

export interface PlatoonSplitData {
  wrcVsLHP: number   // wRC+ proxy: OPS / league avg OPS * 100
  wrcVsRHP: number
}

export interface ConvergenceExtraMLB {
  weather: LiveWeather | null
  opposingPitcher: OpposingPitcherData | null
  platoonSplits: PlatoonSplitData | null
  pitcherHand: 'L' | 'R' | null
}

export interface ConvergenceExtraNFL {
  weather: LiveWeather | null
}

// ──── MLB DATA FETCHERS ────────────────────────────────────────

// In-memory cache for MLB schedule (keyed by date string)
const _scheduleCache: Map<string, { data: ScheduleGame[]; ts: number }> = new Map()
const SCHEDULE_TTL = 30 * 60 * 1000 // 30 minutes

async function getCachedMLBSchedule(): Promise<ScheduleGame[]> {
  const today = new Date().toISOString().slice(0, 10)
  const cached = _scheduleCache.get(today)
  if (cached && Date.now() - cached.ts < SCHEDULE_TTL) {
    return cached.data
  }
  try {
    const { games } = await getSchedule(today)
    _scheduleCache.set(today, { data: games, ts: Date.now() })
    return games
  } catch (err) {
    console.error('[ConvergenceData] Failed to fetch MLB schedule:', err)
    return []
  }
}

/**
 * Find the opposing pitcher for a given batter from today's MLB schedule.
 * The MLB Stats API schedule endpoint hydrates probablePitcher with id, name, and hand.
 */
async function findOpposingPitcher(
  player: Player,
  game: Game,
): Promise<{ id: number; name: string; hand: 'L' | 'R' } | null> {
  try {
    const schedule = await getCachedMLBSchedule()
    if (schedule.length === 0) return null

    const isHome = game.homeTeam.id === player.team.id

    // Find this game in the MLB schedule
    // Match by team abbreviation since ESPN and MLB may use different game IDs
    const mlbGame = schedule.find(g => {
      const homeMatch = g.home.abbreviation === game.homeTeam.abbrev
      const awayMatch = g.away.abbreviation === game.awayTeam.abbrev
      return homeMatch || awayMatch
    })

    if (!mlbGame) return null

    // The opposing pitcher is on the other team
    const pitcher = isHome ? mlbGame.away.probablePitcher : mlbGame.home.probablePitcher
    if (!pitcher) return null

    return {
      id: pitcher.id,
      name: pitcher.fullName,
      hand: pitcher.hand ?? 'R',
    }
  } catch (err) {
    console.error('[ConvergenceData] Error finding opposing pitcher:', err)
    return null
  }
}

/**
 * Fetch full opposing pitcher stats: ERA, WHIP, K/9, etc.
 * Combines schedule data (identity + hand) with season stats.
 */
export async function fetchOpposingPitcherData(
  player: Player,
  game: Game,
): Promise<OpposingPitcherData | null> {
  const pitcher = await findOpposingPitcher(player, game)
  if (!pitcher) return null

  try {
    const stats = await getPitcherSeasonStats(pitcher.id)
    if (!stats) {
      // Return basic info even without full stats
      return {
        name: pitcher.name,
        hand: pitcher.hand,
        era: 0,
        whip: 0,
        kPer9: 0,
      }
    }

    // Compute K/9 from strikeouts and innings pitched
    const kPer9 = stats.inningsPitched > 0
      ? (stats.strikeOuts / stats.inningsPitched) * 9
      : 0

    return {
      name: pitcher.name,
      hand: pitcher.hand,
      era: stats.era,
      whip: stats.whip,
      kPer9: Math.round(kPer9 * 10) / 10,
    }
  } catch (err) {
    console.error(`[ConvergenceData] Error fetching pitcher stats for ${pitcher.name}:`, err)
    return {
      name: pitcher.name,
      hand: pitcher.hand,
      era: 0,
      whip: 0,
      kPer9: 0,
    }
  }
}

// League average OPS for wRC+ approximation (updated seasonally)
const LEAGUE_AVG_OPS = 0.710

/**
 * Fetch batter platoon splits and convert to wRC+ approximation.
 * Uses MLB Stats API platoon splits endpoint.
 * wRC+ approximation = (OPS / league_avg_OPS) * 100
 */
export async function fetchPlatoonSplitData(
  playerId: string,
): Promise<PlatoonSplitData | null> {
  try {
    // MLB Stats API uses numeric IDs
    const numericId = parseInt(playerId, 10)
    if (isNaN(numericId)) return null

    const splits = await getBatterPlatoonSplits(numericId)
    if (splits.length === 0) return null

    const vsLHP = splits.find(s => s.split === 'vs LHP')
    const vsRHP = splits.find(s => s.split === 'vs RHP')

    // Convert OPS to wRC+ approximation
    // wRC+ of 100 = league average
    const wrcVsLHP = vsLHP && vsLHP.plateAppearances >= 10
      ? Math.round((vsLHP.ops / LEAGUE_AVG_OPS) * 100)
      : 100 // default to league average if insufficient sample

    const wrcVsRHP = vsRHP && vsRHP.plateAppearances >= 10
      ? Math.round((vsRHP.ops / LEAGUE_AVG_OPS) * 100)
      : 100

    return { wrcVsLHP, wrcVsRHP }
  } catch (err) {
    console.error(`[ConvergenceData] Error fetching platoon splits for ${playerId}:`, err)
    return null
  }
}

// ──── COMBINED FETCHERS ────────────────────────────────────────

/**
 * Fetch all MLB-specific convergence data in parallel.
 * Returns weather, opposing pitcher, and platoon splits.
 */
export async function fetchMLBConvergenceData(
  player: Player,
  game: Game,
): Promise<ConvergenceExtraMLB> {
  const homeAbbrev = game.homeTeam.abbrev

  const [weather, pitcher, platoon] = await Promise.all([
    getStadiumWeather(homeAbbrev).catch(() => null),
    fetchOpposingPitcherData(player, game).catch(() => null),
    fetchPlatoonSplitData(player.id).catch(() => null),
  ])

  return {
    weather,
    opposingPitcher: pitcher,
    platoonSplits: platoon,
    pitcherHand: pitcher?.hand ?? null,
  }
}

/**
 * Fetch all NFL-specific convergence data.
 * Currently: weather only (snap/target data from Sleeper not available via public API).
 */
export async function fetchNFLConvergenceData(
  game: Game,
): Promise<ConvergenceExtraNFL> {
  const homeAbbrev = game.homeTeam.abbrev

  const weather = await getNFLStadiumWeather(homeAbbrev).catch(() => null)

  return { weather }
}
