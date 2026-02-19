import { NextResponse } from "next/server"
import { getNFLScoreboard, buildLiveMatchup } from "@/lib/nfl-api"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 300

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    // Fetch current schedule
    const games = await getNFLScoreboard()

    if (!games.length) {
      const res = NextResponse.json({ matchup: null, games: [] })
      res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
      return res
    }

    // If a specific game is requested, build that matchup
    const targetGame = gameId
      ? games.find((g) => g.id === gameId) ?? games[0]
      : games[0]

    const matchup = await buildLiveMatchup(targetGame)

    const res = NextResponse.json({
      matchup,
      games: games.map((g) => ({
        id: g.id,
        away: g.awayTeam.abbreviation,
        awayFull: g.awayTeam.displayName,
        awayId: g.awayTeam.id,
        home: g.homeTeam.abbreviation,
        homeFull: g.homeTeam.displayName,
        homeId: g.homeTeam.id,
        week: g.week,
        venue: g.venue,
        status: g.status,
        odds: g.odds,
      })),
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
    return res
  } catch (e) {
    console.error("[NFL Matchup API]", e)
    return NextResponse.json({ matchup: null, games: [] }, { status: 500 })
  }
}
