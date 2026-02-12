import { getPitchArsenal } from "@/lib/mlb-api"
import { NextRequest, NextResponse } from "next/server"

export const revalidate = 43200

export async function GET(req: NextRequest) {
  const pitcherId = Number(req.nextUrl.searchParams.get("pitcherId"))
  const season = Number(req.nextUrl.searchParams.get("season")) || undefined

  if (!pitcherId) {
    return NextResponse.json({ error: "pitcherId required" }, { status: 400 })
  }

  try {
    const arsenal = await getPitchArsenal(pitcherId, season)
    return NextResponse.json({ arsenal })
  } catch (e) {
    console.error(`[MLB Pitcher Arsenal API] pitcherId=${pitcherId}`, e)
    return NextResponse.json({ arsenal: [] })
  }
}
