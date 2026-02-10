/**
 * NBA Streak Detection
 * Fetches player leaders and analyzes their game logs to find active streaks.
 */
import "server-only"

import { fetchNBAAthleteGameLog } from "./espn/client"
import { getNBALeaders } from "./nba-api"
import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

/** Parse NBA athlete gamelog from ESPN */
interface NBAGameLogEntry {
  date: string
  opponent: string
  stats: Record<string, string | number>
}

async function getNBAPlayerGameLog(athleteId: string): Promise<NBAGameLogEntry[]> {
  try {
    const raw = await fetchNBAAthleteGameLog(athleteId)
    const seasonTypes = (raw as Record<string, unknown>).seasonTypes as Array<Record<string, unknown>> | undefined
    if (!seasonTypes?.length) return []

    const entries: NBAGameLogEntry[] = []
    const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
    const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>
    if (!categories.length) return entries

    const cat = categories[0]
    const labels = (cat.labels ?? []) as string[]
    const events = (cat.events ?? []) as Array<Record<string, unknown>>

    for (const evt of events.slice(0, 15)) {
      const statsArr = (evt.stats ?? []) as Array<string | number>
      const statMap: Record<string, string | number> = {}
      labels.forEach((label, i) => {
        statMap[label] = statsArr[i] ?? 0
      })
      entries.push({
        date: (evt.eventDate as string) ?? "",
        opponent: (evt.opponent as Record<string, unknown>)?.abbreviation as string ?? "",
        stats: statMap,
      })
    }
    return entries
  } catch {
    return []
  }
}

/**
 * Detect NBA scoring streaks from game logs
 */
function detectScoringStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: Array<{ date: string; opponent: string; stats: Record<string, string | number> }>
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last10 = gameLogs.slice(0, 10).reverse()

  // 1. 25+ point games
  const highScoringGames = last10.map((g) => {
    const pts = Number(g.stats.PTS || g.stats.pts || 0)
    return pts >= 25
  })
  const highScoringCount = highScoringGames.filter(Boolean).length
  const currentScoringStreak = calculateCurrentStreak(highScoringGames)

  if (currentScoringStreak >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Scoring",
      statLabel: "25+ PT Games",
      streakDescription: `${currentScoringStreak} straight games with 25+ points`,
      recentGames: highScoringGames,
      currentStreak: currentScoringStreak,
      statValue: `${currentScoringStreak}G`,
    })
  } else if (highScoringCount >= 7) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Scoring",
      statLabel: "25+ PT Games",
      streakDescription: `${highScoringCount} games with 25+ points in last ${last10.length}`,
      recentGames: highScoringGames,
      currentStreak: currentScoringStreak,
      statValue: `${highScoringCount}/${last10.length}`,
    })
  }

  // 2. 3-point shooting streak (3+ 3PM per game)
  const threePointGames = last10.map((g) => {
    const threes = Number(g.stats["3PM"] || g.stats.FG3M || 0)
    return threes >= 3
  })
  const threePointCount = threePointGames.filter(Boolean).length
  const currentThreeStreak = calculateCurrentStreak(threePointGames)

  if (currentThreeStreak >= 4) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "3-Point",
      statLabel: "3+ 3PM Games",
      streakDescription: `${currentThreeStreak} straight games with 3+ threes`,
      recentGames: threePointGames,
      currentStreak: currentThreeStreak,
      statValue: `${currentThreeStreak}G`,
    })
  }

  // 3. Double-double streak (10+ in two categories)
  const doubleDoubleGames = last10.map((g) => {
    const pts = Number(g.stats.PTS || g.stats.pts || 0)
    const reb = Number(g.stats.REB || g.stats.reb || 0)
    const ast = Number(g.stats.AST || g.stats.ast || 0)
    const categories = [pts >= 10, reb >= 10, ast >= 10].filter(Boolean).length
    return categories >= 2
  })
  const doubleDoubleCount = doubleDoubleGames.filter(Boolean).length
  const currentDDStreak = calculateCurrentStreak(doubleDoubleGames)

  if (currentDDStreak >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "All-Around",
      statLabel: "Double-Doubles",
      streakDescription: `${currentDDStreak} straight double-doubles`,
      recentGames: doubleDoubleGames,
      currentStreak: currentDDStreak,
      statValue: `${currentDDStreak}G`,
    })
  }

  // 4. Assist streak (8+ assists)
  const assistGames = last10.map((g) => {
    const ast = Number(g.stats.AST || g.stats.ast || 0)
    return ast >= 8
  })
  const assistCount = assistGames.filter(Boolean).length

  if (assistCount >= 6) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Playmaking",
      statLabel: "8+ AST Games",
      streakDescription: `${assistCount} games with 8+ assists in last ${last10.length}`,
      recentGames: assistGames,
      currentStreak: calculateCurrentStreak(assistGames),
      statValue: `${assistCount}/${last10.length}`,
    })
  }

  // 5. Rebounding streak (10+ rebounds)
  const reboundGames = last10.map((g) => {
    const reb = Number(g.stats.REB || g.stats.reb || 0)
    return reb >= 10
  })
  const reboundCount = reboundGames.filter(Boolean).length
  const currentRebStreak = calculateCurrentStreak(reboundGames)

  if (currentRebStreak >= 4) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Rebounding",
      statLabel: "10+ REB Games",
      streakDescription: `${currentRebStreak} straight games with 10+ rebounds`,
      recentGames: reboundGames,
      currentStreak: currentRebStreak,
      statValue: `${currentRebStreak}G`,
    })
  }

  // 6. Cold streak - low scoring (under 10 points)
  const lowScoringGames = last10.map((g) => {
    const pts = Number(g.stats.PTS || g.stats.pts || 0)
    return pts < 10
  })
  const lowScoringCount = lowScoringGames.filter(Boolean).length
  const currentLowStreak = calculateCurrentStreak(lowScoringGames)

  if (currentLowStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "cold",
      category: "Scoring",
      statLabel: "Low Scoring",
      streakDescription: `${currentLowStreak} straight games under 10 points`,
      recentGames: lowScoringGames,
      currentStreak: currentLowStreak,
      statValue: `${currentLowStreak}G`,
    })
  }

  return streaks
}

function calculateCurrentStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Fetch NBA trends based on active player streaks
 */
export async function getNBAStreakTrends(): Promise<Trend[]> {
  try {
    // Get top players dynamically from ESPN NBA leaders
    const leaderCategories = await getNBALeaders()

    // Collect unique players across all categories
    const playerMap = new Map<string, { id: string; name: string; team: string; position: string }>()
    for (const cat of leaderCategories) {
      for (const leader of (cat.leaders ?? []).slice(0, 10)) {
        if (!playerMap.has(leader.athlete.id)) {
          playerMap.set(leader.athlete.id, {
            id: leader.athlete.id,
            name: leader.athlete.displayName,
            team: leader.athlete.team?.abbreviation ?? "???",
            position: leader.athlete.position?.abbreviation ?? "G",
          })
        }
      }
    }

    const topPlayers = Array.from(playerMap.values()).slice(0, 25)
    const allStreaks: StreakResult[] = []

    // Fetch all player game logs in parallel using NBA endpoint
    const playerPromises = topPlayers.map(async (player) => {
      try {
        const gameLogs = await getNBAPlayerGameLog(player.id)
        if (gameLogs.length < 5) return []

        return detectScoringStreaks(player.id, player.name, player.team, player.position, gameLogs)
      } catch (err) {
        console.error(`[NBA Streaks] Failed to fetch game log for ${player.name}:`, err)
        return []
      }
    })

    const results = await Promise.all(playerPromises)
    allStreaks.push(...results.flat())

    // Convert to Trend format
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

    // Sort hot first, then cold
    const hotTrends = trends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldTrends = trends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)

    return [...hotTrends.slice(0, 12), ...coldTrends.slice(0, 6)]
  } catch (err) {
    console.error("[NBA Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  if (streak.streakType === "hot") {
    if (streak.category === "Scoring") {
      return `Elite scoring run with ${streak.streakDescription}. Offense flowing through them.`
    }
    if (streak.category === "3-Point") {
      return `On fire from beyond the arc. ${streak.streakDescription} shows elite shooting.`
    }
    if (streak.category === "All-Around") {
      return `Complete game with ${streak.streakDescription}. Contributing across the board.`
    }
    if (streak.category === "Playmaking") {
      return `Facilitating at elite level. ${streak.streakDescription} demonstrates court vision.`
    }
    if (streak.category === "Rebounding") {
      return `Dominating the glass with ${streak.streakDescription}. Controlling the paint.`
    }
  } else {
    if (streak.category === "Scoring") {
      return `Struggling to find offense. ${streak.streakDescription} indicates cold shooting.`
    }
  }
  return `Notable trend: ${streak.streakDescription}.`
}
