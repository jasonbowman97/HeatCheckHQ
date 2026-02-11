import { NextResponse } from "next/server"
import { getStatcastBatters, getStatcastPitchers } from "@/lib/baseball-savant"

export const revalidate = 43200

export async function GET() {
  try {
    const [batters, pitchers] = await Promise.all([
      getStatcastBatters(),
      getStatcastPitchers(),
    ])

    return NextResponse.json({
      batters,
      pitchers,
      source: "baseball-savant",
      count: { batters: batters.length, pitchers: pitchers.length },
    })
  } catch {
    return NextResponse.json({ batters: [], pitchers: [], source: "error" }, { status: 200 })
  }
}
