import { NextResponse } from "next/server"
import { getHotHitters } from "@/lib/hot-hitters"

// Cache the response for 12 hours since scanning all players is expensive
export const revalidate = 43200

// In-memory cache to avoid re-scanning during the same server lifetime
let cachedData: { data: Awaited<ReturnType<typeof getHotHitters>>; timestamp: number } | null = null
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export async function GET() {
  try {
    // Return cached data if still fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({ streaks: cachedData.data, cached: true })
    }

    const streaks = await getHotHitters()
    cachedData = { data: streaks, timestamp: Date.now() }

    return NextResponse.json({ streaks, cached: false })
  } catch (err) {
    console.error("[API] Hot hitters error:", err)
    return NextResponse.json({ streaks: [], error: "Failed to fetch hot hitters" }, { status: 500 })
  }
}
