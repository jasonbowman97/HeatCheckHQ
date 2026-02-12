import { NextResponse } from "next/server"
import { getNFLDvpWeekMatchups, getNFLDvpRankings } from "@/lib/nfl-defense-vs-position"
import type { NFLDvpPosition, NFLDvpStat } from "@/lib/nfl-defense-vs-position"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "matchups"

  try {
    if (mode === "rankings") {
      const position = (searchParams.get("position") ?? "QB") as NFLDvpPosition
      const stat = (searchParams.get("stat") ?? "PASS_YDS") as NFLDvpStat
      const rankings = await getNFLDvpRankings(position, stat)
      return NextResponse.json({ rankings })
    }

    // Default: this week's matchup insights
    const matchups = await getNFLDvpWeekMatchups()
    return NextResponse.json({ matchups })
  } catch (err) {
    console.error("[API] NFL DVP error:", err)
    return NextResponse.json({ matchups: [], error: "Failed to fetch data" }, { status: 500 })
  }
}
