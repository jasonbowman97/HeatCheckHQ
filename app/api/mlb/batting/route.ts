import { getBattingLeaders } from "@/lib/mlb-api"
import { getStatcastBatters } from "@/lib/baseball-savant"
import { NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 43200

export async function GET() {
  try {
    // Fetch standard stats + Statcast advanced metrics in parallel
    const [leaders, statcast] = await Promise.all([
      getBattingLeaders(),
      getStatcastBatters().catch(() => []),
    ])

    // Index Statcast data by player name for merging
    const statcastMap = new Map(statcast.map((s) => [s.playerName, s]))

    // Merge Statcast data into leaders
    const enriched = leaders.map((leader) => {
      const sc = statcastMap.get(leader.name)
      return {
        ...leader,
        // Statcast advanced metrics (0 if unavailable)
        exitVelocity: sc?.exitVelocity ?? 0,
        barrelPct: sc?.barrelPct ?? 0,
        hardHitPct: sc?.hardHitPct ?? 0,
        xBA: sc?.xBA ?? 0,
        xSLG: sc?.xSLG ?? 0,
        xwOBA: sc?.xwOBA ?? 0,
        whiffPct: sc?.whiffPct ?? 0,
        batSpeed: sc?.batSpeed ?? 0,
      }
    })

    const res = NextResponse.json({ leaders: enriched, hasStatcast: statcast.length > 0 })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (e) {
    console.error("[MLB Batting API]", e)
    return NextResponse.json({ leaders: [], hasStatcast: false }, { status: 500 })
  }
}
