import { NextResponse } from "next/server"
import { fetchSavantBatters } from "@/lib/savant"
import { cacheHeader, CACHE } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { players, year } = await fetchSavantBatters()

    const res = NextResponse.json({ players, year, updatedAt: new Date().toISOString() })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (err) {
    console.error("[Due for HR API]", err)
    return NextResponse.json(
      { error: "Failed to fetch Statcast data", players: [], year: new Date().getFullYear() },
      { status: 500 }
    )
  }
}
