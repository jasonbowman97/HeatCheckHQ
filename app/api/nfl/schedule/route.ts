import { getNFLScoreboard } from "@/lib/nfl-api"
import { NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get("week") ? Number(searchParams.get("week")) : undefined
    const raw = await getNFLScoreboard(week)
    const games = raw.map((g) => ({
      id: g.id,
      away: g.awayTeam.abbreviation,
      awayFull: g.awayTeam.displayName,
      awayLogo: g.awayTeam.logo,
      home: g.homeTeam.abbreviation,
      homeFull: g.homeTeam.displayName,
      homeLogo: g.homeTeam.logo,
      week: g.week,
      venue: g.venue,
    }))
    const res = NextResponse.json({ games })
    res.headers.set("Cache-Control", cacheHeader(CACHE.LIVE))
    return res
  } catch (e) {
    console.error("[NFL Schedule API]", e)
    return NextResponse.json({ games: [] })
  }
}
