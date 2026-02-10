import { NextResponse } from "next/server"
import { getNFLLeaders } from "@/lib/nfl-api"
import { buildTrends } from "@/lib/trends-builder"

export const revalidate = 3600

const CATEGORY_MAP: Record<string, { name: string; statLabel: string; hotPrefix: string; coldPrefix: string }> = {
  passingYards: { name: "Passing", statLabel: "Pass YDS", hotPrefix: "Throwing for", coldPrefix: "Only" },
  rushingYards: { name: "Rushing", statLabel: "Rush YDS", hotPrefix: "Running for", coldPrefix: "Just" },
  receivingYards: { name: "Receiving", statLabel: "Rec YDS", hotPrefix: "Racking up", coldPrefix: "Only" },
  totalTouchdowns: { name: "Touchdowns", statLabel: "TD", hotPrefix: "Scoring", coldPrefix: "Just" },
}

export async function GET() {
  try {
    const espnCategories = await getNFLLeaders()

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

    const trends = buildTrends(categoryInputs, "nfl")
    return NextResponse.json({ trends, source: "live" })
  } catch {
    return NextResponse.json({ trends: [], source: "error" }, { status: 200 })
  }
}
