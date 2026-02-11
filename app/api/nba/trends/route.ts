import { NextResponse } from "next/server"
import { getNBALeaders } from "@/lib/nba-api"
import { getNBAStreakTrends } from "@/lib/nba-streaks"
import { buildTrends } from "@/lib/trends-builder"

export const revalidate = 3600

// Map ESPN v3 category names to our trend categories
const CATEGORY_MAP: Record<string, { name: string; statLabel: string; hotPrefix: string; coldPrefix: string }> = {
  pointsPerGame: { name: "Scoring", statLabel: "PPG", hotPrefix: "Averaging", coldPrefix: "Only" },
  "3PointsMadePerGame": { name: "Threes", statLabel: "3PM/G", hotPrefix: "Hitting", coldPrefix: "Cold at" },
  reboundsPerGame: { name: "Rebounds", statLabel: "RPG", hotPrefix: "Grabbing", coldPrefix: "Only" },
  assistsPerGame: { name: "Assists", statLabel: "APG", hotPrefix: "Dishing", coldPrefix: "Just" },
}

export async function GET() {
  try {
    // Fetch both leader-based trends and game-log streak trends in parallel
    const [espnCategories, streakTrends] = await Promise.all([
      getNBALeaders(),
      getNBAStreakTrends().catch(() => []),
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

    const leaderTrends = buildTrends(categoryInputs, "nba")

    // Merge: streak trends first (from all players), then leader-based trends
    // De-duplicate by player name + category
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

    return NextResponse.json({ trends: merged, source: "live" })
  } catch {
    return NextResponse.json({ trends: [], source: "error" }, { status: 200 })
  }
}
