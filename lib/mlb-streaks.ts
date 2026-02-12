/**
 * MLB Streak Detection
 * Scans ALL rostered MLB players (batters + pitchers) to find active streaks.
 * Uses batched concurrency to avoid overwhelming the MLB Stats API.
 * Returns ALL detected streaks — client-side filtering handles the rest.
 */
import "server-only"

import { getPlayerGameLog, getAllMLBBatters, getAllMLBPitchers } from "./espn/mlb"
import { detectHittingStreaks, detectPitchingStreaks, type StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const BATCH_SIZE = 15

/**
 * Fetch MLB trends based on active player streaks across ALL rostered players.
 * Returns ALL detected streaks (no cap) so the client can filter/search.
 */
export async function getMLBStreakTrends(): Promise<Trend[]> {
  try {
    // Fetch all rostered batters + all rostered pitchers in parallel
    const [allBatters, allPitchers] = await Promise.all([
      getAllMLBBatters(),
      getAllMLBPitchers(),
    ])

    console.log(`[MLB Streaks] Scanning ${allBatters.length} batters + ${allPitchers.length} pitchers`)

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

    // Analyze ALL rostered pitchers in batches
    for (let i = 0; i < allPitchers.length; i += BATCH_SIZE) {
      const batch = allPitchers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (pitcher) => {
          try {
            const gameLogs = await getPlayerGameLog(pitcher.id)
            if (gameLogs.length < 3) return []
            return detectPitchingStreaks(pitcher.id, pitcher.name, pitcher.team, pitcher.position, gameLogs)
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

    // Sort: Hot streaks first (by streak length desc), then cold streaks
    const hotTrends = trends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldTrends = trends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)

    // Return ALL detected streaks — no cap
    return [...hotTrends, ...coldTrends]
  } catch (err) {
    console.error("[MLB Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  if (streak.streakType === "hot") {
    switch (streak.category) {
      case "Hitting": return `Consistently getting on base with ${streak.streakDescription}. Strong recent form at the plate.`
      case "Multi-Hit": return `Racking up multiple hits per game. ${streak.streakDescription} shows locked-in bat.`
      case "Power": return `Power surge with ${streak.streakDescription}. Driving the ball with authority.`
      case "RBI": return `Producing runs with ${streak.streakDescription}. Clutch with runners on base.`
      case "Runs": return `Getting around the bases with ${streak.streakDescription}. Active on the basepaths.`
      case "On Base": return `Reaching base consistently: ${streak.streakDescription}. Elite plate discipline.`
      case "Stolen Bases": return `Running wild with ${streak.streakDescription}. Creating havoc on the bases.`
      case "Pitching": return `Dominant on the mound with ${streak.streakDescription}. Shutting hitters down.`
      case "Strikeouts": return `Elite strikeout numbers: ${streak.streakDescription}. Overpowering opposing batters.`
    }
  } else {
    switch (streak.category) {
      case "Hitting": return `Struggling at the plate: ${streak.streakDescription}. Cold stretch continues.`
      case "Strikeouts": return `Going down on strikes: ${streak.streakDescription}. Chasing pitches.`
      case "Pitching": return `Rough stretch on the mound. ${streak.streakDescription} indicates loss of command.`
    }
  }
  return `Notable trend: ${streak.streakDescription}.`
}
