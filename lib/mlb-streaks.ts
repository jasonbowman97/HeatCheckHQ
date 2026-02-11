/**
 * MLB Streak Detection
 * Scans ALL rostered MLB players (not just leaders) to find active streaks.
 * Uses batched concurrency to avoid overwhelming the MLB Stats API.
 */
import "server-only"

import { getPlayerGameLog, getAllMLBBatters } from "./espn/mlb"
import { getPitchingLeaders } from "./mlb-api"
import { detectHittingStreaks, detectPitchingStreaks, type StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const BATCH_SIZE = 15

/**
 * Fetch MLB trends based on active player streaks across ALL rostered players.
 * Scans every position player via team rosters + top 40 pitchers.
 */
export async function getMLBStreakTrends(): Promise<Trend[]> {
  try {
    // Fetch all rostered batters + pitching leaders in parallel
    const [allBatters, pitchers] = await Promise.all([
      getAllMLBBatters(),
      getPitchingLeaders(),
    ])

    console.log(`[MLB Streaks] Scanning ${allBatters.length} batters + ${Math.min(pitchers.length, 40)} pitchers`)

    const allStreaks: StreakResult[] = []

    // Analyze ALL rostered batters in batches
    for (let i = 0; i < allBatters.length; i += BATCH_SIZE) {
      const batch = allBatters.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (batter) => {
          try {
            const gameLogs = await getPlayerGameLog(batter.id)
            if (gameLogs.length < 5) return []
            return detectHittingStreaks(batter.id, batter.name, batter.team, batter.position, gameLogs)
          } catch {
            return []
          }
        })
      )
      allStreaks.push(...batchResults.flat())
    }

    // Analyze top 40 pitchers in batches
    const topPitchers = pitchers.slice(0, 40)
    for (let i = 0; i < topPitchers.length; i += BATCH_SIZE) {
      const batch = topPitchers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (pitcher) => {
          try {
            const gameLogs = await getPlayerGameLog(String(pitcher.id))
            if (gameLogs.length < 3) return []
            return detectPitchingStreaks(String(pitcher.id), pitcher.name, pitcher.team, "SP", gameLogs)
          } catch {
            return []
          }
        })
      )
      allStreaks.push(...batchResults.flat())
    }

    console.log(`[MLB Streaks] Found ${allStreaks.length} total streaks`)

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

    // Return top 20 hot + top 10 cold (expanded from 12+6 since we scan more players)
    return [...hotTrends.slice(0, 20), ...coldTrends.slice(0, 10)]
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
