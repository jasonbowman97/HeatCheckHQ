/* ──────────────────────────────────────────────────
   NBA Defense vs Position
   Computes how many points/rebounds/assists each NBA
   team allows to each position (Guard, Forward, Center)
   by scanning box scores from completed games.

   ESPN box scores only use G/F/C labels, so we use a
   3-position model that matches the actual data.
   ────────────────────────────────────────────────── */

import {
  fetchNBAScoreboard,
  fetchNBATeams,
  fetchNBAGameSummary,
  fetchNBATeamRoster,
} from "@/lib/espn/client"

/* ── Types ── */

export type Position = "G" | "F" | "C"
export type StatCategory = "PTS" | "REB" | "AST" | "STL" | "BLK" | "3PM"

export interface PositionStatLine {
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  threepm: number
  gamesCount: number
}

export interface TeamDefenseByPosition {
  teamId: string
  teamAbbr: string
  teamName: string
  /** stats allowed per position, averaged per game */
  byPosition: Record<Position, PositionStatLine>
}

export interface TodayMatchup {
  eventId: string
  gameTime: string
  awayTeam: { id: string; abbr: string; name: string; logo: string }
  homeTeam: { id: string; abbr: string; name: string; logo: string }
  insights: MatchupInsight[]
}

export interface MatchupInsight {
  teamAbbr: string       // the defending team
  statCategory: string   // e.g. "Points"
  position: Position
  rank: number           // 1 = allows the most
  rankLabel: string      // "THE MOST", "2nd most", etc.
  playerName: string     // opposing player at that position
  playerPosition: Position
  timeframe: "Season" | "Last 14"
  avgAllowed: number
}

export interface RosterPlayer {
  id: string
  name: string
  position: Position
  headshot?: string
}

/* ── Constants ── */
const POSITIONS: Position[] = ["G", "F", "C"]

const STAT_CATEGORIES: { key: StatCategory; label: string; field: string }[] = [
  { key: "PTS", label: "Points", field: "pts" },
  { key: "REB", label: "Rebounds", field: "reb" },
  { key: "AST", label: "Assists", field: "ast" },
  { key: "3PM", label: "3-Pointers Made", field: "threepm" },
]

/* ── Helpers ── */

function normalizePosition(pos: string): Position | null {
  const p = pos?.toUpperCase()
  if (p === "PG" || p === "SG" || p === "G") return "G"
  if (p === "SF" || p === "PF" || p === "F") return "F"
  if (p === "C") return "C"
  return null
}

function rankLabel(rank: number): string {
  if (rank === 1) return "THE MOST"
  if (rank === 2) return "2nd most"
  if (rank === 3) return "3rd most"
  if (rank === 4) return "4th most"
  if (rank === 5) return "5th most"
  return `${rank}th most`
}

/* ── Parse box score to extract per-position stats ── */

interface BoxScorePlayerStat {
  playerName: string
  position: Position
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  threepm: number
  teamId: string
}

function parseBoxScorePlayers(summary: Record<string, unknown>): {
  teams: Array<{ teamId: string; abbr: string }>
  players: BoxScorePlayerStat[]
} {
  const boxscore = summary.boxscore as Record<string, unknown> | undefined
  if (!boxscore) return { teams: [], players: [] }

  const teamsData = (boxscore.teams ?? []) as Array<Record<string, unknown>>
  const teams = teamsData.map((t) => {
    const team = t.team as Record<string, unknown>
    return {
      teamId: team.id as string,
      abbr: team.abbreviation as string,
    }
  })

  const playersData = (boxscore.players ?? []) as Array<Record<string, unknown>>
  const players: BoxScorePlayerStat[] = []

  for (const teamBlock of playersData) {
    const teamInfo = teamBlock.team as Record<string, unknown>
    const teamId = teamInfo.id as string
    const statistics = (teamBlock.statistics ?? []) as Array<Record<string, unknown>>

    for (const statGroup of statistics) {
      const labels = (statGroup.labels ?? []) as string[]
      const athletes = (statGroup.athletes ?? []) as Array<Record<string, unknown>>

      // Find column indices
      const minIdx = labels.indexOf("MIN")
      const ptsIdx = labels.indexOf("PTS")
      const rebIdx = labels.indexOf("REB")
      const astIdx = labels.indexOf("AST")
      const stlIdx = labels.indexOf("STL")
      const blkIdx = labels.indexOf("BLK")
      // ESPN uses "3PT" with "made-attempted" format (e.g., "5-14")
      const threePtIdx = labels.indexOf("3PT")

      if (ptsIdx === -1) continue

      for (const athlete of athletes) {
        const athleteInfo = athlete.athlete as Record<string, unknown>
        const pos = (athleteInfo.position as Record<string, unknown>)?.abbreviation as string
        const normalizedPos = normalizePosition(pos)
        if (!normalizedPos) continue

        const stats = (athlete.stats ?? []) as string[]
        // Skip players who didn't play (0 or no minutes)
        if (minIdx >= 0 && (stats[minIdx] === "0" || stats[minIdx] === "--" || !stats[minIdx])) continue

        const pts = ptsIdx >= 0 ? parseFloat(stats[ptsIdx]) || 0 : 0
        const reb = rebIdx >= 0 ? parseFloat(stats[rebIdx]) || 0 : 0
        const ast = astIdx >= 0 ? parseFloat(stats[astIdx]) || 0 : 0
        const stl = stlIdx >= 0 ? parseFloat(stats[stlIdx]) || 0 : 0
        const blk = blkIdx >= 0 ? parseFloat(stats[blkIdx]) || 0 : 0
        // "3PT" is "made-attempted" (e.g., "5-14") — parse just the made portion
        let threepm = 0
        if (threePtIdx >= 0 && stats[threePtIdx]) {
          const parts = stats[threePtIdx].split("-")
          threepm = parseInt(parts[0], 10) || 0
        }

        players.push({
          playerName: athleteInfo.displayName as string,
          position: normalizedPos,
          pts, reb, ast, stl, blk, threepm,
          teamId,
        })
      }
    }
  }

  return { teams, players }
}

/* ── Build league-wide defense vs position rankings ── */

// In-memory cache
let cachedRankings: {
  data: TeamDefenseByPosition[]
  timestamp: number
} | null = null

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000 // 4 hours

export async function getLeagueDefenseVsPosition(): Promise<TeamDefenseByPosition[]> {
  // Return cache if fresh
  if (cachedRankings && Date.now() - cachedRankings.timestamp < CACHE_DURATION_MS) {
    return cachedRankings.data
  }

  try {
    // 1. Get all NBA teams
    const teamsRaw = await fetchNBATeams()
    const sports = (teamsRaw as Record<string, unknown[]>).sports ?? []
    const allTeams: { id: string; abbr: string; name: string }[] = []

    for (const sport of sports as Array<Record<string, unknown>>) {
      const leagues = (sport.leagues ?? []) as Array<Record<string, unknown>>
      for (const league of leagues) {
        const teams = (league.teams ?? []) as Array<Record<string, unknown>>
        for (const teamEntry of teams) {
          const team = teamEntry.team as Record<string, unknown>
          allTeams.push({
            id: team.id as string,
            abbr: (team.abbreviation as string) ?? "",
            name: (team.displayName as string) ?? "",
          })
        }
      }
    }

    // 2. Fetch recent scoreboard dates to get completed game IDs
    //    We'll sample games from the last ~14 days
    const gameIds = new Set<string>()
    const now = new Date()

    const datePromises: Promise<Record<string, unknown>>[] = []
    for (let daysBack = 1; daysBack <= 14; daysBack++) {
      const d = new Date(now)
      d.setDate(d.getDate() - daysBack)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      datePromises.push(fetchNBAScoreboard(`${yyyy}${mm}${dd}`))
    }

    const scoreboards = await Promise.all(datePromises)

    for (const sb of scoreboards) {
      const events = (sb.events ?? []) as Array<Record<string, unknown>>
      for (const event of events) {
        const status = event.status as Record<string, unknown>
        const statusType = status?.type as Record<string, unknown>
        if (statusType?.completed) {
          gameIds.add(event.id as string)
        }
      }
    }

    // 3. Fetch box scores in batches (limit to most recent ~80 games for speed)
    const gameIdArray = Array.from(gameIds).slice(0, 80)

    // Initialize accumulator: for each team, track stats allowed TO each position
    const teamAccum: Record<string, {
      teamId: string
      teamAbbr: string
      teamName: string
      byPosition: Record<Position, { pts: number; reb: number; ast: number; stl: number; blk: number; threepm: number; games: Set<string> }>
    }> = {}

    for (const team of allTeams) {
      teamAccum[team.id] = {
        teamId: team.id,
        teamAbbr: team.abbr,
        teamName: team.name,
        byPosition: {} as Record<Position, { pts: number; reb: number; ast: number; stl: number; blk: number; threepm: number; games: Set<string> }>,
      }
      for (const pos of POSITIONS) {
        teamAccum[team.id].byPosition[pos] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, threepm: 0, games: new Set() }
      }
    }

    // Batch fetch box scores (10 at a time)
    const BATCH_SIZE = 10
    for (let i = 0; i < gameIdArray.length; i += BATCH_SIZE) {
      const batch = gameIdArray.slice(i, i + BATCH_SIZE)
      const summaries = await Promise.all(
        batch.map((id) => fetchNBAGameSummary(id).catch(() => null))
      )

      for (let j = 0; j < summaries.length; j++) {
        const summary = summaries[j]
        if (!summary) continue

        const { teams, players } = parseBoxScorePlayers(summary)
        if (teams.length !== 2) continue

        const gameId = batch[j]

        // For each player, the OPPOSING team "allowed" these stats to this position
        for (const player of players) {
          const opposingTeam = teams.find((t) => t.teamId !== player.teamId)
          if (!opposingTeam || !teamAccum[opposingTeam.teamId]) continue

          const accum = teamAccum[opposingTeam.teamId].byPosition[player.position]
          if (!accum) continue

          accum.pts += player.pts
          accum.reb += player.reb
          accum.ast += player.ast
          accum.stl += player.stl
          accum.blk += player.blk
          accum.threepm += player.threepm
          accum.games.add(gameId)
        }
      }
    }

    // 4. Average out the stats per game
    const results: TeamDefenseByPosition[] = allTeams.map((team) => {
      const accum = teamAccum[team.id]
      const byPosition = {} as Record<Position, PositionStatLine>

      for (const pos of POSITIONS) {
        const p = accum.byPosition[pos]
        const gamesCount = p.games.size || 1
        byPosition[pos] = {
          pts: Math.round((p.pts / gamesCount) * 10) / 10,
          reb: Math.round((p.reb / gamesCount) * 10) / 10,
          ast: Math.round((p.ast / gamesCount) * 10) / 10,
          stl: Math.round((p.stl / gamesCount) * 10) / 10,
          blk: Math.round((p.blk / gamesCount) * 10) / 10,
          threepm: Math.round((p.threepm / gamesCount) * 10) / 10,
          gamesCount,
        }
      }

      return {
        teamId: team.id,
        teamAbbr: team.abbr,
        teamName: team.name,
        byPosition,
      }
    })

    cachedRankings = { data: results, timestamp: Date.now() }
    return results

  } catch (err) {
    console.error("[NBA DvP] Failed to compute defense vs position:", err)
    return cachedRankings?.data ?? []
  }
}

/* ── Get team roster (for mapping today's players) ── */

export async function getTeamRoster(teamId: string): Promise<RosterPlayer[]> {
  try {
    const raw = await fetchNBATeamRoster(teamId)
    // ESPN NBA roster returns athletes as a FLAT array (not nested group.items)
    const athletes = (raw.athletes ?? []) as Array<Record<string, unknown>>
    const players: RosterPlayer[] = []

    for (const athlete of athletes) {
      // Flat array: each element IS the player directly
      const pos = (athlete.position as Record<string, unknown>)?.abbreviation as string ?? ""
      const normalizedPos = normalizePosition(pos)
      if (!normalizedPos) continue

      players.push({
        id: athlete.id as string,
        name: (athlete.displayName as string) ?? (athlete.fullName as string) ?? "",
        position: normalizedPos,
        headshot: (athlete.headshot as Record<string, unknown>)?.href as string | undefined,
      })
    }
    return players
  } catch {
    return []
  }
}

/* ── Build today's matchup insights ── */

export async function getTodayMatchupInsights(): Promise<TodayMatchup[]> {
  try {
    // Fetch rankings and today's scoreboard in parallel
    const [rankings, scoreboardRaw] = await Promise.all([
      getLeagueDefenseVsPosition(),
      fetchNBAScoreboard(),
    ])

    const events = (scoreboardRaw.events ?? []) as Array<Record<string, unknown>>
    if (events.length === 0 || rankings.length === 0) {
      return []
    }

    // Rank teams for each stat+position combo (1 = allows most)
    type RankEntry = { teamId: string; teamAbbr: string; avgAllowed: number }
    const rankingsMap: Record<string, RankEntry[]> = {}

    for (const pos of POSITIONS) {
      for (const cat of STAT_CATEGORIES) {
        const key = `${pos}_${cat.key}`
        const sorted = [...rankings]
          .map((r) => ({
            teamId: r.teamId,
            teamAbbr: r.teamAbbr,
            avgAllowed: r.byPosition[pos]?.[cat.field as keyof PositionStatLine] as number ?? 0,
          }))
          .sort((a, b) => b.avgAllowed - a.avgAllowed) // most allowed first
        rankingsMap[key] = sorted
      }
    }

    function getTeamRank(teamId: string, pos: Position, cat: StatCategory): { rank: number; avgAllowed: number } {
      const key = `${pos}_${cat}`
      const list = rankingsMap[key] ?? []
      const idx = list.findIndex((r) => r.teamId === teamId)
      return { rank: idx + 1, avgAllowed: list[idx]?.avgAllowed ?? 0 }
    }

    // Process each game
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

      const awayId = awayTeam.id as string
      const homeId = homeTeam.id as string

      // Fetch rosters for both teams
      const [awayRoster, homeRoster] = await Promise.all([
        getTeamRoster(awayId),
        getTeamRoster(homeId),
      ])

      const insights: MatchupInsight[] = []

      // Pick the most prominent player at each position (ESPN lists starters first in roster)
      // We cache per-position so we show the same key player across all stat categories
      const homePrimary: Record<Position, RosterPlayer | undefined> = { G: undefined, F: undefined, C: undefined }
      const awayPrimary: Record<Position, RosterPlayer | undefined> = { G: undefined, F: undefined, C: undefined }
      for (const pos of POSITIONS) {
        homePrimary[pos] = homeRoster.find((p) => p.position === pos)
        awayPrimary[pos] = awayRoster.find((p) => p.position === pos)
      }

      // For each team, check what they allow and find opposing player
      for (const pos of POSITIONS) {
        for (const cat of STAT_CATEGORIES) {
          // Away team's defense vs this position -> find home player at this position
          const awayRankInfo = getTeamRank(awayId, pos, cat.key)
          if (awayRankInfo.rank <= 5) {
            const homePlayer = homePrimary[pos]
            if (homePlayer) {
              insights.push({
                teamAbbr: awayTeam.abbreviation as string,
                statCategory: cat.label,
                position: pos,
                rank: awayRankInfo.rank,
                rankLabel: rankLabel(awayRankInfo.rank),
                playerName: homePlayer.name,
                playerPosition: homePlayer.position,
                timeframe: "Last 14",
                avgAllowed: awayRankInfo.avgAllowed,
              })
            }
          }

          // Home team's defense vs this position -> find away player at this position
          const homeRankInfo = getTeamRank(homeId, pos, cat.key)
          if (homeRankInfo.rank <= 5) {
            const awayPlayer = awayPrimary[pos]
            if (awayPlayer) {
              insights.push({
                teamAbbr: homeTeam.abbreviation as string,
                statCategory: cat.label,
                position: pos,
                rank: homeRankInfo.rank,
                rankLabel: rankLabel(homeRankInfo.rank),
                playerName: awayPlayer.name,
                playerPosition: awayPlayer.position,
                timeframe: "Last 14",
                avgAllowed: homeRankInfo.avgAllowed,
              })
            }
          }
        }
      }

      // Sort insights: most notable first (lowest rank = most allowed)
      insights.sort((a, b) => a.rank - b.rank)

      const awayLogos = (awayTeam.logos ?? []) as Array<Record<string, unknown>>
      const homeLogos = (homeTeam.logos ?? []) as Array<Record<string, unknown>>

      matchups.push({
        eventId: event.id as string,
        gameTime: event.date as string,
        awayTeam: {
          id: awayId,
          abbr: awayTeam.abbreviation as string,
          name: awayTeam.displayName as string,
          logo: (awayLogos[0]?.href as string) ?? "",
        },
        homeTeam: {
          id: homeId,
          abbr: homeTeam.abbreviation as string,
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

/* ── Get full league rankings table (for a rankings view) ── */

export interface PositionRankingRow {
  rank: number
  teamAbbr: string
  teamName: string
  avgAllowed: number
  gamesPlayed: number
}

export async function getPositionRankings(
  position: Position,
  stat: StatCategory
): Promise<PositionRankingRow[]> {
  const rankings = await getLeagueDefenseVsPosition()

  const field = STAT_CATEGORIES.find((c) => c.key === stat)?.field ?? "pts"

  return [...rankings]
    .map((r) => ({
      rank: 0,
      teamAbbr: r.teamAbbr,
      teamName: r.teamName,
      avgAllowed: r.byPosition[position]?.[field as keyof PositionStatLine] as number ?? 0,
      gamesPlayed: r.byPosition[position]?.gamesCount ?? 0,
    }))
    .sort((a, b) => b.avgAllowed - a.avgAllowed)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}
