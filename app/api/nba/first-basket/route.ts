import { NextResponse } from "next/server"
import { scrapeFirstBasketData } from "@/lib/bettingpros-scraper"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 43200

export async function GET() {
  try {
    const data = await scrapeFirstBasketData()
    const res = NextResponse.json({ ...data, updatedAt: new Date().toISOString() })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (e) {
    console.error("[NBA First Basket API]", e)
    return NextResponse.json({ players: [], teams: [] }, { status: 500 })
  }
}
