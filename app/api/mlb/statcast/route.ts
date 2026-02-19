import { NextResponse } from "next/server"
import { getStatcastBatters, getStatcastPitchers } from "@/lib/baseball-savant"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 43200

export async function GET() {
  try {
    const [batters, pitchers] = await Promise.all([
      getStatcastBatters(),
      getStatcastPitchers(),
    ])

    const res = NextResponse.json({
      batters,
      pitchers,
      source: "baseball-savant",
      count: { batters: batters.length, pitchers: pitchers.length },
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch {
    console.error("[MLB Statcast API] Error fetching statcast data")
    return NextResponse.json({ batters: [], pitchers: [], source: "error" }, { status: 500 })
  }
}
