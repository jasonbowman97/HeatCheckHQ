import { NextResponse } from "next/server"
import { getMLBStreakTrends } from "@/lib/mlb-streaks"
import { getSchedule } from "@/lib/mlb-api"
import type { Trend } from "@/lib/trends-types"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 3600

export async function GET() {
  try {
    // Fetch streak trends + today's schedule in parallel
    const [streakTrends, schedule] = await Promise.all([
      getMLBStreakTrends().catch(() => [] as Trend[]),
      getSchedule().catch(() => ({ games: [], date: "" })),
    ])

    // Build a map: team abbreviation → opponent abbreviation for today's games
    const teamToOpponent = new Map<string, string>()
    for (const g of schedule.games) {
      teamToOpponent.set(g.away.abbreviation, g.home.abbreviation)
      teamToOpponent.set(g.home.abbreviation, g.away.abbreviation)
    }

    // Enrich trends with Playing Today info
    const enriched = streakTrends.map((t) => {
      const opp = teamToOpponent.get(t.team)
      return {
        ...t,
        playingToday: !!opp,
        opponent: opp ?? undefined,
      }
    })

    const res = NextResponse.json({
      trends: enriched,
      source: enriched.length > 0 ? "live" : "empty",
      date: schedule.date,
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
    return res
  } catch {
    console.error("[MLB Trends API] Error fetching trends")
    return NextResponse.json({ trends: [], source: "error", date: "" }, { status: 500 })
  }
}
