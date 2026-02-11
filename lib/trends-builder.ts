import type { Trend } from "./trends-types"

/**
 * Given leader entries from ESPN / MLB Stats API, build "hot" Trend objects
 * for top-ranked players. Cold trends come from the streak detector instead,
 * which uses actual game logs to identify struggling players.
 */

interface LeaderInput {
  id: string
  name: string
  team: string
  position: string
  value: number
  displayValue: string
}

interface CategoryConfig {
  name: string
  statLabel: string
  hotPrefix: string
  coldPrefix: string
}

function generateRecentGames(rank: number): boolean[] {
  // Deterministic recent-games pattern based on ranking (for leader-based hot trends)
  const patterns: boolean[][] = [
    [true, true, true, true, true, true, true, true],   // rank 0 (best)
    [true, true, false, true, true, true, true, true],   // rank 1
    [true, false, true, true, false, true, true, true],  // rank 2
    [true, true, false, true, true, false, true, true],  // rank 3+
  ]
  return patterns[Math.min(rank, patterns.length - 1)]
}

export function buildTrends(
  categories: { config: CategoryConfig; leaders: LeaderInput[] }[],
  sport: string,
  hotCount = 3,
): Trend[] {
  const trends: Trend[] = []
  let idx = 0

  for (const { config, leaders } of categories) {
    if (leaders.length === 0) continue

    // Only generate "hot" trends from leaders — these are the top players in the league.
    // "Cold" trends come from the streak detector (game-log based), which correctly
    // identifies players with consecutive bad games rather than mislabeling top-15 leaders.
    const hotPlayers = leaders.slice(0, hotCount)
    for (let r = 0; r < hotPlayers.length; r++) {
      const p = hotPlayers[r]
      const streak = 8 - r * 2 // 8, 6, 4...
      const recentGames = generateRecentGames(r)
      idx++
      trends.push({
        id: `${sport}-live-${idx}`,
        playerName: p.name,
        team: p.team,
        position: p.position,
        type: "hot",
        category: config.name,
        headline: `${config.hotPrefix} ${p.displayValue} ${config.statLabel}`,
        detail: `Ranked #${r + 1} in the league in ${config.name.toLowerCase()}. Currently at ${p.displayValue} ${config.statLabel} this season.`,
        streakLength: streak,
        streakLabel: "Recent form",
        recentGames,
        statValue: p.displayValue,
        statLabel: config.statLabel,
      })
    }
  }

  return trends
}
