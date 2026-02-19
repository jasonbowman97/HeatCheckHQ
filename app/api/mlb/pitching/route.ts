import { getPitchingLeaders, getSchedule } from "@/lib/mlb-api"
import { getStatcastPitchers } from "@/lib/baseball-savant"
import { NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 43200

export async function GET() {
  try {
    // Fetch standard stats + Statcast advanced metrics + today's schedule in parallel
    const [leaders, statcast, schedule] = await Promise.all([
      getPitchingLeaders(),
      getStatcastPitchers().catch(() => []),
      getSchedule().catch(() => ({ games: [], date: "" })),
    ])

    // Collect today's probable starter IDs
    const todayStarterIds = new Set<number>()
    for (const game of schedule.games) {
      if (game.home.probablePitcher) todayStarterIds.add(game.home.probablePitcher.id)
      if (game.away.probablePitcher) todayStarterIds.add(game.away.probablePitcher.id)
    }

    // Index Statcast data by player name for merging
    const statcastMap = new Map(statcast.map((s) => [s.playerName, s]))

    // Merge Statcast data into leaders
    const enriched = leaders.map((leader) => {
      const sc = statcastMap.get(leader.name)
      return {
        ...leader,
        barrelPctAgainst: sc?.barrelPctAgainst ?? 0,
        hardHitPctAgainst: sc?.hardHitPctAgainst ?? 0,
        whiffPct: sc?.whiffPct ?? 0,
        isTodayStarter: todayStarterIds.has(leader.id),
      }
    })

    const res = NextResponse.json({
      leaders: enriched,
      hasStatcast: statcast.length > 0,
      todayStarterIds: Array.from(todayStarterIds),
      updatedAt: new Date().toISOString(),
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (e) {
    console.error("[MLB Pitching API]", e)
    return NextResponse.json({ leaders: [], hasStatcast: false, todayStarterIds: [] }, { status: 500 })
  }
}
