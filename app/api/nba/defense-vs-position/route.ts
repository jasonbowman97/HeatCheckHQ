import { NextResponse } from "next/server"
import { getTodayMatchupInsights, getPositionRankings } from "@/lib/nba-defense-vs-position"
import type { Position, StatCategory } from "@/lib/nba-defense-vs-position"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "matchups"

  try {
    if (mode === "rankings") {
      const position = (searchParams.get("position") ?? "PG") as Position
      const stat = (searchParams.get("stat") ?? "PTS") as StatCategory
      const rankings = await getPositionRankings(position, stat)
      const res = NextResponse.json({ rankings, updatedAt: new Date().toISOString() })
      res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
      return res
    }

    // Default: matchup insights (optionally for a specific date)
    const date = searchParams.get("date") ?? undefined
    const matchups = await getTodayMatchupInsights(date)
    const res = NextResponse.json({ matchups, updatedAt: new Date().toISOString() })
    res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
    return res
  } catch (err) {
    console.error("[API] Defense vs Position error:", err)
    return NextResponse.json({ matchups: [], error: "Failed to fetch data" }, { status: 500 })
  }
}
