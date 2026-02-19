// ============================================================
// app/api/check-prop/share-image/route.tsx — Share card image for Check My Prop
// ============================================================
// Returns a 1200x675 PNG share card for a given prop check.
// Used for: Twitter/X cards, copied share images, OG meta images.
//
// GET /api/check-prop/share-image?player=LeBron+James&stat=points&line=25.5&...

import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import { CheckPropSheet, type CheckPropShareData } from "@/lib/social/sheets/check-prop-sheet"
import { readFile } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 30

async function loadFonts() {
  const fontsDir = join(process.cwd(), "public", "fonts")
  const [bold, semibold, regular] = await Promise.all([
    readFile(join(fontsDir, "Inter-Bold.otf")),
    readFile(join(fontsDir, "Inter-SemiBold.otf")),
    readFile(join(fontsDir, "Inter-Regular.otf")),
  ])
  return [
    { name: "Inter-Bold", data: bold.buffer as ArrayBuffer, weight: 700 as const, style: "normal" as const },
    { name: "Inter-SemiBold", data: semibold.buffer as ArrayBuffer, weight: 600 as const, style: "normal" as const },
    { name: "Inter-Regular", data: regular.buffer as ArrayBuffer, weight: 400 as const, style: "normal" as const },
  ]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Parse share data from query params
  const data: CheckPropShareData = {
    playerName: searchParams.get("player") ?? "Unknown Player",
    teamAbbrev: searchParams.get("team") ?? "",
    statLabel: searchParams.get("statLabel") ?? searchParams.get("stat") ?? "Stat",
    line: Number(searchParams.get("line") ?? 0),
    verdictLabel: searchParams.get("verdict") ?? "TOSS-UP",
    verdictDirection: (searchParams.get("direction") as "over" | "under" | "toss-up") ?? "toss-up",
    convergenceScore: Number(searchParams.get("score") ?? 0),
    confidence: Number(searchParams.get("confidence") ?? 50),
    hitRateL10: Number(searchParams.get("hitRate") ?? 0.5),
    avgMarginL10: Number(searchParams.get("margin") ?? 0),
    seasonAvg: Number(searchParams.get("avg") ?? 0),
    heatRingHitRate: Number(searchParams.get("heatHitRate") ?? 0.5),
    heatRingStreak: Number(searchParams.get("streak") ?? 0),
    sport: searchParams.get("sport") ?? "nba",
    opponentAbbrev: searchParams.get("opp") ?? "",
    isHome: searchParams.get("home") === "true",
  }

  try {
    const fonts = await loadFonts()

    return new ImageResponse(
      <CheckPropSheet data={data} />,
      {
        width: 1200,
        height: 675,
        fonts,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("[Share Image] Generation error:", error)
    return new Response("Failed to generate image", { status: 500 })
  }
}
