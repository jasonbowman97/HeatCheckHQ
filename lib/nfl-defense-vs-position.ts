/**
 * NFL Defense vs Position
 * Uses ESPN Team Statistics API to get opponent (defensive) stats allowed.
 * ESPN /teams/{id}/statistics → results.opponent has per-game values + 1-32 ranks.
 * NFL doesn't split by position, so we map categories:
 *   QB → passing allowed, RB → rushing allowed, WR/TE → receiving allowed.
 */

import { getNFLScoreboard } from "@/lib/nfl-api"

/* ── Types ── */

export type NFLDvpPosition = "QB" | "RB" | "WR" | "TE"
export type NFLDvpStat =
  | "PASS_YDS" | "PASS_TD" | "INT" | "SACKS" | "QBR"
  | "RUSH_YDS" | "RUSH_TD" | "YPC"
  | "REC_YDS" | "REC_TD" | "REC" | "YPR"

export interface NFLDvpTeamData {
  teamId: string
  abbreviation: string
  displayName: string
  logo: string
  stats: Map<string, { value: number; rank: number }>
}

export interface NFLDvpRankingRow {
  rank: number
  teamAbbr: string
  teamName: string
  logo: string
  value: number
  espnRank: number // ESPN's own 1-32 rank
}

export interface NFLDvpMatchup {
  gameId: string
  week: string
  awayTeam: { abbr: string; name: string; logo: string }
  homeTeam: { abbr: string; name: string; logo: string }
  insights: NFLDvpInsight[]
}

export interface NFLDvpInsight {
  defenseAbbr: string     // team whose defense is weak
  offenseAbbr: string     // team that benefits
  position: NFLDvpPosition
  stat: NFLDvpStat
  statLabel: string
  rank: number            // 1 = allows the most (worst defense)
  rankLabel: string
  value: number
  unit: string
}

/* ── Stat definitions ── */

interface StatDef {
  key: NFLDvpStat
  label: string
  espnName: string
  unit: string
  inverted?: boolean // true = lower is worse for offense (SACKS, INT)
}

const QB_STATS: StatDef[] = [
  { key: "PASS_YDS", label: "Pass Yards", espnName: "netPassingYardsPerGame", unit: "YDS/G" },
  { key: "PASS_TD", label: "Pass TDs", espnName: "passingTouchdowns", unit: "TD" },
  { key: "QBR", label: "QB Rating", espnName: "QBRating", unit: "QBR" },
  { key: "SACKS", label: "Sacks", espnName: "sacks", unit: "SACKS", inverted: true },
  { key: "INT", label: "Interceptions", espnName: "interceptions", unit: "INT", inverted: true },
]

const RB_STATS: StatDef[] = [
  { key: "RUSH_YDS", label: "Rush Yards", espnName: "rushingYardsPerGame", unit: "YDS/G" },
  { key: "RUSH_TD", label: "Rush TDs", espnName: "rushingTouchdowns", unit: "TD" },
  { key: "YPC", label: "Yards/Carry", espnName: "yardsPerRushAttempt", unit: "YPC" },
]

const WR_STATS: StatDef[] = [
  { key: "REC_YDS", label: "Rec Yards", espnName: "receivingYardsPerGame", unit: "YDS/G" },
  { key: "REC_TD", label: "Rec TDs", espnName: "receivingTouchdowns", unit: "TD" },
  { key: "REC", label: "Receptions", espnName: "receptions", unit: "REC" },
  { key: "YPR", label: "Yards/Rec", espnName: "yardsPerReception", unit: "YPR" },
]

export const POSITION_STATS: Record<NFLDvpPosition, StatDef[]> = {
  QB: QB_STATS,
  RB: RB_STATS,
  WR: WR_STATS,
  TE: WR_STATS, // TE shares receiving stats
}

export const POSITIONS: NFLDvpPosition[] = ["QB", "RB", "WR", "TE"]

export function getStatDef(stat: NFLDvpStat): StatDef | undefined {
  for (const defs of Object.values(POSITION_STATS)) {
    const found = defs.find((d) => d.key === stat)
    if (found) return found
  }
  return undefined
}

/* ── Rank label helper ── */

function rankLabel(rank: number, inverted?: boolean): string {
  const verb = inverted ? "FEWEST" : "MOST"
  if (rank === 1) return `THE ${verb}`
  const suffix = rank === 2 ? "nd" : rank === 3 ? "rd" : "th"
  return `${rank}${suffix} ${verb.toLowerCase()}`
}

/* ── NFL Team IDs: 1-30, 33 (BAL), 34 (HOU) ── */

const NFL_TEAM_IDS = [
  ...Array.from({ length: 30 }, (_, i) => String(i + 1)),
  "33", "34",
]

/* ── ESPN API fetching ── */

interface ESPNStatValue {
  name: string
  displayName: string
  value: number
  perGameValue?: number
  rank?: number
}

interface ESPNStatCategory {
  name: string
  displayName: string
  stats: ESPNStatValue[]
}

async function fetchTeamOpponentStats(teamId: string): Promise<NFLDvpTeamData | null> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/statistics`,
      { next: { revalidate: 43200 } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const team = data.team ?? {}
    const results = data.results ?? {}
    const opponentCategories = (results.opponent ?? []) as ESPNStatCategory[]

    // Build a flat map of stat name → { value, rank }
    const statsMap = new Map<string, { value: number; rank: number }>()

    for (const cat of opponentCategories) {
      for (const stat of cat.stats ?? []) {
        // Prefer perGameValue for per-game stats, fall back to value
        const val = stat.perGameValue ?? stat.value ?? 0
        statsMap.set(stat.name, {
          value: Math.round(val * 10) / 10,
          rank: stat.rank ?? 0,
        })
      }
    }

    return {
      teamId,
      abbreviation: team.abbreviation ?? "",
      displayName: team.displayName ?? "",
      logo: typeof team.logo === "string" ? team.logo : (team.logos?.[0]?.href ?? ""),
      stats: statsMap,
    }
  } catch {
    return null
  }
}

/* ── In-memory cache ── */

let _dvpCache: { data: NFLDvpTeamData[]; ts: number } | null = null
const DVP_CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export async function getAllTeamDvpData(): Promise<NFLDvpTeamData[]> {
  if (_dvpCache && Date.now() - _dvpCache.ts < DVP_CACHE_TTL) return _dvpCache.data

  const results = await Promise.all(NFL_TEAM_IDS.map(fetchTeamOpponentStats))
  const teams = results.filter(Boolean) as NFLDvpTeamData[]

  _dvpCache = { data: teams, ts: Date.now() }
  console.log(`[NFL DVP] Fetched opponent stats for ${teams.length} teams`)
  return teams
}

/* ── Rankings ── */

export async function getNFLDvpRankings(
  position: NFLDvpPosition,
  stat: NFLDvpStat
): Promise<NFLDvpRankingRow[]> {
  const teams = await getAllTeamDvpData()
  const statDef = POSITION_STATS[position]?.find((d) => d.key === stat)
  if (!statDef) return []

  const rows = teams
    .map((t) => {
      const s = t.stats.get(statDef.espnName)
      return {
        rank: 0,
        teamAbbr: t.abbreviation,
        teamName: t.displayName,
        logo: t.logo,
        value: s?.value ?? 0,
        espnRank: s?.rank ?? 0,
      }
    })
    .sort((a, b) => {
      // Inverted stats (SACKS, INT): fewer allowed = better matchup for offense → sort ascending
      // Normal stats: more allowed = better matchup for offense → sort descending
      return statDef.inverted ? a.value - b.value : b.value - a.value
    })
    .map((row, i) => ({ ...row, rank: i + 1 }))

  return rows
}

/* ── This Week's Matchup Insights ── */

export async function getNFLDvpWeekMatchups(): Promise<NFLDvpMatchup[]> {
  try {
    const [teams, games] = await Promise.all([
      getAllTeamDvpData(),
      getNFLScoreboard(),
    ])

    if (!games.length || !teams.length) return []

    // Build lookup: abbreviation → team data
    const teamLookup = new Map<string, NFLDvpTeamData>()
    for (const t of teams) teamLookup.set(t.abbreviation, t)

    // Pre-compute all rankings for quick rank lookups
    const allRankings = new Map<string, NFLDvpRankingRow[]>()
    for (const pos of POSITIONS) {
      const statDefs = POSITION_STATS[pos]
      for (const sd of statDefs) {
        const key = `${pos}_${sd.key}`
        const rows = teams
          .map((t) => {
            const s = t.stats.get(sd.espnName)
            return {
              rank: 0,
              teamAbbr: t.abbreviation,
              teamName: t.displayName,
              logo: t.logo,
              value: s?.value ?? 0,
              espnRank: s?.rank ?? 0,
            }
          })
          .sort((a, b) => sd.inverted ? a.value - b.value : b.value - a.value)
          .map((r, i) => ({ ...r, rank: i + 1 }))
        allRankings.set(key, rows)
      }
    }

    function getTeamRank(abbr: string, pos: NFLDvpPosition, statKey: NFLDvpStat): { rank: number; value: number } | null {
      const key = `${pos}_${statKey}`
      const rows = allRankings.get(key)
      if (!rows) return null
      const row = rows.find((r) => r.teamAbbr === abbr)
      if (!row) return null
      return { rank: row.rank, value: row.value }
    }

    const matchups: NFLDvpMatchup[] = []

    for (const game of games) {
      const insights: NFLDvpInsight[] = []

      for (const pos of POSITIONS) {
        const statDefs = POSITION_STATS[pos]
        for (const sd of statDefs) {
          // Away team's defense → benefits home team's offense
          const awayRank = getTeamRank(game.awayTeam.abbreviation, pos, sd.key)
          if (awayRank && awayRank.rank <= 5) {
            insights.push({
              defenseAbbr: game.awayTeam.abbreviation,
              offenseAbbr: game.homeTeam.abbreviation,
              position: pos,
              stat: sd.key,
              statLabel: sd.label,
              rank: awayRank.rank,
              rankLabel: rankLabel(awayRank.rank, sd.inverted),
              value: awayRank.value,
              unit: sd.unit,
            })
          }

          // Home team's defense → benefits away team's offense
          const homeRank = getTeamRank(game.homeTeam.abbreviation, pos, sd.key)
          if (homeRank && homeRank.rank <= 5) {
            insights.push({
              defenseAbbr: game.homeTeam.abbreviation,
              offenseAbbr: game.awayTeam.abbreviation,
              position: pos,
              stat: sd.key,
              statLabel: sd.label,
              rank: homeRank.rank,
              rankLabel: rankLabel(homeRank.rank, sd.inverted),
              value: homeRank.value,
              unit: sd.unit,
            })
          }
        }
      }

      // Sort: most notable first
      insights.sort((a, b) => a.rank - b.rank)

      matchups.push({
        gameId: game.id,
        week: game.week,
        awayTeam: {
          abbr: game.awayTeam.abbreviation,
          name: game.awayTeam.displayName,
          logo: game.awayTeam.logo,
        },
        homeTeam: {
          abbr: game.homeTeam.abbreviation,
          name: game.homeTeam.displayName,
          logo: game.homeTeam.logo,
        },
        insights,
      })
    }

    return matchups
  } catch (err) {
    console.error("[NFL DVP] Failed to build matchup insights:", err)
    return []
  }
}
