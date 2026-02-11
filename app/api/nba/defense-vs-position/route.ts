import { NextResponse } from "next/server"
import { getTodayMatchupInsights, getPositionRankings } from "@/lib/nba-defense-vs-position"
import type { Position, StatCategory } from "@/lib/nba-defense-vs-position"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "matchups"

  try {
    if (mode === "rankings") {
      const position = (searchParams.get("position") ?? "PG") as Position
      const stat = (searchParams.get("stat") ?? "PTS") as StatCategory
      const rankings = await getPositionRankings(position, stat)
      return NextResponse.json({ rankings })
    }

    // Default: today's matchup insights
    const matchups = await getTodayMatchupInsights()
    return NextResponse.json({ matchups })
  } catch (err) {
    console.error("[API] Defense vs Position error:", err)
    return NextResponse.json({ matchups: [], error: "Failed to fetch data" }, { status: 500 })
  }
}
