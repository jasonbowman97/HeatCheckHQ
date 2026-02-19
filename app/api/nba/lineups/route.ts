import { NextResponse } from "next/server"
import { fetchRecentPositionMap } from "@/lib/nba-lineups"
import { cacheHeader, CACHE } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const positionMap = await fetchRecentPositionMap()

    // Convert Map<team, Map<position, player>> → Record<team, string[]>
    const starters: Record<string, string[]> = {}
    for (const [teamAbbr, positions] of positionMap) {
      const names: string[] = []
      for (const [, player] of positions) {
        names.push(player.playerName)
      }
      starters[teamAbbr] = names
    }

    const res = NextResponse.json({ starters })
    res.headers.set("Cache-Control", cacheHeader(CACHE.SEMI_LIVE))
    return res
  } catch (err) {
    console.error("[NBA Lineups API]", err)
    return NextResponse.json({ starters: {} }, { status: 500 })
  }
}
