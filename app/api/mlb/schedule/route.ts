import { getSchedule } from "@/lib/mlb-api"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const data = await getSchedule(date)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[MLB Schedule API]", e)
    return NextResponse.json({ games: [], date: new Date().toISOString().slice(0, 10) })
  }
}
