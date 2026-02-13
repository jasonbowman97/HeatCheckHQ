import { getSchedule } from "@/lib/mlb-api"
import { NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const data = await getSchedule(date)
    const res = NextResponse.json(data)
    res.headers.set("Cache-Control", cacheHeader(CACHE.LIVE))
    return res
  } catch (e) {
    console.error("[MLB Schedule API]", e)
    return NextResponse.json({ games: [], date: new Date().toISOString().slice(0, 10) })
  }
}
