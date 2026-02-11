/**
 * NBA Streak Detection
 * Scans ALL NBA rostered players (not just leaders) for active hot/cold streaks.
 * Uses ESPN gamelog endpoint for individual player data + batched concurrency.
 */
import "server-only"

import { fetchNBATeams, fetchNBATeamRoster, fetchNBAAthleteGameLog } from "./espn/client"
import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const BATCH_SIZE = 15

interface NBAGameLogEntry {
  date: string
  opponent: string
  stats: Record<string, number>
}

/** Parse ESPN NBA gamelog response into flat stat entries */
function parseNBAGameLog(raw: Record<string, unknown>): NBAGameLogEntry[] {
  // Labels are at the top level, not inside categories
  const labels = (raw.labels ?? []) as string[]
  // Event metadata (dates, opponents) is at the top level keyed by eventId
  const eventMeta = (raw.events ?? {}) as Record<string, Record<string, unknown>>

  const seasonTypes = raw.seasonTypes as Array<Record<string, unknown>> | undefined
  if (!seasonTypes?.length) return []

  const entries: NBAGameLogEntry[] = []
  const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
  // Categories are split by month (january, december, etc.) — iterate all of them
  const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>

  for (const cat of categories) {
    const events = (cat.events ?? []) as Array<Record<string, unknown>>
    for (const evt of events) {
      const eventId = evt.eventId as string
      const statsArr = (evt.stats ?? []) as Array<string | number>
      const statMap: Record<string, number> = {}
      labels.forEach((label, i) => {
        statMap[label] = Number(statsArr[i]) || 0
      })
      // Get date and opponent from top-level event metadata
      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as Record<string, unknown>)?.abbreviation as string ?? ""
      const date = (meta?.gameDate as string) ?? ""
      entries.push({ date, opponent, stats: statMap })
    }
  }

  // Sort by date descending (most recent first) and limit to 20
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries.slice(0, 20)
}

/** Detect NBA scoring/rebounding/assist streaks */
function detectNBAStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: NBAGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last10 = gameLogs.slice(0, 10).reverse()

  // 1. 20+ point games streak
  const bigScoringGames = last10.map((g) => (g.stats.PTS ?? 0) >= 20)
  const scoringStreak = calcStreak(bigScoringGames)
  if (scoringStreak >= 5) {
    const avgPts = last10.reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / last10.length
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "20+ PTS Games",
      streakDescription: `${scoringStreak} straight games with 20+ points`,
      recentGames: bigScoringGames, currentStreak: scoringStreak,
      statValue: `${avgPts.toFixed(1)} PPG`,
    })
  }

  // 2. 30+ point games
  const elite = last10.map((g) => (g.stats.PTS ?? 0) >= 30)
  const eliteStreak = calcStreak(elite)
  if (eliteStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "30+ PTS Games",
      streakDescription: `${eliteStreak} straight games with 30+ points`,
      recentGames: elite, currentStreak: eliteStreak,
      statValue: `${eliteStreak}G`,
    })
  }

  // 3. Double-double streak
  const ddGames = last10.map((g) => {
    const stats = [g.stats.PTS ?? 0, g.stats.REB ?? 0, g.stats.AST ?? 0, g.stats.STL ?? 0, g.stats.BLK ?? 0]
    return stats.filter((s) => s >= 10).length >= 2
  })
  const ddStreak = calcStreak(ddGames)
  if (ddStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "All-Around", statLabel: "Double-Doubles",
      streakDescription: `${ddStreak} straight double-doubles`,
      recentGames: ddGames, currentStreak: ddStreak,
      statValue: `${ddStreak}G`,
    })
  }

  // 4. 3-pointer streak (3+ per game)
  const threeGames = last10.map((g) => (g.stats["3PM"] ?? g.stats.FG3M ?? 0) >= 3)
  const threeCount = threeGames.filter(Boolean).length
  if (threeCount >= 7) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "3-Point", statLabel: "3+ 3PM Games",
      streakDescription: `${threeCount} games with 3+ threes in last ${last10.length}`,
      recentGames: threeGames, currentStreak: calcStreak(threeGames),
      statValue: `${threeCount}/${last10.length}`,
    })
  }

  // 5. Assist streak (8+)
  const assistGames = last10.map((g) => (g.stats.AST ?? 0) >= 8)
  const assistStreak = calcStreak(assistGames)
  if (assistStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Playmaking", statLabel: "8+ AST Games",
      streakDescription: `${assistStreak} straight games with 8+ assists`,
      recentGames: assistGames, currentStreak: assistStreak,
      statValue: `${assistStreak}G`,
    })
  }

  // 6. Rebounding streak (10+)
  const rebGames = last10.map((g) => (g.stats.REB ?? 0) >= 10)
  const rebStreak = calcStreak(rebGames)
  if (rebStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Rebounding", statLabel: "10+ REB Games",
      streakDescription: `${rebStreak} straight games with 10+ rebounds`,
      recentGames: rebGames, currentStreak: rebStreak,
      statValue: `${rebStreak}G`,
    })
  }

  // 7. Cold: under 10 points
  const coldScoring = last10.map((g) => (g.stats.PTS ?? 0) < 10)
  const coldStreak = calcStreak(coldScoring)
  if (coldStreak >= 3 && position !== "C") {
    const avgPts = gameLogs.slice(0, coldStreak).reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / coldStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "cold", category: "Scoring", statLabel: "Under 10 PTS",
      streakDescription: `${coldStreak} straight games under 10 points`,
      recentGames: coldScoring, currentStreak: coldStreak,
      statValue: `${avgPts.toFixed(1)} PPG`,
    })
  }

  return streaks
}

function calcStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) streak++
    else break
  }
  return streak
}

/** Get ALL NBA players from team rosters */
async function getAllNBAPlayers(): Promise<Array<{ id: string; name: string; team: string; position: string }>> {
  const teamsRaw = await fetchNBATeams()
  const sports = (teamsRaw as Record<string, unknown[]>).sports ?? []
  const teamIds: { id: string; abbr: string }[] = []

  for (const sport of sports as Array<Record<string, unknown>>) {
    const leagues = (sport.leagues ?? []) as Array<Record<string, unknown>>
    for (const league of leagues) {
      const teams = (league.teams ?? []) as Array<Record<string, unknown>>
      for (const teamEntry of teams) {
        const team = teamEntry.team as Record<string, unknown>
        if (team) teamIds.push({ id: team.id as string, abbr: (team.abbreviation as string) ?? "" })
      }
    }
  }

  const rosterPromises = teamIds.map(async ({ id, abbr }) => {
    try {
      const raw = await fetchNBATeamRoster(id)
      const athletes = (raw.athletes ?? []) as Array<Record<string, unknown>>
      const players: Array<{ id: string; name: string; team: string; position: string }> = []
      for (const athlete of athletes) {
        // ESPN roster returns athletes directly (not nested in groups)
        const pos = (athlete.position as Record<string, unknown>)?.abbreviation as string ?? ""
        players.push({
          id: athlete.id as string,
          name: (athlete.displayName as string) ?? (athlete.fullName as string) ?? "",
          team: abbr,
          position: pos,
        })
      }
      return players
    } catch { return [] }
  })

  const results = await Promise.all(rosterPromises)
  return results.flat()
}

/**
 * Scan ALL NBA rostered players for active streaks.
 */
export async function getNBAStreakTrends(): Promise<Trend[]> {
  try {
    const allPlayers = await getAllNBAPlayers()
    console.log(`[NBA Streaks] Scanning ${allPlayers.length} players for streaks`)

    const allStreaks: StreakResult[] = []

    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (player) => {
          try {
            const raw = await fetchNBAAthleteGameLog(player.id)
            const gameLogs = parseNBAGameLog(raw)
            if (gameLogs.length < 5) return []
            return detectNBAStreaks(player.id, player.name, player.team, player.position, gameLogs)
          } catch { return [] }
        })
      )
      allStreaks.push(...batchResults.flat())
    }

    console.log(`[NBA Streaks] Found ${allStreaks.length} total streaks`)

    const trends: Trend[] = allStreaks.map((streak, idx) => ({
      id: `nba-streak-${idx}`,
      playerName: streak.playerName,
      team: streak.team,
      position: streak.position,
      type: streak.streakType,
      category: streak.category,
      headline: streak.streakDescription,
      detail: generateDetail(streak),
      streakLength: streak.currentStreak,
      streakLabel: "Recent games",
      recentGames: streak.recentGames,
      statValue: String(streak.statValue),
      statLabel: streak.statLabel,
    }))

    const hotTrends = trends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldTrends = trends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)

    return [...hotTrends.slice(0, 20), ...coldTrends.slice(0, 10)]
  } catch (err) {
    console.error("[NBA Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  if (streak.streakType === "hot") {
    if (streak.category === "Scoring") return `On fire. ${streak.streakDescription}. Elite offensive output.`
    if (streak.category === "All-Around") return `Filling the stat sheet. ${streak.streakDescription}.`
    if (streak.category === "3-Point") return `Lights out from deep. ${streak.streakDescription}.`
    if (streak.category === "Playmaking") return `Running the offense. ${streak.streakDescription}.`
    if (streak.category === "Rebounding") return `Dominating the glass. ${streak.streakDescription}.`
  }
  if (streak.streakType === "cold") {
    if (streak.category === "Scoring") return `Struggling to score. ${streak.streakDescription}. Cold stretch.`
  }
  return `Notable trend: ${streak.streakDescription}.`
}
