import { NextResponse } from "next/server"
import { getNBAScoreboard, getNBATeamSummary, getNBATeamSchedule } from "@/lib/nba-api"
import type { NBAGameResult } from "@/lib/nba-api"
import { scrapeDvpData } from "@/lib/bettingpros-scraper"

export const dynamic = "force-dynamic"

/** Build H2H history between two teams from their schedule data */
function buildH2H(
  awaySchedule: NBAGameResult[],
  awayTeamId: string,
  homeTeamId: string,
) {
  // Find games where away team played against home team (from away team's perspective)
  const meetings = awaySchedule
    .filter((g) => g.opponentId === homeTeamId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  if (meetings.length === 0) return null

  let awayWins = 0
  let awayTotalPts = 0
  let homeTotalPts = 0

  const recentMeetings = meetings.map((m) => {
    if (m.won) awayWins++
    awayTotalPts += m.teamScore
    homeTotalPts += m.opponentScore
    return {
      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      awayScore: m.home ? m.opponentScore : m.teamScore,
      homeScore: m.home ? m.teamScore : m.opponentScore,
      total: m.teamScore + m.opponentScore,
      winner: m.won ? awayTeamId : homeTeamId,
    }
  })

  const homeWins = meetings.length - awayWins
  const awayAvgPts = Math.round((awayTotalPts / meetings.length) * 10) / 10
  const homeAvgPts = Math.round((homeTotalPts / meetings.length) * 10) / 10

  return {
    record: `${awayWins}-${homeWins}`,
    awayAvgPts,
    homeAvgPts,
    avgTotal: Math.round(((awayTotalPts + homeTotalPts) / meetings.length) * 10) / 10,
    margin: awayAvgPts > homeAvgPts
      ? `Away +${(awayAvgPts - homeAvgPts).toFixed(1)}`
      : homeAvgPts > awayAvgPts
        ? `Home +${(homeAvgPts - awayAvgPts).toFixed(1)}`
        : "Even",
    recentMeetings,
  }
}

/** Calculate last N games record from schedule */
function lastNRecord(schedule: NBAGameResult[], n: number): { wins: number; losses: number } {
  const recent = schedule.slice(-n)
  const wins = recent.filter((g) => g.won).length
  return { wins, losses: recent.length - wins }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") ?? undefined
    const games = await getNBAScoreboard(date)

    // Collect unique team IDs
    const teamIds = new Set<string>()
    for (const g of games) {
      teamIds.add(g.awayTeam.id)
      teamIds.add(g.homeTeam.id)
    }

    // Fetch team summaries + schedules + DVP in parallel
    const [summaryEntries, scheduleEntries, dvpData] = await Promise.all([
      Promise.all(
        Array.from(teamIds).map(async (id) => {
          const summary = await getNBATeamSummary(id)
          return [id, summary] as const
        })
      ),
      Promise.all(
        Array.from(teamIds).map(async (id) => {
          const schedule = await getNBATeamSchedule(id)
          return [id, schedule] as const
        })
      ),
      scrapeDvpData().catch(() => null),
    ])

    const summaries = Object.fromEntries(summaryEntries.filter(([, v]) => v !== null))
    const schedules: Record<string, NBAGameResult[]> = Object.fromEntries(scheduleEntries)

    // Build H2H data and last-N records for each matchup
    const h2hData: Record<string, ReturnType<typeof buildH2H>> = {}
    const lastRecords: Record<string, { last5: { wins: number; losses: number }; last10: { wins: number; losses: number } }> = {}

    for (const g of games) {
      const awaySchedule = schedules[g.awayTeam.id] ?? []
      const homeSchedule = schedules[g.homeTeam.id] ?? []

      h2hData[g.id] = buildH2H(awaySchedule, g.awayTeam.id, g.homeTeam.id)

      lastRecords[g.awayTeam.id] ??= {
        last5: lastNRecord(awaySchedule, 5),
        last10: lastNRecord(awaySchedule, 10),
      }
      lastRecords[g.homeTeam.id] ??= {
        last5: lastNRecord(homeSchedule, 5),
        last10: lastNRecord(homeSchedule, 10),
      }
    }

    // Build DVP rankings lookup (BettingPros team abbreviations -> rankings per position)
    const dvpRankings: Record<string, { pg: number; sg: number; sf: number; pf: number; c: number }> = dvpData?.rankings ?? {}

    return NextResponse.json({ games, summaries, h2hData, lastRecords, dvpRankings })
  } catch (e) {
    console.error("[NBA H2H API]", e)
    return NextResponse.json({ games: [], summaries: {}, h2hData: {}, lastRecords: {}, dvpRankings: {} })
  }
}
