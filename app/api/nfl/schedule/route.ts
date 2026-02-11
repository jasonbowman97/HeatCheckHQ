import { getNFLScoreboard } from "@/lib/nfl-api"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get("week") ? Number(searchParams.get("week")) : undefined
    const games = await getNFLScoreboard(week)
    return NextResponse.json({ games })
  } catch (e) {
    console.error("[NFL Schedule API]", e)
    return NextResponse.json({ games: [] })
  }
}
