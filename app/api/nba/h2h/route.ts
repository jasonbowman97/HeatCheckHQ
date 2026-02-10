import { NextResponse } from "next/server"
import { getNBAScoreboard, getNBATeamSummary } from "@/lib/nba-api"

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const games = await getNBAScoreboard(date)

    // Collect unique team IDs
    const teamIds = new Set<string>()
    for (const g of games) {
      teamIds.add(g.awayTeam.id)
      teamIds.add(g.homeTeam.id)
    }

    // Fetch team summaries in parallel
    const entries = await Promise.all(
      Array.from(teamIds).map(async (id) => {
        const summary = await getNBATeamSummary(id)
        return [id, summary] as const
      })
    )
    const summaries = Object.fromEntries(entries.filter(([, v]) => v !== null))

    return NextResponse.json({ games, summaries })
  } catch (e) {
    console.error("[NBA H2H API]", e)
    return NextResponse.json({ games: [], summaries: {} })
  }
}
