/**
 * MLB Streak Detection
 * Fetches player leaders and analyzes their game logs to find active streaks.
 */
import "server-only"

import { getPlayerGameLog } from "./espn/mlb"
import { getBattingLeaders, getPitchingLeaders } from "./mlb-api"
import { detectHittingStreaks, detectPitchingStreaks, type StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

/**
 * Fetch MLB trends based on active player streaks (not just season totals)
 * This analyzes recent game logs to find hot/cold performers.
 */
export async function getMLBStreakTrends(): Promise<Trend[]> {
  try {
    const [batters, pitchers] = await Promise.all([
      getBattingLeaders(),
      getPitchingLeaders(),
    ])

    const allStreaks: StreakResult[] = []

    // Analyze top 30 batters for streaks - PARALLEL FETCHING
    const topBatters = batters.slice(0, 30)
    const batterPromises = topBatters.map(async (batter) => {
      try {
        const gameLogs = await getPlayerGameLog(String(batter.id))
        if (gameLogs.length < 5) return [] // Need at least 5 games

        return detectHittingStreaks(
          String(batter.id),
          batter.name,
          batter.team,
          batter.pos,
          gameLogs
        )
      } catch (err) {
        console.error(`[MLB Streaks] Failed to fetch game log for ${batter.name}:`, err)
        return []
      }
    })

    // Analyze top 20 pitchers for streaks - PARALLEL FETCHING
    const topPitchers = pitchers.slice(0, 20)
    const pitcherPromises = topPitchers.map(async (pitcher) => {
      try {
        const gameLogs = await getPlayerGameLog(String(pitcher.id))
        if (gameLogs.length < 3) return [] // Need at least 3 games

        return detectPitchingStreaks(
          String(pitcher.id),
          pitcher.name,
          pitcher.team,
          "SP",
          gameLogs
        )
      } catch (err) {
        console.error(`[MLB Streaks] Failed to fetch game log for ${pitcher.name}:`, err)
        return []
      }
    })

    // Wait for all in parallel
    const [batterResults, pitcherResults] = await Promise.all([
      Promise.all(batterPromises),
      Promise.all(pitcherPromises)
    ])

    // Flatten results
    allStreaks.push(...batterResults.flat(), ...pitcherResults.flat())

    // Convert streak results to Trend format
    const trends: Trend[] = allStreaks.map((streak, idx) => ({
      id: `mlb-streak-${idx}`,
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

    // Sort: Hot streaks first (by streak length), then cold streaks
    const hotTrends = trends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldTrends = trends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)

    // Return top 12 hot + top 6 cold
    return [...hotTrends.slice(0, 12), ...coldTrends.slice(0, 6)]
  } catch (err) {
    console.error("[MLB Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  if (streak.streakType === "hot") {
    if (streak.category === "Hitting") {
      return `Consistently getting on base with hits in ${streak.streakDescription}. Strong recent form at the plate.`
    }
    if (streak.category === "Power Hitting" || streak.category === "Power") {
      return `Locked in with power numbers. ${streak.streakDescription} shows elite bat speed and contact.`
    }
    if (streak.category === "Pitching") {
      return `Dominant pitching performance with ${streak.streakDescription}. Locked in on the mound.`
    }
    if (streak.category === "Strikeouts") {
      return `Elite strikeout numbers with ${streak.streakDescription}. Overpowering opposing batters.`
    }
  } else {
    if (streak.category === "Hitting") {
      return `Struggling at the plate with ${streak.streakDescription}. Cold stretch continues.`
    }
    if (streak.category === "Pitching") {
      return `Rough stretch on the mound. ${streak.streakDescription} indicates loss of command.`
    }
  }
  return `Notable trend: ${streak.streakDescription}.`
}
