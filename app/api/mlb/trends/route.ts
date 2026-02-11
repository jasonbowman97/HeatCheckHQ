import { NextResponse } from "next/server"
import { getBattingLeaders, getPitchingLeaders } from "@/lib/mlb-api"
import { buildTrends } from "@/lib/trends-builder"

export const revalidate = 43200

export async function GET() {
  try {
    const [batters, pitchers] = await Promise.all([getBattingLeaders(), getPitchingLeaders()])

    const trends = buildTrends(
      [
        {
          config: { name: "Hitting", statLabel: "AVG", hotPrefix: "Batting", coldPrefix: "Slumping at" },
          leaders: batters
            .filter((b) => b.atBats >= 50)
            .sort((a, b) => b.avg - a.avg)
            .map((b) => ({ id: String(b.id), name: b.name, team: b.team, position: b.pos, value: b.avg, displayValue: b.avg.toFixed(3) })),
        },
        {
          config: { name: "Power", statLabel: "HR", hotPrefix: "Leading with", coldPrefix: "Only" },
          leaders: batters
            .filter((b) => b.atBats >= 50)
            .sort((a, b) => b.homeRuns - a.homeRuns)
            .map((b) => ({ id: String(b.id), name: b.name, team: b.team, position: b.pos, value: b.homeRuns, displayValue: String(b.homeRuns) })),
        },
        {
          config: { name: "Pitching", statLabel: "ERA", hotPrefix: "Elite", coldPrefix: "Struggling with", lowerIsBetter: true },
          leaders: pitchers
            .filter((p) => p.inningsPitched >= 20)
            .sort((a, b) => a.era - b.era)
            .map((p) => ({ id: String(p.id), name: p.name, team: p.team, position: "SP", value: p.era, displayValue: p.era.toFixed(2) })),
        },
        {
          config: { name: "On Base", statLabel: "OBP", hotPrefix: "Leading with", coldPrefix: "Low" },
          leaders: batters
            .filter((b) => b.atBats >= 50)
            .sort((a, b) => b.obp - a.obp)
            .map((b) => ({ id: String(b.id), name: b.name, team: b.team, position: b.pos, value: b.obp, displayValue: b.obp.toFixed(3) })),
        },
      ],
      "mlb"
    )

    return NextResponse.json({ trends, source: "live" })
  } catch {
    return NextResponse.json({ trends: [], source: "error" }, { status: 200 })
  }
}
