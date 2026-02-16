import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { getTodayMatchupInsights } from "@/lib/nba-defense-vs-position"
import { getTeamLogos } from "@/lib/social/shared/team-logo"
import { NbaDvpSheet } from "@/lib/social/sheets/nba-dvp-sheet"
import { SHEET } from "@/lib/social/social-config"
import type { DvpRow } from "@/lib/social/card-types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Load fonts once
async function loadFonts(baseUrl: string) {
  const [bold, semibold, regular] = await Promise.all([
    fetch(`${baseUrl}/fonts/Inter-Bold.otf`).then((r) => r.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Inter-SemiBold.otf`).then((r) => r.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Inter-Regular.otf`).then((r) => r.arrayBuffer()),
  ])
  return [
    { name: "Inter-Bold", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Inter-SemiBold", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Inter-Regular", data: regular, weight: 400 as const, style: "normal" as const },
  ]
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  const baseUrl = new URL(req.url).origin

  try {
    switch (type) {
      case "nba_dvp":
        return await renderNbaDvp(baseUrl)
      // Future sheet types will be added here
      default:
        return new Response(`Unknown sheet type: ${type}`, { status: 404 })
    }
  } catch (error) {
    console.error(`[social/sheets/${type}] Error:`, error)
    return new Response(`Failed to generate sheet: ${error}`, { status: 500 })
  }
}

/* ── NBA DVP Sheet ── */

async function renderNbaDvp(baseUrl: string) {
  const [fonts, matchups] = await Promise.all([
    loadFonts(baseUrl),
    getTodayMatchupInsights(),
  ])

  // Flatten insights into rows, sorted by rank (worst defense first), limit to top 20
  const rows: DvpRow[] = matchups
    .flatMap((m) =>
      m.insights.map((insight) => ({
        teamAbbr: insight.teamAbbr,
        teamLogo:
          m.awayTeam.abbr === insight.teamAbbr
            ? m.awayTeam.logo
            : m.homeTeam.logo,
        opponentAbbr:
          m.awayTeam.abbr === insight.teamAbbr
            ? m.homeTeam.abbr
            : m.awayTeam.abbr,
        opponentLogo:
          m.awayTeam.abbr === insight.teamAbbr
            ? m.homeTeam.logo
            : m.awayTeam.logo,
        position: insight.position,
        statCategory: insight.statCategory,
        avgAllowed: insight.avgAllowed,
        rank: insight.rank,
        rankLabel: insight.rankLabel,
        playerName: insight.playerName,
      }))
    )
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20)

  // Collect all logo URLs and batch-fetch as base64
  const allLogos = rows.flatMap((r) => [r.teamLogo, r.opponentLogo])
  const logos = await getTeamLogos(allLogos)

  // Format today's date
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Calculate height based on row count
  const contentHeight = 160 + rows.length * 52 + 80
  const height = Math.max(SHEET.height, contentHeight)

  return new ImageResponse(
    <NbaDvpSheet rows={rows} date={date.toUpperCase()} logos={logos} />,
    {
      width: SHEET.width,
      height,
      fonts,
    }
  )
}
