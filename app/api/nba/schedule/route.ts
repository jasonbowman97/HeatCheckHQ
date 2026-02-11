import { getNBAScoreboard } from "@/lib/nba-api"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const games = await getNBAScoreboard(date)
    return NextResponse.json({ games })
  } catch (e) {
    console.error("[NBA Schedule API]", e)
    return NextResponse.json({ games: [] })
  }
}
