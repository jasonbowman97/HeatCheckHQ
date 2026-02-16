import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { getTodayMatchupInsights } from "@/lib/nba-defense-vs-position"
import { getNBAStreakTrends } from "@/lib/nba-streaks"
import { getNBATeams } from "@/lib/nba-api"
import { getSchedule, getSeasonLinescores, computePitcherNrfi, getPitcherSeasonStats } from "@/lib/mlb-api"
import { getTeamLogos } from "@/lib/social/shared/team-logo"
import { NbaDvpSheet } from "@/lib/social/sheets/nba-dvp-sheet"
import { NbaParlaySheet } from "@/lib/social/sheets/nba-parlay-sheet"
import { MlbNrfiSheet } from "@/lib/social/sheets/mlb-nrfi-sheet"
import { MlbStrikeoutSheet } from "@/lib/social/sheets/mlb-strikeout-sheet"
import { DailyRecapSheet } from "@/lib/social/sheets/daily-recap-sheet"
import { SHEET } from "@/lib/social/social-config"
import type { DvpRow, ParlayRow, NrfiRow, StrikeoutRow, RecapSection } from "@/lib/social/card-types"
import type { Trend } from "@/lib/trends-types"
import { readFile } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Load fonts from filesystem (avoids self-fetch loop)
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

/** Format today's date for display */
function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase()
}

/** Build ESPN CDN logo URL from team abbreviation and sport */
function espnLogo(sport: "nba" | "mlb" | "nfl", abbr: string): string {
  // ESPN CDN uses lowercase abbreviations
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${abbr.toLowerCase()}.png`
}

/** JSON response helper for "no data" cases */
function noDataResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 200, headers: { "content-type": "application/json" } }
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params

  try {
    switch (type) {
      case "nba_dvp":
        return await renderNbaDvp()
      case "nba_parlay":
        return await renderNbaParlay()
      case "mlb_nrfi":
        return await renderMlbNrfi()
      case "mlb_strikeout":
        return await renderMlbStrikeout()
      case "daily_recap":
        return await renderDailyRecap()
      default:
        return new Response(`Unknown sheet type: ${type}`, { status: 404 })
    }
  } catch (error) {
    console.error(`[social/sheets/${type}] Error:`, error)
    return new Response(
      JSON.stringify({ error: String(error), stack: (error as Error)?.stack }),
      { status: 500, headers: { "content-type": "application/json" } }
    )
  }
}

/* ── NBA DVP Sheet ── */

async function renderNbaDvp() {
  const [fonts, matchups] = await Promise.all([
    loadFonts(),
    getTodayMatchupInsights(),
  ])

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

  if (rows.length === 0) {
    return noDataResponse("No NBA games scheduled today — no DVP data available")
  }

  const allLogos = rows.flatMap((r) => [r.teamLogo, r.opponentLogo])
  const logos = await getTeamLogos(allLogos)

  const contentHeight = 240 + rows.length * 52 + 80
  const height = Math.max(900, contentHeight)

  return new ImageResponse(
    <NbaDvpSheet rows={rows} date={formatDate()} logos={logos} />,
    { width: SHEET.width, height, fonts }
  )
}

/* ── NBA Parlay Pieces Sheet ── */

async function renderNbaParlay() {
  const [fonts, trends, teams] = await Promise.all([
    loadFonts(),
    getNBAStreakTrends(),
    getNBATeams(),
  ])

  // Build team logo map: abbreviation → logo URL
  const teamLogoMap = new Map<string, string>()
  for (const t of teams) {
    teamLogoMap.set(t.abbreviation, t.logo)
  }

  // Filter to consistency trends with thresholds, playing today, sorted by hit rate
  const consistencyTrends = trends
    .filter((t: Trend) => t.threshold && t.playingToday && t.type === "hot")
    .sort((a: Trend, b: Trend) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0))
    .slice(0, 20)

  if (consistencyTrends.length === 0) {
    return noDataResponse("No NBA parlay data available today — no players with games scheduled")
  }

  const rows: ParlayRow[] = consistencyTrends.map((t: Trend) => ({
    playerName: t.playerName,
    team: t.team,
    teamLogo: teamLogoMap.get(t.team) || espnLogo("nba", t.team),
    prop: `${t.threshold!.stat} O${t.threshold!.line}`,
    line: t.threshold!.line,
    hitRate: t.threshold!.hitRate,
    hitPct: t.threshold!.hitPct,
    recentGames: t.recentGames,
    trend: t.type as "hot" | "cold",
  }))

  const allLogos = rows.map((r) => r.teamLogo)
  const logos = await getTeamLogos(allLogos)

  const contentHeight = 240 + rows.length * 52 + 80
  const height = Math.max(900, contentHeight)

  return new ImageResponse(
    <NbaParlaySheet rows={rows} date={formatDate()} logos={logos} />,
    { width: SHEET.width, height, fonts }
  )
}

/* ── MLB NRFI Sheet ── */

async function renderMlbNrfi() {
  const [fonts, scheduleResult, linescores] = await Promise.all([
    loadFonts(),
    getSchedule(),
    getSeasonLinescores(),
  ])

  const games = scheduleResult.games

  if (games.length === 0) {
    return noDataResponse("No MLB games scheduled today — no NRFI data available")
  }

  const rows: NrfiRow[] = games
    .filter((g) => g.away.probablePitcher && g.home.probablePitcher)
    .map((g) => {
      const awayNrfi = computePitcherNrfi(g.away.probablePitcher!.id, linescores)
      const homeNrfi = computePitcherNrfi(g.home.probablePitcher!.id, linescores)
      const combinedPct =
        awayNrfi.nrfiWins + awayNrfi.nrfiLosses > 0 && homeNrfi.nrfiWins + homeNrfi.nrfiLosses > 0
          ? (awayNrfi.nrfiPct + homeNrfi.nrfiPct) / 2
          : 0

      return {
        awayTeam: g.away.abbreviation,
        awayLogo: espnLogo("mlb", g.away.abbreviation),
        awayPitcher: g.away.probablePitcher!.fullName,
        awayHand: g.away.probablePitcher!.hand || "",
        awayNrfiPct: awayNrfi.nrfiPct,
        awayStreak: awayNrfi.streak,
        homeTeam: g.home.abbreviation,
        homeLogo: espnLogo("mlb", g.home.abbreviation),
        homePitcher: g.home.probablePitcher!.fullName,
        homeHand: g.home.probablePitcher!.hand || "",
        homeNrfiPct: homeNrfi.nrfiPct,
        homeStreak: homeNrfi.streak,
        combinedPct,
        venue: g.venue,
      }
    })
    .sort((a, b) => b.combinedPct - a.combinedPct)
    .slice(0, 15)

  if (rows.length === 0) {
    return noDataResponse("No MLB pitching matchups available today — probable pitchers not yet announced")
  }

  const allLogos = rows.flatMap((r) => [r.awayLogo, r.homeLogo])
  const logos = await getTeamLogos(allLogos)

  const contentHeight = 240 + rows.length * 52 + 120
  const height = Math.max(900, contentHeight)

  return new ImageResponse(
    <MlbNrfiSheet rows={rows} date={formatDate()} logos={logos} />,
    { width: SHEET.width, height, fonts }
  )
}

/* ── MLB Strikeout Sheet ── */

async function renderMlbStrikeout() {
  const [fonts, scheduleResult] = await Promise.all([
    loadFonts(),
    getSchedule(),
  ])

  const games = scheduleResult.games

  if (games.length === 0) {
    return noDataResponse("No MLB games scheduled today — no strikeout data available")
  }

  // Get pitcher stats for all probable pitchers
  const pitcherEntries = games
    .flatMap((g) => {
      const entries = []
      if (g.away.probablePitcher) {
        entries.push({
          pitcher: g.away.probablePitcher,
          team: g.away.abbreviation,
          opponent: g.home.abbreviation,
        })
      }
      if (g.home.probablePitcher) {
        entries.push({
          pitcher: g.home.probablePitcher,
          team: g.home.abbreviation,
          opponent: g.away.abbreviation,
        })
      }
      return entries
    })

  if (pitcherEntries.length === 0) {
    return noDataResponse("No probable pitchers announced today — strikeout data unavailable")
  }

  // Fetch season stats in parallel
  const statsResults = await Promise.allSettled(
    pitcherEntries.map(async (entry) => {
      const stats = await getPitcherSeasonStats(entry.pitcher.id)
      return { ...entry, stats }
    })
  )

  const rows: StrikeoutRow[] = statsResults
    .filter((r): r is PromiseFulfilledResult<{
      pitcher: { id: number; fullName: string; hand?: "L" | "R" }
      team: string
      opponent: string
      stats: Awaited<ReturnType<typeof getPitcherSeasonStats>>
    }> => r.status === "fulfilled" && r.value.stats !== null)
    .map((r) => {
      const { pitcher, team, opponent, stats } = r.value
      const kPerGame = stats!.gamesStarted > 0 ? stats!.strikeOuts / stats!.gamesStarted : 0
      // Estimate K line as kPerGame rounded to nearest 0.5
      const kLine = Math.round(kPerGame * 2) / 2
      return {
        pitcher: pitcher.fullName,
        team,
        teamLogo: espnLogo("mlb", team),
        opponent,
        opponentLogo: espnLogo("mlb", opponent),
        kLine,
        kPerGame,
        oppKPct: 0, // Would need team batting K% data — show as N/A for now
        l3Avg: kPerGame, // Approximate with season avg for now
        trend: kPerGame > kLine ? "over" as const : kPerGame < kLine ? "under" as const : "push" as const,
      }
    })
    .sort((a, b) => b.kPerGame - a.kPerGame)
    .slice(0, 15)

  if (rows.length === 0) {
    return noDataResponse("No pitcher stats available today")
  }

  const allLogos = rows.flatMap((r) => [r.teamLogo, r.opponentLogo])
  const logos = await getTeamLogos(allLogos)

  const contentHeight = 240 + rows.length * 52 + 80
  const height = Math.max(900, contentHeight)

  return new ImageResponse(
    <MlbStrikeoutSheet rows={rows} date={formatDate()} logos={logos} />,
    { width: SHEET.width, height, fonts }
  )
}

/* ── Daily Recap Sheet ── */

async function renderDailyRecap() {
  const [fonts, dvpMatchups, trends] = await Promise.all([
    loadFonts(),
    getTodayMatchupInsights().catch(() => []),
    getNBAStreakTrends().catch(() => []),
  ])

  const sections: RecapSection[] = []

  // Section 1: Best DVP mismatch
  if (dvpMatchups.length > 0) {
    const topInsight = dvpMatchups
      .flatMap((m) =>
        m.insights.map((ins) => ({
          ...ins,
          logo: m.awayTeam.abbr === ins.teamAbbr ? m.awayTeam.logo : m.homeTeam.logo,
        }))
      )
      .sort((a, b) => a.rank - b.rank)[0]

    if (topInsight) {
      sections.push({
        title: "DVP MISMATCH",
        icon: "🏀",
        playerName: topInsight.playerName || topInsight.teamAbbr,
        teamLogo: topInsight.logo,
        stat: `#${topInsight.rank} vs ${topInsight.position}`,
        detail: `${topInsight.teamAbbr} allows ${topInsight.avgAllowed.toFixed(1)} ${topInsight.statCategory} to ${topInsight.position}s — ${topInsight.rankLabel}`,
      })
    }
  }

  // Section 2: Hottest streak
  const hotStreaks = trends
    .filter((t: Trend) => t.type === "hot" && t.playingToday)
    .sort((a: Trend, b: Trend) => b.streakLength - a.streakLength)

  if (hotStreaks.length > 0) {
    const top = hotStreaks[0]
    const teamLogo = espnLogo("nba", top.team)
    sections.push({
      title: "HOTTEST STREAK",
      icon: "🔥",
      playerName: top.playerName,
      teamLogo,
      stat: top.statValue,
      detail: top.headline,
    })
  }

  // Section 3: Best parlay piece (consistency)
  const parlayPicks = trends
    .filter((t: Trend) => t.threshold && t.playingToday && t.type === "hot")
    .sort((a: Trend, b: Trend) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0))

  if (parlayPicks.length > 0) {
    const top = parlayPicks[0]
    const teamLogo = espnLogo("nba", top.team)
    sections.push({
      title: "PARLAY PIECE",
      icon: "💰",
      playerName: top.playerName,
      teamLogo,
      stat: `${top.threshold!.hitRate} (${(top.threshold!.hitPct * 100).toFixed(0)}%)`,
      detail: `${top.threshold!.stat} O${top.threshold!.line} — ${top.headline}`,
    })
  }

  // Section 4: Coldest player (fade pick)
  const coldStreaks = trends
    .filter((t: Trend) => t.type === "cold" && t.playingToday)
    .sort((a: Trend, b: Trend) => b.streakLength - a.streakLength)

  if (coldStreaks.length > 0) {
    const top = coldStreaks[0]
    const teamLogo = espnLogo("nba", top.team)
    sections.push({
      title: "FADE ALERT",
      icon: "🧊",
      playerName: top.playerName,
      teamLogo,
      stat: top.statValue,
      detail: top.headline,
    })
  }

  if (sections.length === 0) {
    return noDataResponse("No data available today for recap")
  }

  // Collect all logos
  const allLogos = sections.map((s) => s.teamLogo)
  const logos = await getTeamLogos(allLogos)

  return new ImageResponse(
    <DailyRecapSheet sections={sections} date={formatDate()} logos={logos} />,
    { width: SHEET.compactWidth, height: SHEET.compactWidth, fonts }
  )
}
