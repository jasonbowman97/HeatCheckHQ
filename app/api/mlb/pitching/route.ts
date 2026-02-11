import { getPitchingLeaders } from "@/lib/mlb-api"
import { getStatcastPitchers } from "@/lib/baseball-savant"
import { NextResponse } from "next/server"

export const revalidate = 43200

export async function GET() {
  try {
    // Fetch standard stats + Statcast advanced metrics in parallel
    const [leaders, statcast] = await Promise.all([
      getPitchingLeaders(),
      getStatcastPitchers().catch(() => []),
    ])

    // Index Statcast data by player name for merging
    const statcastMap = new Map(statcast.map((s) => [s.playerName, s]))

    // Merge Statcast data into leaders
    const enriched = leaders.map((leader) => {
      const sc = statcastMap.get(leader.name)
      return {
        ...leader,
        // Statcast advanced metrics (0 if unavailable)
        exitVelocityAgainst: sc?.exitVelocityAgainst ?? 0,
        barrelPctAgainst: sc?.barrelPctAgainst ?? 0,
        hardHitPctAgainst: sc?.hardHitPctAgainst ?? 0,
        xBA: sc?.xBA ?? 0,
        xSLG: sc?.xSLG ?? 0,
        xwOBA: sc?.xwOBA ?? 0,
        whiffPct: sc?.whiffPct ?? 0,
        avgFastball: sc?.avgFastball ?? 0,
      }
    })

    return NextResponse.json({ leaders: enriched, hasStatcast: statcast.length > 0 })
  } catch (e) {
    console.error("[MLB Pitching API]", e)
    return NextResponse.json({ leaders: [], hasStatcast: false })
  }
}
