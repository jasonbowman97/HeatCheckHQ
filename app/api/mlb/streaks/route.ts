/**
 * MLB Streaks API — Returns enriched player data with raw per-game stats.
 * Includes both batters (H, HR, RBI, R, SB, TB) and pitchers (K).
 *
 * GET /api/mlb/streaks
 * Returns: { players: EnrichedPlayer[], updatedAt: string }
 */
import "server-only"

import { NextResponse } from "next/server"
import {
  getAllMLBBatters,
  getAllMLBPitchers,
  getPlayerGameLog,
  type GameLogEntry,
} from "@/lib/espn/mlb"
import { fetchMLBScoreboard } from "@/lib/espn/client"
import type { EnrichedPlayer, PlayerGameStat } from "@/lib/streak-types"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const BATCH_SIZE = 15
const EMPTY_STAT: PlayerGameStat = {
  date: "", opponent: "",
  pts: 0, reb: 0, ast: 0, threepm: 0, stl: 0, blk: 0, to: 0, min: 0,
  fgm: 0, fga: 0, ftm: 0, fta: 0,
  h: 0, hr: 0, rbi: 0, r: 0, sb: 0, tb: 0, k: 0,
  passYd: 0, passTd: 0, rushYd: 0, rushTd: 0, recYd: 0, rec: 0, recTd: 0,
}

/** Get today's MLB games to tag players as "playing today" */
async function getMLBTodayGames(): Promise<Map<string, string>> {
  const teamToOpponent = new Map<string, string>()
  try {
    const scoreboard = await fetchMLBScoreboard()
    const events = (scoreboard.events ?? []) as Array<Record<string, unknown>>
    for (const event of events) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      if (competitions.length === 0) continue
      const comp = competitions[0]
      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>
      if (competitors.length !== 2) continue

      const away = competitors.find((c) => (c.homeAway as string) === "away") as Record<string, unknown>
      const home = competitors.find((c) => (c.homeAway as string) === "home") as Record<string, unknown>
      if (!away || !home) continue

      const awayTeam = away.team as Record<string, unknown>
      const homeTeam = home.team as Record<string, unknown>
      teamToOpponent.set(awayTeam.abbreviation as string, homeTeam.abbreviation as string)
      teamToOpponent.set(homeTeam.abbreviation as string, awayTeam.abbreviation as string)
    }
  } catch {
    // Non-critical
  }
  return teamToOpponent
}

/** Convert MLB game log entry to PlayerGameStat */
function toBatterGameStat(g: GameLogEntry): PlayerGameStat {
  const h = Number(g.stats.H) || 0
  const hr = Number(g.stats.HR) || 0
  const doubles = Number(g.stats["2B"]) || 0
  const triples = Number(g.stats["3B"]) || 0
  const singles = h - hr - doubles - triples
  // Total bases = 1B + 2×2B + 3×3B + 4×HR
  const tb = singles + (2 * doubles) + (3 * triples) + (4 * hr)

  return {
    ...EMPTY_STAT,
    date: g.date,
    opponent: g.opponent,
    h,
    hr,
    rbi: Number(g.stats.RBI) || 0,
    r: Number(g.stats.R) || 0,
    sb: Number(g.stats.SB) || 0,
    tb,
  }
}

function toPitcherGameStat(g: GameLogEntry): PlayerGameStat {
  return {
    ...EMPTY_STAT,
    date: g.date,
    opponent: g.opponent,
    k: Number(g.stats.SO) || 0,
  }
}

function seasonAvg(gameLogs: GameLogEntry[], key: string): number {
  if (gameLogs.length === 0) return 0
  return gameLogs.reduce((s, g) => s + (Number(g.stats[key]) || 0), 0) / gameLogs.length
}

function seasonAvgTB(gameLogs: GameLogEntry[]): number {
  if (gameLogs.length === 0) return 0
  const total = gameLogs.reduce((s, g) => {
    const h = Number(g.stats.H) || 0
    const hr = Number(g.stats.HR) || 0
    const doubles = Number(g.stats["2B"]) || 0
    const triples = Number(g.stats["3B"]) || 0
    const singles = h - hr - doubles - triples
    return s + singles + (2 * doubles) + (3 * triples) + (4 * hr)
  }, 0)
  return total / gameLogs.length
}

export async function GET() {
  try {
    const [batters, pitchers, todayGames] = await Promise.all([
      getAllMLBBatters(),
      getAllMLBPitchers(),
      getMLBTodayGames(),
    ])

    console.log(`[MLB Streaks API] Processing ${batters.length} batters + ${pitchers.length} pitchers`)

    const enrichedPlayers: EnrichedPlayer[] = []

    // Process batters
    for (let i = 0; i < batters.length; i += BATCH_SIZE) {
      const batch = batters.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const gameLogs = await getPlayerGameLog(player.id)
          // Filter for batters with meaningful playing time (2+ AB in 5+ games)
          const qualifyingGames = gameLogs.filter((g) => (Number(g.stats.AB) || 0) >= 2)
          if (qualifyingGames.length < 5) return null

          const games: PlayerGameStat[] = qualifyingGames.slice(0, 20).map(toBatterGameStat)
          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: player.position,
            games,
            seasonAvg: {
              h: seasonAvg(qualifyingGames, "H"),
              hr: seasonAvg(qualifyingGames, "HR"),
              rbi: seasonAvg(qualifyingGames, "RBI"),
              r: seasonAvg(qualifyingGames, "R"),
              sb: seasonAvg(qualifyingGames, "SB"),
              tb: seasonAvgTB(qualifyingGames),
            },
            playingToday: !!opponent,
            opponent: opponent ?? undefined,
          } satisfies EnrichedPlayer
        })
      )

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value) {
          enrichedPlayers.push(result.value)
        }
      }
    }

    // Process pitchers
    for (let i = 0; i < pitchers.length; i += BATCH_SIZE) {
      const batch = pitchers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const gameLogs = await getPlayerGameLog(player.id)
          // Filter for pitchers with meaningful pitching (3+ IP in 3+ starts)
          const qualifyingGames = gameLogs.filter((g) => {
            const ip = parseFloat(String(g.stats.IP) || "0")
            return ip >= 3
          })
          if (qualifyingGames.length < 3) return null

          const games: PlayerGameStat[] = qualifyingGames.slice(0, 20).map(toPitcherGameStat)
          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: player.position,
            games,
            seasonAvg: {
              k: seasonAvg(qualifyingGames, "SO"),
            },
            playingToday: !!opponent,
            opponent: opponent ?? undefined,
          } satisfies EnrichedPlayer
        })
      )

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value) {
          enrichedPlayers.push(result.value)
        }
      }
    }

    console.log(`[MLB Streaks API] Returning ${enrichedPlayers.length} qualifying players`)

    return NextResponse.json(
      { players: enrichedPlayers, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    )
  } catch (err) {
    console.error("[MLB Streaks API] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch player data", players: [] },
      { status: 500 }
    )
  }
}
