/**
 * NBA Streaks API — Returns enriched player data with raw per-game stats.
 * The client uses this to compute hit rates for any threshold/window combo
 * without making additional API calls.
 *
 * GET /api/nba/streaks
 * Returns: { players: EnrichedPlayer[], updatedAt: string }
 */
import "server-only"

import { NextResponse } from "next/server"
import {
  getAllNBAPlayers,
  getTodayGames,
  parseNBAGameLog,
  isRotationPlayer,
  seasonAvg,
} from "@/lib/nba-streaks"
import { fetchNBAAthleteGameLog } from "@/lib/espn/client"
import type { EnrichedPlayer, PlayerGameStat } from "@/lib/streak-types"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const BATCH_SIZE = 15

export async function GET() {
  try {
    const [allPlayers, todayGames] = await Promise.all([
      getAllNBAPlayers(),
      getTodayGames(),
    ])

    console.log(`[NBA Streaks API] Processing ${allPlayers.length} rostered players`)

    const enrichedPlayers: EnrichedPlayer[] = []

    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          const raw = await fetchNBAAthleteGameLog(player.id)
          const gameLogs = parseNBAGameLog(raw)
          if (!isRotationPlayer(gameLogs)) return null

          // Convert NBAGameLogEntry to PlayerGameStat
          const games: PlayerGameStat[] = gameLogs.map((g) => ({
            date: g.date,
            opponent: g.opponent,
            pts: g.stats.PTS ?? 0,
            reb: g.stats.REB ?? 0,
            ast: g.stats.AST ?? 0,
            threepm: g.stats["3PM"] ?? 0,
            stl: g.stats.STL ?? 0,
            blk: g.stats.BLK ?? 0,
            to: g.stats.TO ?? 0,
            min: g.stats.MIN ?? 0,
            fgm: g.stats.FGM ?? 0,
            fga: g.stats.FGA ?? 0,
            ftm: g.stats.FTM ?? 0,
            fta: g.stats.FTA ?? 0,
          }))

          const opponent = todayGames.get(player.team)

          return {
            id: player.id,
            name: player.name,
            team: player.team,
            position: player.position,
            games,
            seasonAvg: {
              pts: seasonAvg(gameLogs, "PTS"),
              reb: seasonAvg(gameLogs, "REB"),
              ast: seasonAvg(gameLogs, "AST"),
              threepm: seasonAvg(gameLogs, "3PM"),
              stl: seasonAvg(gameLogs, "STL"),
              blk: seasonAvg(gameLogs, "BLK"),
              min: seasonAvg(gameLogs, "MIN"),
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

    console.log(`[NBA Streaks API] Returning ${enrichedPlayers.length} rotation players`)

    return NextResponse.json(
      { players: enrichedPlayers, updatedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    )
  } catch (err) {
    console.error("[NBA Streaks API] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch player data", players: [] },
      { status: 500 }
    )
  }
}
