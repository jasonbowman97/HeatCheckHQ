import { NextResponse } from "next/server"
import { scrapeFirstBasketData } from "@/lib/bettingpros-scraper"

export const revalidate = 43200 // 12 hours

export async function GET() {
  try {
    const data = await scrapeFirstBasketData()
    return NextResponse.json(data)
  } catch (e) {
    console.error("[NBA First Basket API]", e)
    return NextResponse.json({ players: [], teams: [] }, { status: 200 })
  }
}
