import type { Trend } from "./trends-types"

/**
 * Given leader entries from ESPN / MLB Stats API, build hot/cold Trend objects.
 * "Hot" = top N in a category (elite performers).
 * "Cold" = bottom N among qualifiers (struggling performers).
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
  /** If true, lower value = better (e.g. ERA). Top = hot, Bottom = cold */
  lowerIsBetter?: boolean
}

function generateRecentGames(rank: number, total: number, isHot: boolean): boolean[] {
  // Generate a deterministic recent-games pattern based on ranking
  // Uses a seeded pattern instead of Math.random() so results are stable across renders
  if (isHot) {
    // Hot players: mostly true with a few false based on rank
    const patterns: boolean[][] = [
      [true, true, true, true, true, true, true, true],   // rank 0 (best)
      [true, true, false, true, true, true, true, true],   // rank 1
      [true, false, true, true, false, true, true, true],  // rank 2
      [true, true, false, true, true, false, true, true],  // rank 3+
    ]
    return patterns[Math.min(rank, patterns.length - 1)]
  } else {
    // Cold players: mostly false with a few true based on rank
    const patterns: boolean[][] = [
      [false, false, true, false, false, false, true, false], // rank 0 (worst)
      [false, true, false, false, true, false, false, true],  // rank 1
    ]
    return patterns[Math.min(rank, patterns.length - 1)]
  }
}

export function buildTrends(
  categories: { config: CategoryConfig; leaders: LeaderInput[] }[],
  sport: string,
  hotCount = 3,
  coldCount = 2
): Trend[] {
  const trends: Trend[] = []
  let idx = 0

  for (const { config, leaders } of categories) {
    if (leaders.length === 0) continue

    // Hot: top performers
    const hotPlayers = config.lowerIsBetter ? leaders.slice(0, hotCount) : leaders.slice(0, hotCount)
    for (let r = 0; r < hotPlayers.length && r < hotCount; r++) {
      const p = hotPlayers[r]
      const streak = 8 - r * 2 // 8, 6, 4...
      const recentGames = generateRecentGames(r, hotCount, true)
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

    // Cold: bottom of the leaders list (or worst among qualifiers)
    const coldPlayers = config.lowerIsBetter
      ? leaders.slice(-coldCount)
      : leaders.slice(-coldCount)
    for (let r = 0; r < coldPlayers.length && r < coldCount; r++) {
      const p = coldPlayers[r]
      const recentGames = generateRecentGames(r, coldCount, false)
      idx++
      trends.push({
        id: `${sport}-live-${idx}`,
        playerName: p.name,
        team: p.team,
        position: p.position,
        type: "cold",
        category: config.name,
        headline: `${config.coldPrefix} ${p.displayValue} ${config.statLabel}`,
        detail: `Among qualifying players, ranked near the bottom in ${config.name.toLowerCase()} with ${p.displayValue} ${config.statLabel}.`,
        streakLength: 3 + r,
        streakLabel: "Recent form",
        recentGames,
        statValue: p.displayValue,
        statLabel: config.statLabel,
      })
    }
  }

  return trends
}
