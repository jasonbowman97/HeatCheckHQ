import { NextResponse } from "next/server"
import { getNFLLeaders } from "@/lib/nfl-api"
import { getNFLStreakTrends } from "@/lib/nfl-streaks"
import { buildTrends } from "@/lib/trends-builder"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 3600

const CATEGORY_MAP: Record<string, { name: string; statLabel: string; hotPrefix: string; coldPrefix: string }> = {
  passingYards: { name: "Passing", statLabel: "Pass YDS", hotPrefix: "Throwing for", coldPrefix: "Only" },
  rushingYards: { name: "Rushing", statLabel: "Rush YDS", hotPrefix: "Running for", coldPrefix: "Just" },
  receivingYards: { name: "Receiving", statLabel: "Rec YDS", hotPrefix: "Racking up", coldPrefix: "Only" },
  totalTouchdowns: { name: "Touchdowns", statLabel: "TD", hotPrefix: "Scoring", coldPrefix: "Just" },
}

export async function GET() {
  try {
    // Fetch both leader-based trends and game-log streak trends in parallel
    const [espnCategories, streakTrends] = await Promise.all([
      getNFLLeaders(),
      getNFLStreakTrends().catch(() => []),
    ])

    const categoryInputs = Object.entries(CATEGORY_MAP)
      .map(([espnName, config]) => {
        const cat = espnCategories.find((c) => c.name === espnName)
        if (!cat) return null
        return {
          config,
          leaders: cat.leaders.slice(0, 15).map((l) => ({
            id: l.athlete.id,
            name: l.athlete.displayName,
            team: l.athlete.team?.abbreviation ?? "???",
            position: l.athlete.position?.abbreviation ?? "??",
            value: l.value,
            displayValue: l.displayValue,
          })),
        }
      })
      .filter(Boolean) as Parameters<typeof buildTrends>[0]

    const leaderTrends = buildTrends(categoryInputs, "nfl")

    // Merge: streak trends first (game-log based), then leader-based
    const seen = new Set<string>()
    const merged = []

    for (const t of streakTrends) {
      const key = `${t.playerName}-${t.category}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(t)
      }
    }
    for (const t of leaderTrends) {
      const key = `${t.playerName}-${t.category}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(t)
      }
    }

    const res = NextResponse.json({ trends: merged, source: "live" })
    res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
    return res
  } catch {
    console.error("[NFL Trends API] Error fetching trends")
    return NextResponse.json({ trends: [], source: "error" }, { status: 500 })
  }
}
