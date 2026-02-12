/**
 * NBA Streak Detection
 * Scans NBA rotation players (20+ MPG) for active hot/cold streaks.
 * Uses ESPN gamelog endpoint for individual player data + batched concurrency.
 * Cold streaks are relative to the player's own season average.
 */
import "server-only"

import { fetchNBATeams, fetchNBATeamRoster, fetchNBAAthleteGameLog, fetchNBAScoreboard } from "./espn/client"
import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const BATCH_SIZE = 15
const MIN_MPG = 20 // only scan players averaging 20+ minutes per game

interface NBAGameLogEntry {
  date: string
  opponent: string
  stats: Record<string, number>
}

/** Parse ESPN NBA gamelog response into flat stat entries */
function parseNBAGameLog(raw: Record<string, unknown>): NBAGameLogEntry[] {
  const labels = (raw.labels ?? []) as string[]
  const eventMeta = (raw.events ?? {}) as Record<string, Record<string, unknown>>

  const seasonTypes = raw.seasonTypes as Array<Record<string, unknown>> | undefined
  if (!seasonTypes?.length) return []

  const entries: NBAGameLogEntry[] = []
  const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
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
      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as Record<string, unknown>)?.abbreviation as string ?? ""
      const date = (meta?.gameDate as string) ?? ""
      entries.push({ date, opponent, stats: statMap })
    }
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries.slice(0, 20)
}

/** Calculate average of a stat across all game log entries */
function seasonAvg(gameLogs: NBAGameLogEntry[], stat: string): number {
  if (gameLogs.length === 0) return 0
  const total = gameLogs.reduce((s, g) => s + (g.stats[stat] ?? 0), 0)
  return total / gameLogs.length
}

/** Check if a player is a rotation player (20+ MPG) */
function isRotationPlayer(gameLogs: NBAGameLogEntry[]): boolean {
  if (gameLogs.length < 5) return false
  const avgMin = seasonAvg(gameLogs, "MIN")
  return avgMin >= MIN_MPG
}

/** Detect NBA streaks — hot streaks use fixed thresholds, cold streaks are relative */
function detectNBAStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: NBAGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last10 = gameLogs.slice(0, 10).reverse()

  // Season averages for relative cold streak detection
  const avgPts = seasonAvg(gameLogs, "PTS")
  const avgReb = seasonAvg(gameLogs, "REB")
  const avgAst = seasonAvg(gameLogs, "AST")
  const avg3pm = seasonAvg(gameLogs, "3PM") || seasonAvg(gameLogs, "FG3M")

  // === HOT STREAKS ===

  // 1. 20+ point games streak
  const bigScoringGames = last10.map((g) => (g.stats.PTS ?? 0) >= 20)
  const scoringStreak = calcStreak(bigScoringGames)
  if (scoringStreak >= 5) {
    const recentAvg = last10.reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / last10.length
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "20+ PTS Games",
      streakDescription: `${scoringStreak} straight games with 20+ points`,
      recentGames: bigScoringGames, currentStreak: scoringStreak,
      statValue: `${recentAvg.toFixed(1)} PPG`,
    })
  }

  // 2. 30+ point games
  const elite = last10.map((g) => (g.stats.PTS ?? 0) >= 30)
  const eliteStreak = calcStreak(elite)
  if (eliteStreak >= 3) {
    const recentAvg = gameLogs.slice(0, eliteStreak).reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / eliteStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "30+ PTS Games",
      streakDescription: `${eliteStreak} straight games with 30+ points`,
      recentGames: elite, currentStreak: eliteStreak,
      statValue: `${recentAvg.toFixed(1)} PPG`,
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
      streakType: "hot", category: "Scoring", statLabel: "Double-Doubles",
      streakDescription: `${ddStreak} straight double-doubles`,
      recentGames: ddGames, currentStreak: ddStreak,
      statValue: `${ddStreak}G`,
    })
  }

  // 4. 3-pointer streak (3+ per game in 7 of last 10)
  const threeGames = last10.map((g) => (g.stats["3PM"] ?? g.stats.FG3M ?? 0) >= 3)
  const threeCount = threeGames.filter(Boolean).length
  if (threeCount >= 7) {
    const recent3pm = last10.reduce((s, g) => s + (g.stats["3PM"] ?? g.stats.FG3M ?? 0), 0) / last10.length
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Threes", statLabel: "3+ 3PM Games",
      streakDescription: `${threeCount} games with 3+ threes in last ${last10.length}`,
      recentGames: threeGames, currentStreak: calcStreak(threeGames),
      statValue: `${recent3pm.toFixed(1)} 3PM/G`,
    })
  }

  // 5. Assist streak (8+)
  const assistGames = last10.map((g) => (g.stats.AST ?? 0) >= 8)
  const assistStreak = calcStreak(assistGames)
  if (assistStreak >= 4) {
    const recentAst = gameLogs.slice(0, assistStreak).reduce((s, g) => s + (g.stats.AST ?? 0), 0) / assistStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Assists", statLabel: "8+ AST Games",
      streakDescription: `${assistStreak} straight games with 8+ assists`,
      recentGames: assistGames, currentStreak: assistStreak,
      statValue: `${recentAst.toFixed(1)} APG`,
    })
  }

  // 6. Rebounding streak (10+)
  const rebGames = last10.map((g) => (g.stats.REB ?? 0) >= 10)
  const rebStreak = calcStreak(rebGames)
  if (rebStreak >= 4) {
    const recentReb = gameLogs.slice(0, rebStreak).reduce((s, g) => s + (g.stats.REB ?? 0), 0) / rebStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Rebounds", statLabel: "10+ REB Games",
      streakDescription: `${rebStreak} straight games with 10+ rebounds`,
      recentGames: rebGames, currentStreak: rebStreak,
      statValue: `${recentReb.toFixed(1)} RPG`,
    })
  }

  // === COLD STREAKS (relative to player's own season average) ===

  // Cold Scoring: 3+ straight games scoring well below their average (< 60% of avg)
  if (avgPts >= 12) {
    const coldThreshold = avgPts * 0.6
    const coldScoring = last10.map((g) => (g.stats.PTS ?? 0) < coldThreshold)
    const coldStreak = calcStreak(coldScoring)
    if (coldStreak >= 3) {
      const recentAvg = gameLogs.slice(0, coldStreak).reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / coldStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Scoring", statLabel: `Under ${Math.round(coldThreshold)} PTS`,
        streakDescription: `${coldStreak} straight under ${Math.round(coldThreshold)} pts (avg: ${avgPts.toFixed(1)})`,
        recentGames: coldScoring, currentStreak: coldStreak,
        statValue: `${recentAvg.toFixed(1)} PPG`,
      })
    }
  }

  // Cold 3-Point: 3+ straight games with 0 threes when they normally hit 1.5+/game
  if (avg3pm >= 1.5) {
    const coldThrees = last10.map((g) => (g.stats["3PM"] ?? g.stats.FG3M ?? 0) === 0)
    const cold3Streak = calcStreak(coldThrees)
    if (cold3Streak >= 3) {
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Threes", statLabel: "0 3PM Games",
        streakDescription: `${cold3Streak} straight without a three (avg: ${avg3pm.toFixed(1)}/G)`,
        recentGames: coldThrees, currentStreak: cold3Streak,
        statValue: `${cold3Streak}G`,
      })
    }
  }

  // Cold Rebounds: 3+ straight games well below avg (< 50%) for 8+ RPG players
  if (avgReb >= 8) {
    const coldRebThreshold = avgReb * 0.5
    const coldReb = last10.map((g) => (g.stats.REB ?? 0) < coldRebThreshold)
    const coldRebStreak = calcStreak(coldReb)
    if (coldRebStreak >= 3) {
      const recentReb = gameLogs.slice(0, coldRebStreak).reduce((s, g) => s + (g.stats.REB ?? 0), 0) / coldRebStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Rebounds", statLabel: `Under ${Math.round(coldRebThreshold)} REB`,
        streakDescription: `${coldRebStreak} straight under ${Math.round(coldRebThreshold)} reb (avg: ${avgReb.toFixed(1)})`,
        recentGames: coldReb, currentStreak: coldRebStreak,
        statValue: `${recentReb.toFixed(1)} RPG`,
      })
    }
  }

  // Cold Assists: 3+ straight games well below avg (< 50%) for 6+ APG players
  if (avgAst >= 6) {
    const coldAstThreshold = avgAst * 0.5
    const coldAst = last10.map((g) => (g.stats.AST ?? 0) < coldAstThreshold)
    const coldAstStreak = calcStreak(coldAst)
    if (coldAstStreak >= 3) {
      const recentAst = gameLogs.slice(0, coldAstStreak).reduce((s, g) => s + (g.stats.AST ?? 0), 0) / coldAstStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Assists", statLabel: `Under ${Math.round(coldAstThreshold)} AST`,
        streakDescription: `${coldAstStreak} straight under ${Math.round(coldAstThreshold)} ast (avg: ${avgAst.toFixed(1)})`,
        recentGames: coldAst, currentStreak: coldAstStreak,
        statValue: `${recentAst.toFixed(1)} APG`,
      })
    }
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

/** Get today's games to tag players as "playing today" */
async function getTodayGames(): Promise<Map<string, string>> {
  const teamToOpponent = new Map<string, string>()
  try {
    const scoreboard = await fetchNBAScoreboard()
    const events = (scoreboard.events ?? []) as Array<Record<string, unknown>>
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
      const awayAbbr = awayTeam.abbreviation as string
      const homeAbbr = homeTeam.abbreviation as string

      teamToOpponent.set(awayAbbr, homeAbbr)
      teamToOpponent.set(homeAbbr, awayAbbr)
    }
  } catch {
    // Non-critical — trends still work without playing-today data
  }
  return teamToOpponent
}

/**
 * Scan NBA rotation players for active streaks.
 * Only players with 20+ MPG are scanned for streak detection.
 */
export async function getNBAStreakTrends(): Promise<Trend[]> {
  try {
    const [allPlayers, todayGames] = await Promise.all([
      getAllNBAPlayers(),
      getTodayGames(),
    ])
    console.log(`[NBA Streaks] Fetching gamelogs for ${allPlayers.length} rostered players`)

    const allStreaks: StreakResult[] = []
    let scannedCount = 0

    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (player) => {
          try {
            const raw = await fetchNBAAthleteGameLog(player.id)
            const gameLogs = parseNBAGameLog(raw)
            // Skip players who aren't rotation players (< 20 MPG)
            if (!isRotationPlayer(gameLogs)) return []
            scannedCount++
            return detectNBAStreaks(player.id, player.name, player.team, player.position, gameLogs)
          } catch { return [] }
        })
      )
      allStreaks.push(...batchResults.flat())
    }

    console.log(`[NBA Streaks] Scanned ${scannedCount} rotation players, found ${allStreaks.length} streaks`)

    const trends: Trend[] = allStreaks.map((streak, idx) => {
      const opponent = todayGames.get(streak.team)
      return {
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
        playingToday: !!opponent,
        opponent: opponent ?? undefined,
      }
    })

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
    if (streak.category === "Threes") return `Lights out from deep. ${streak.streakDescription}.`
    if (streak.category === "Assists") return `Running the offense. ${streak.streakDescription}.`
    if (streak.category === "Rebounds") return `Dominating the glass. ${streak.streakDescription}.`
  }
  if (streak.streakType === "cold") {
    if (streak.category === "Scoring") return `Struggling to score. ${streak.streakDescription}.`
    if (streak.category === "Threes") return `Ice cold from deep. ${streak.streakDescription}.`
    if (streak.category === "Rebounds") return `Not crashing the boards. ${streak.streakDescription}.`
    if (streak.category === "Assists") return `Not creating for others. ${streak.streakDescription}.`
  }
  return `Notable trend: ${streak.streakDescription}.`
}
