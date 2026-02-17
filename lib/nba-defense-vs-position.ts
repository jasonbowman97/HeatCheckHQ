/* ──────────────────────────────────────────────────
   NBA Defense vs Position
   Uses BettingPros pre-computed DVP data for accurate
   5-position rankings (PG/SG/SF/PF/C).
   ESPN scoreboard for today's game schedule.
   NBA.com lineups for starter names + positions.
   ────────────────────────────────────────────────── */

import { fetchNBAScoreboard } from "@/lib/espn/client"
import { scrapeDvpData, BP_DVP_POSITIONS } from "@/lib/bettingpros-scraper"
import type { BPDvpPosition, BPDvpTeamData, BPDvpPositionStats } from "@/lib/bettingpros-scraper"
import { fetchTodayLineups, getStarterAtPosition, fetchRecentPositionMap, getPlayerAtPosition } from "@/lib/nba-lineups"

/* ── Types ── */

export type Position = BPDvpPosition  // "PG" | "SG" | "SF" | "PF" | "C"
export type StatCategory = "PTS" | "REB" | "AST" | "3PM" | "STL" | "BLK"

export interface TodayMatchup {
  eventId: string
  gameTime: string
  awayTeam: { id: string; abbr: string; name: string; logo: string }
  homeTeam: { id: string; abbr: string; name: string; logo: string }
  insights: MatchupInsight[]
}

export interface MatchupInsight {
  teamAbbr: string       // the defending team (ESPN abbreviation)
  statCategory: string   // e.g. "Points"
  position: Position
  rank: number           // 1 = allows the most
  rankLabel: string      // "THE MOST", "2nd most", etc.
  avgAllowed: number
  playerName: string     // starter at this position on the opposing team
}

export interface PositionRankingRow {
  rank: number
  teamAbbr: string
  avgAllowed: number
}

/* ── Constants ── */

export const POSITIONS: Position[] = [...BP_DVP_POSITIONS]

const STAT_CATEGORIES: { key: StatCategory; label: string; bpField: keyof BPDvpPositionStats }[] = [
  { key: "PTS", label: "Points", bpField: "points" },
  { key: "REB", label: "Rebounds", bpField: "rebounds" },
  { key: "AST", label: "Assists", bpField: "assists" },
  { key: "3PM", label: "3-Pointers Made", bpField: "three_points_made" },
  { key: "STL", label: "Steals", bpField: "steals" },
  { key: "BLK", label: "Blocks", bpField: "blocks" },
]

/* ESPN → BettingPros team abbreviation mapping */
const ESPN_TO_BP: Record<string, string> = {
  GS: "GSW", SA: "SAS", NY: "NYK", NO: "NOR",
  WSH: "WAS", PHX: "PHO", UTAH: "UTH",
}

function espnAbbrToBP(espnAbbr: string): string {
  return ESPN_TO_BP[espnAbbr] ?? espnAbbr
}

/* ESPN → NBA.com team abbreviation mapping */
const ESPN_TO_NBA: Record<string, string> = {
  GS: "GSW", SA: "SAS", NY: "NYK", NO: "NOP",
  WSH: "WAS", UTAH: "UTA",
}

function espnAbbrToNBA(espnAbbr: string): string {
  return ESPN_TO_NBA[espnAbbr] ?? espnAbbr
}

/* ── Helpers ── */

function rankLabel(rank: number): string {
  if (rank === 1) return "THE MOST"
  if (rank === 2) return "2nd most"
  if (rank === 3) return "3rd most"
  if (rank === 4) return "4th most"
  if (rank === 5) return "5th most"
  return `${rank}th most`
}

/* ── In-memory cache ── */

let cachedDvp: { data: BPDvpTeamData[]; timestamp: number } | null = null
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000 // 4 hours

async function getDvpData(): Promise<BPDvpTeamData[]> {
  if (cachedDvp && Date.now() - cachedDvp.timestamp < CACHE_DURATION_MS) {
    return cachedDvp.data
  }
  const result = await scrapeDvpData()
  cachedDvp = { data: result.teams, timestamp: Date.now() }
  return result.teams
}

/* ── Rankings ── */

/** Pre-compute rankings for all stat+position combos (1 = allows the most) */
function buildRankingsMap(teams: BPDvpTeamData[]) {
  const map: Record<string, Array<{ teamAbbr: string; value: number }>> = {}

  for (const pos of POSITIONS) {
    for (const cat of STAT_CATEGORIES) {
      const key = `${pos}_${cat.key}`
      const sorted = teams
        .map((t) => ({ teamAbbr: t.teamAbbr, value: t.byPosition[pos]?.[cat.bpField] ?? 0 }))
        .sort((a, b) => b.value - a.value) // most allowed first
      map[key] = sorted
    }
  }

  return map
}

export async function getPositionRankings(
  position: Position,
  stat: StatCategory
): Promise<PositionRankingRow[]> {
  const teams = await getDvpData()
  const bpField = STAT_CATEGORIES.find((c) => c.key === stat)?.bpField ?? "points"

  return teams
    .map((t) => ({
      rank: 0,
      teamAbbr: t.teamAbbr,
      avgAllowed: t.byPosition[position]?.[bpField] ?? 0,
    }))
    .sort((a, b) => b.avgAllowed - a.avgAllowed) // most allowed = rank 1
    .map((row, i) => ({ ...row, rank: i + 1 }))
}

/* ── Today's matchup insights ── */

export async function getTodayMatchupInsights(date?: string): Promise<TodayMatchup[]> {
  try {
    const [teams, scoreboardRaw, lineupGames, positionMap] = await Promise.all([
      getDvpData(),
      fetchNBAScoreboard(date),
      fetchTodayLineups(date),
      fetchRecentPositionMap(),
    ])

    const events = (scoreboardRaw.events ?? []) as Array<Record<string, unknown>>
    if (events.length === 0 || teams.length === 0) return []

    // Build lookup: BettingPros team abbr → team data
    const teamLookup = new Map<string, BPDvpTeamData>()
    for (const t of teams) teamLookup.set(t.teamAbbr, t)

    // Pre-compute rankings
    const rankingsMap = buildRankingsMap(teams)

    function getTeamRank(bpAbbr: string, pos: Position, catKey: StatCategory): { rank: number; avgAllowed: number } {
      const key = `${pos}_${catKey}`
      const list = rankingsMap[key] ?? []
      const idx = list.findIndex((r) => r.teamAbbr === bpAbbr)
      return { rank: idx + 1, avgAllowed: list[idx]?.value ?? 0 }
    }

    /**
     * Find the player at a given position for a team.
     * Priority: today's lineup (most accurate) → recent historical lineup (fallback).
     */
    function findPlayer(espnAbbr: string, pos: Position): string {
      const nbaAbbr = espnAbbrToNBA(espnAbbr)
      // Try today's lineup first
      const todayStarter = getStarterAtPosition(lineupGames, nbaAbbr, pos)
      if (todayStarter) return todayStarter.playerName
      // Fall back to recent position map
      const recentPlayer = getPlayerAtPosition(positionMap, nbaAbbr, pos)
      if (recentPlayer) return recentPlayer.playerName
      return ""
    }

    const matchups: TodayMatchup[] = []

    for (const event of events) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      if (competitions.length === 0) continue

      const comp = competitions[0]
      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>
      if (competitors.length !== 2) continue

      const away = competitors.find((c) => (c.homeAway as string) === "away") as Record<string, unknown>
      const home = competitors.find((c) => (c.homeAway as string) === "home") as Record<string, unknown>
      if (!away || !home) continue

      const awayTeam = away.team as Record<string, unknown>
      const homeTeam = home.team as Record<string, unknown>

      const awayEspnAbbr = awayTeam.abbreviation as string
      const homeEspnAbbr = homeTeam.abbreviation as string
      const awayBP = espnAbbrToBP(awayEspnAbbr)
      const homeBP = espnAbbrToBP(homeEspnAbbr)

      const insights: MatchupInsight[] = []

      for (const pos of POSITIONS) {
        for (const cat of STAT_CATEGORIES) {
          // Away team's defense vs this position → show home team's starter
          const awayRankInfo = getTeamRank(awayBP, pos, cat.key)
          if (awayRankInfo.rank <= 5) {
            insights.push({
              teamAbbr: awayEspnAbbr,
              statCategory: cat.label,
              position: pos,
              rank: awayRankInfo.rank,
              rankLabel: rankLabel(awayRankInfo.rank),
              avgAllowed: awayRankInfo.avgAllowed,
              playerName: findPlayer(homeEspnAbbr, pos),
            })
          }

          // Home team's defense vs this position → show away team's starter
          const homeRankInfo = getTeamRank(homeBP, pos, cat.key)
          if (homeRankInfo.rank <= 5) {
            insights.push({
              teamAbbr: homeEspnAbbr,
              statCategory: cat.label,
              position: pos,
              rank: homeRankInfo.rank,
              rankLabel: rankLabel(homeRankInfo.rank),
              avgAllowed: homeRankInfo.avgAllowed,
              playerName: findPlayer(awayEspnAbbr, pos),
            })
          }
        }
      }

      // Sort: most notable first (lowest rank number = worst defense at that position)
      insights.sort((a, b) => a.rank - b.rank)

      const awayLogos = (awayTeam.logos ?? []) as Array<Record<string, unknown>>
      const homeLogos = (homeTeam.logos ?? []) as Array<Record<string, unknown>>

      matchups.push({
        eventId: event.id as string,
        gameTime: event.date as string,
        awayTeam: {
          id: awayTeam.id as string,
          abbr: awayEspnAbbr,
          name: awayTeam.displayName as string,
          logo: (awayLogos[0]?.href as string) ?? "",
        },
        homeTeam: {
          id: homeTeam.id as string,
          abbr: homeEspnAbbr,
          name: homeTeam.displayName as string,
          logo: (homeLogos[0]?.href as string) ?? "",
        },
        insights,
      })
    }

    return matchups
  } catch (err) {
    console.error("[NBA DvP] Failed to build today's matchup insights:", err)
    return []
  }
}
