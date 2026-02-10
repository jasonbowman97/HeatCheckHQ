import { getBattingLeaders } from "@/lib/mlb-api"
import { NextResponse } from "next/server"

export const revalidate = 3600

export async function GET() {
  try {
    const leaders = await getBattingLeaders()
    return NextResponse.json({ leaders })
  } catch (e) {
    console.error("[MLB Batting API]", e)
    return NextResponse.json({ leaders: [] })
  }
}
