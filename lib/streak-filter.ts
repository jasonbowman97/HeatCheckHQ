/**
 * Client-side filtering and sorting for the NBA Streak Tracker.
 * Pure functions — no React dependency. Takes enriched player data
 * and recomputes hit rates for any threshold/window combination.
 */
import type {
  EnrichedPlayer,
  PlayerGameStat,
  GameStatKey,
  WindowSize,
} from "./streak-types"

/* ── Result type for a single filtered player row ── */

export interface FilteredPlayerRow {
  player: EnrichedPlayer
  windowGames: PlayerGameStat[] // Games within the selected window
  hitGames: boolean[] // true/false per game (oldest → newest for display)
  hitCount: number
  hitRate: number // 0–1
  windowAvg: number
  seasonAvg: number
  statValues: number[] // Raw stat values per game (oldest → newest)
  consecutiveStreak: number // Current consecutive hit streak from most recent
}

export type SortOption = "hitRate" | "streak" | "windowAvg" | "seasonAvg" | "name"

export interface FilterOptions {
  team?: string
  search?: string
  playingTodayOnly?: boolean
  minHitRate?: number // e.g., 0.5 to show 50%+ only
  sortBy?: SortOption
}

/* ── Core computation ── */

/** Compute a single player's stats for a given stat/threshold/window */
export function computePlayerRow(
  player: EnrichedPlayer,
  statKey: GameStatKey,
  threshold: number,
  window: WindowSize
): Omit<FilteredPlayerRow, "player"> | null {
  const windowGames = player.games.slice(0, window)
  if (windowGames.length === 0) return null

  const statValues = windowGames.map((g) => g[statKey])
  const hitGames = statValues.map((v) => v >= threshold)
  const hitCount = hitGames.filter(Boolean).length
  const hitRate = hitCount / windowGames.length
  const windowAvg =
    statValues.reduce((sum, v) => sum + v, 0) / windowGames.length

  // Season average from the pre-computed field
  const seasonAvg = player.seasonAvg[statKey] ?? 0

  // Consecutive streak from most recent game
  let consecutiveStreak = 0
  for (let i = 0; i < hitGames.length; i++) {
    if (hitGames[i]) consecutiveStreak++
    else break
  }

  // Reverse for display (oldest → newest, left to right)
  return {
    windowGames: [...windowGames].reverse(),
    hitGames: [...hitGames].reverse(),
    statValues: [...statValues].reverse(),
    hitCount,
    hitRate,
    windowAvg,
    seasonAvg,
    consecutiveStreak,
  }
}

/* ── Full filter + sort pipeline ── */

export function filterAndSort(
  players: EnrichedPlayer[],
  statKey: GameStatKey,
  threshold: number,
  window: WindowSize,
  options: FilterOptions = {}
): FilteredPlayerRow[] {
  const {
    team,
    search,
    playingTodayOnly,
    minHitRate = 0,
    sortBy = "hitRate",
  } = options

  const query = search?.toLowerCase().trim() ?? ""

  const rows: FilteredPlayerRow[] = []

  for (const player of players) {
    // Pre-filter checks (before expensive computation)
    if (team && team !== "All" && player.team !== team) continue
    if (playingTodayOnly && !player.playingToday) continue
    if (
      query &&
      !player.name.toLowerCase().includes(query) &&
      !player.team.toLowerCase().includes(query)
    )
      continue

    const computed = computePlayerRow(player, statKey, threshold, window)
    if (!computed) continue
    if (computed.hitRate < minHitRate) continue

    rows.push({ player, ...computed })
  }

  return sortRows(rows, sortBy)
}

/* ── Sorting ── */

function sortRows(rows: FilteredPlayerRow[], sortBy: SortOption): FilteredPlayerRow[] {
  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case "hitRate":
        // Primary: hit rate desc, secondary: consecutive streak desc, tertiary: window avg desc
        return (
          b.hitRate - a.hitRate ||
          b.consecutiveStreak - a.consecutiveStreak ||
          b.windowAvg - a.windowAvg
        )
      case "streak":
        return b.consecutiveStreak - a.consecutiveStreak || b.hitRate - a.hitRate
      case "windowAvg":
        return b.windowAvg - a.windowAvg
      case "seasonAvg":
        return b.seasonAvg - a.seasonAvg
      case "name":
        return a.player.name.localeCompare(b.player.name)
      default:
        return 0
    }
  })
}

/* ── Color helpers ── */

/** Returns a color class token for hit rate ranges */
export function hitRateColorClass(rate: number): {
  text: string
  bg: string
  border: string
} {
  if (rate >= 0.8) return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/30" }
  if (rate >= 0.6) return { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/30" }
  if (rate >= 0.4) return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-500/30" }
  return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-500/30" }
}
