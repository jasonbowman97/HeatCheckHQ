import { NextResponse } from "next/server"
import { getNFLDvpWeekMatchups, getNFLDvpRankings } from "@/lib/nfl-defense-vs-position"
import type { NFLDvpPosition, NFLDvpStat } from "@/lib/nfl-defense-vs-position"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "matchups"

  try {
    if (mode === "rankings") {
      const position = (searchParams.get("position") ?? "QB") as NFLDvpPosition
      const stat = (searchParams.get("stat") ?? "PASS_YDS") as NFLDvpStat
      const rankings = await getNFLDvpRankings(position, stat)
      const res = NextResponse.json({ rankings })
      res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
      return res
    }

    // Default: this week's matchup insights
    const matchups = await getNFLDvpWeekMatchups()
    const res = NextResponse.json({ matchups })
    res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
    return res
  } catch (err) {
    console.error("[API] NFL DVP error:", err)
    return NextResponse.json({ matchups: [], error: "Failed to fetch data" }, { status: 500 })
  }
}
