/**
 * NBA Streak Detection
 * Fetches player leaders and analyzes their game logs to find active streaks.
 */
import "server-only"

import { getPlayerGameLog } from "./espn/mlb" // Using same ESPN gamelog endpoint
import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

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
    // For NBA, we'll need to get player IDs from ESPN NBA API
    // For now, using a curated list of top players (would need ESPN NBA leaders endpoint)
    const topPlayerIds = [
      "3975", // LeBron James
      "6583", // Giannis
      "3992", // Stephen Curry
      "3102", // Kevin Durant
      "4066", // Luka Doncic
      "4277", // Joel Embiid
      "3059", // Kawhi Leonard
      "4395", // Jayson Tatum
      "3136", // Damian Lillard
      "2991", // Jimmy Butler
      "4065", // Nikola Jokic
      "4351", // Trae Young
      "3213", // Anthony Davis
      "2528", // James Harden
      "3032", // Kyrie Irving
      "4432", // Donovan Mitchell
      "6440", // Anthony Edwards
      "4562", // Devin Booker
      "4433", // Bam Adebayo
      "4896", // Ja Morant
    ]

    const allStreaks: StreakResult[] = []

    // Fetch all player game logs in parallel
    const playerPromises = topPlayerIds.map(async (playerId) => {
      try {
        const gameLogs = await getPlayerGameLog(playerId)
        if (gameLogs.length < 5) return []

        // Extract player info from first game log (ESPN includes it)
        const playerName = "NBA Player" // Would extract from ESPN response
        const team = "NBA"
        const position = "G"

        return detectScoringStreaks(playerId, playerName, team, position, gameLogs)
      } catch (err) {
        console.error(`[NBA Streaks] Failed to fetch game log for player ${playerId}:`, err)
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
