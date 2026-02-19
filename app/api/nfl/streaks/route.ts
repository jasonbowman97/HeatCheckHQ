/**
 * NFL Streaks API — Returns enriched player data with raw per-game stats.
 * QBs (Pass YD, Pass TD), RBs (Rush YD, Rush TD), WRs (Rec YD, REC, Rec TD).
 *
 * GET /api/nfl/streaks
 * Returns: { players: EnrichedPlayer[], updatedAt: string }
 */
import "server-only"

import { NextResponse } from "next/server"
import { getNFLPlayerGameLog, type NFLGameLogEntry } from "@/lib/nfl-streaks"
import { fetchNFLScoreboard } from "@/lib/espn/client"
import type { EnrichedPlayer, PlayerGameStat } from "@/lib/streak-types"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const BATCH_SIZE = 10
const EMPTY_STAT: PlayerGameStat = {
  date: "", opponent: "",
  pts: 0, reb: 0, ast: 0, threepm: 0, stl: 0, blk: 0, to: 0, min: 0,
  fgm: 0, fga: 0, ftm: 0, fta: 0,
  h: 0, hr: 0, rbi: 0, r: 0, sb: 0, tb: 0, k: 0,
  passYd: 0, passTd: 0, rushYd: 0, rushTd: 0, recYd: 0, rec: 0, recTd: 0,
}

/** Get today's NFL games to tag players as "playing today" */
async function getNFLTodayGames(): Promise<Map<string, string>> {
  const teamToOpponent = new Map<string, string>()
  try {
    const scoreboard = await fetchNFLScoreboard()
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

/** Fetch top NFL players from ESPN leaders (QBs, RBs, WRs) */
async function getNFLLeaders(): Promise<{
  qbs: Array<{ id: string; name: string; team: string }>
  rbs: Array<{ id: string; name: string; team: string }>
  wrs: Array<{ id: string; name: string; team: string }>
}> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders",
      { next: { revalidate: 43200 } }
    )
    if (!res.ok) return { qbs: [], rbs: [], wrs: [] }
    const data = await res.json()
    const categories = (data.leaders?.categories ?? []) as Array<{
      name: string
      leaders: Array<{ athlete: { id: string; displayName: string }; team: { abbreviation: string } }>
    }>

    const extract = (catName: string, limit: number) => {
      const cat = categories.find((c) => c.name === catName)
      return (cat?.leaders ?? []).slice(0, limit).map((l) => ({
        id: l.athlete.id,
        name: l.athlete.displayName,
        team: l.team?.abbreviation ?? "NFL",
      }))
    }

    return {
      qbs: extract("passingYards", 30),
      rbs: extract("rushingYards", 30),
      wrs: extract("receivingYards", 30),
    }
  } catch {
    return { qbs: [], rbs: [], wrs: [] }
  }
}

/** Convert NFL QB game log to PlayerGameStat */
function toQBGameStat(g: NFLGameLogEntry): PlayerGameStat {
  return {
    ...EMPTY_STAT,
    date: g.date,
    opponent: g.opponent,
    passYd: g.stats.passingYards ?? 0,
    passTd: g.stats.passingTouchdowns ?? 0,
  }
}

function toRBGameStat(g: NFLGameLogEntry): PlayerGameStat {
  return {
    ...EMPTY_STAT,
    date: g.date,
    opponent: g.opponent,
    rushYd: g.stats.rushingYards ?? 0,
    rushTd: g.stats.rushingTouchdowns ?? 0,
  }
}

function toWRGameStat(g: NFLGameLogEntry): PlayerGameStat {
  return {
    ...EMPTY_STAT,
    date: g.date,
    opponent: g.opponent,
    recYd: g.stats.receivingYards ?? 0,
    rec: g.stats.receptions ?? 0,
    recTd: g.stats.receivingTouchdowns ?? 0,
  }
}

function nflSeasonAvg(gameLogs: NFLGameLogEntry[], stat: string): number {
  if (gameLogs.length === 0) return 0
  return gameLogs.reduce((s, g) => s + (g.stats[stat] ?? 0), 0) / gameLogs.length
}

export async function GET() {
  try {
    const [{ qbs, rbs, wrs }, todayGames] = await Promise.all([
      getNFLLeaders(),
      getNFLTodayGames(),
    ])

    console.log(`[NFL Streaks API] Processing ${qbs.length} QBs, ${rbs.length} RBs, ${wrs.length} WRs`)

    const enrichedPlayers: EnrichedPlayer[] = []

    // Process QBs
    for (let i = 0; i < qbs.length; i += BATCH_SIZE) {
      const batch = qbs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const gameLogs = await getNFLPlayerGameLog(player.id)
          if (gameLogs.length < 3) return null

          const games: PlayerGameStat[] = gameLogs.slice(0, 20).map(toQBGameStat)
          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: "QB",
            games,
            seasonAvg: {
              passYd: nflSeasonAvg(gameLogs, "passingYards"),
              passTd: nflSeasonAvg(gameLogs, "passingTouchdowns"),
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

    // Process RBs
    for (let i = 0; i < rbs.length; i += BATCH_SIZE) {
      const batch = rbs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const gameLogs = await getNFLPlayerGameLog(player.id)
          if (gameLogs.length < 3) return null

          const games: PlayerGameStat[] = gameLogs.slice(0, 20).map(toRBGameStat)
          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: "RB",
            games,
            seasonAvg: {
              rushYd: nflSeasonAvg(gameLogs, "rushingYards"),
              rushTd: nflSeasonAvg(gameLogs, "rushingTouchdowns"),
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

    // Process WRs
    for (let i = 0; i < wrs.length; i += BATCH_SIZE) {
      const batch = wrs.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const gameLogs = await getNFLPlayerGameLog(player.id)
          if (gameLogs.length < 3) return null

          const games: PlayerGameStat[] = gameLogs.slice(0, 20).map(toWRGameStat)
          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: "WR",
            games,
            seasonAvg: {
              recYd: nflSeasonAvg(gameLogs, "receivingYards"),
              rec: nflSeasonAvg(gameLogs, "receptions"),
              recTd: nflSeasonAvg(gameLogs, "receivingTouchdowns"),
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

    console.log(`[NFL Streaks API] Returning ${enrichedPlayers.length} qualifying players`)

    return NextResponse.json(
      { players: enrichedPlayers, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    )
  } catch (err) {
    console.error("[NFL Streaks API] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch player data", players: [] },
      { status: 500 }
    )
  }
}
