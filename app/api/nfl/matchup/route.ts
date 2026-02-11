import { NextResponse } from "next/server"
import { getNFLScoreboard, buildLiveMatchup } from "@/lib/nfl-api"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    // Fetch current schedule
    const games = await getNFLScoreboard()

    if (!games.length) {
      return NextResponse.json({ matchup: null, games: [] })
    }

    // If a specific game is requested, build that matchup
    const targetGame = gameId
      ? games.find((g) => g.id === gameId) ?? games[0]
      : games[0]

    const matchup = await buildLiveMatchup(targetGame)

    return NextResponse.json({
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
  } catch (e) {
    console.error("[NFL Matchup API]", e)
    return NextResponse.json({ matchup: null, games: [] }, { status: 500 })
  }
}
