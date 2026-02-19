import { getNBAScoreboard } from "@/lib/nba-api"
import { NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const games = await getNBAScoreboard(date)
    const res = NextResponse.json({ games })
    res.headers.set("Cache-Control", cacheHeader(CACHE.LIVE))
    return res
  } catch (e) {
    console.error("[NBA Schedule API]", e)
    return NextResponse.json({ games: [] })
  }
}
