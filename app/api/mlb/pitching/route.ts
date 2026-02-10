import { getPitchingLeaders } from "@/lib/mlb-api"
import { NextResponse } from "next/server"

export const revalidate = 3600

export async function GET() {
  try {
    const leaders = await getPitchingLeaders()
    return NextResponse.json({ leaders })
  } catch (e) {
    console.error("[MLB Pitching API]", e)
    return NextResponse.json({ leaders: [] })
  }
}
