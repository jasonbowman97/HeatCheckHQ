import { NextResponse } from "next/server"
import { getNBALeaders } from "@/lib/nba-api"
import { buildTrends } from "@/lib/trends-builder"

export const revalidate = 3600

// Map ESPN category names to our trend categories
const CATEGORY_MAP: Record<string, { name: string; statLabel: string; hotPrefix: string; coldPrefix: string }> = {
  points: { name: "Scoring", statLabel: "PPG", hotPrefix: "Averaging", coldPrefix: "Only" },
  threePointFieldGoalsMade: { name: "Threes", statLabel: "3PM/G", hotPrefix: "Hitting", coldPrefix: "Cold at" },
  rebounds: { name: "Rebounds", statLabel: "RPG", hotPrefix: "Grabbing", coldPrefix: "Only" },
  assists: { name: "Assists", statLabel: "APG", hotPrefix: "Dishing", coldPrefix: "Just" },
}

export async function GET() {
  try {
    const espnCategories = await getNBALeaders()

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

    const trends = buildTrends(categoryInputs, "nba")
    return NextResponse.json({ trends, source: "live" })
  } catch {
    return NextResponse.json({ trends: [], source: "error" }, { status: 200 })
  }
}
