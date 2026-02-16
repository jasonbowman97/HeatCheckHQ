import { NextResponse, type NextRequest } from "next/server"
import { fetchNBAAthleteGameLog } from "@/lib/espn/client"
import { parseNBAGameLog } from "@/lib/nba-streaks"

export const revalidate = 3600 // 1 hour CDN cache

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params

  if (!playerId || !/^\d+$/.test(playerId)) {
    return NextResponse.json({ error: "Invalid player ID" }, { status: 400 })
  }

  try {
    const raw = await fetchNBAAthleteGameLog(playerId)
    const games = parseNBAGameLog(raw)
    const last10 = games.slice(0, 10)

    return NextResponse.json({
      playerId,
      games: last10.map((g) => ({
        date: g.date,
        opponent: g.opponent,
        pts: g.stats.PTS ?? 0,
        reb: g.stats.REB ?? 0,
        ast: g.stats.AST ?? 0,
        min: g.stats.MIN ?? 0,
        fgm: g.stats.FGM ?? 0,
        fga: g.stats.FGA ?? 0,
        threepm: g.stats["3PM"] ?? 0,
        threepa: g.stats["3PA"] ?? 0,
        ftm: g.stats.FTM ?? 0,
        fta: g.stats.FTA ?? 0,
        stl: g.stats.STL ?? 0,
        blk: g.stats.BLK ?? 0,
        to: g.stats.TO ?? 0,
      })),
    })
  } catch (error) {
    console.error(`[NBA Gamelog] Error for player ${playerId}:`, error)
    return NextResponse.json({ error: "Failed to fetch game log" }, { status: 500 })
  }
}
