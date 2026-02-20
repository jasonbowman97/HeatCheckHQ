// ============================================================
// lib/prop-lines.ts — Common line thresholds per stat per sport
// ============================================================
// Pre-set round-number benchmarks that users commonly care about.
// NOT sportsbook lines — these are intuitive reference points.

import type { Sport } from '@/types/shared'

// ──── THRESHOLDS PER STAT ────

export const COMMON_LINES: Record<Sport, Record<string, number[]>> = {
  nba: {
    points: [10, 15, 20, 25, 30, 35],
    rebounds: [4, 6, 8, 10, 12],
    assists: [3, 5, 7, 9, 11],
    threes: [1.5, 2.5, 3.5, 4.5],
    steals: [0.5, 1.5, 2.5],
    blocks: [0.5, 1.5, 2.5],
    turnovers: [1.5, 2.5, 3.5],
    pts_reb_ast: [20, 25, 30, 35, 40, 45],
    pts_reb: [15, 20, 25, 30, 35],
    pts_ast: [15, 20, 25, 30],
    reb_ast: [8, 10, 12, 15, 18],
    double_double: [0.5],
    minutes: [20, 25, 30, 35],
  },
  mlb: {
    hits: [0.5, 1.5, 2.5],
    home_runs: [0.5, 1.5],
    rbis: [0.5, 1.5, 2.5],
    runs: [0.5, 1.5],
    stolen_bases: [0.5, 1.5],
    total_bases: [0.5, 1.5, 2.5, 3.5],
    strikeouts_pitcher: [4.5, 5.5, 6.5, 7.5],
    walks_pitcher: [1.5, 2.5, 3.5],
    earned_runs: [1.5, 2.5, 3.5],
    hits_allowed: [3.5, 4.5, 5.5, 6.5],
    innings_pitched: [4.5, 5.5, 6.5],
    outs_recorded: [14.5, 16.5, 18.5],
  },
  nfl: {
    passing_yards: [200, 225, 250, 275, 300],
    passing_tds: [0.5, 1.5, 2.5],
    rushing_yards: [40, 50, 60, 75, 100],
    rushing_tds: [0.5, 1.5],
    receiving_yards: [30, 50, 60, 75, 100],
    receptions: [2.5, 3.5, 4.5, 5.5],
    receiving_tds: [0.5, 1.5],
    completions: [18.5, 20.5, 22.5, 25.5],
    interceptions: [0.5, 1.5],
    fantasy_points: [15, 18, 20, 25],
  },
}

// ──── STAT CATEGORY GROUPINGS ────

export const STAT_CATEGORIES: Record<Sport, { label: string; stats: string[] }[]> = {
  nba: [
    { label: 'Scoring', stats: ['points', 'threes'] },
    { label: 'Playmaking', stats: ['assists', 'turnovers'] },
    { label: 'Rebounding', stats: ['rebounds'] },
    { label: 'Defense', stats: ['steals', 'blocks'] },
    { label: 'Combos', stats: ['pts_reb_ast', 'pts_reb', 'pts_ast', 'reb_ast', 'double_double'] },
    { label: 'Other', stats: ['minutes'] },
  ],
  mlb: [
    { label: 'Batting', stats: ['hits', 'home_runs', 'rbis', 'runs', 'stolen_bases', 'total_bases'] },
    { label: 'Pitching', stats: ['strikeouts_pitcher', 'walks_pitcher', 'earned_runs', 'hits_allowed', 'innings_pitched', 'outs_recorded'] },
  ],
  nfl: [
    { label: 'Passing', stats: ['passing_yards', 'passing_tds', 'completions', 'interceptions'] },
    { label: 'Rushing', stats: ['rushing_yards', 'rushing_tds'] },
    { label: 'Receiving', stats: ['receiving_yards', 'receptions', 'receiving_tds'] },
    { label: 'Fantasy', stats: ['fantasy_points'] },
  ],
}

// ──── CORE STATS (shown first / free tier) ────

export const CORE_STATS: Record<Sport, string[]> = {
  nba: ['points', 'rebounds', 'assists'],
  mlb: ['hits', 'strikeouts_pitcher', 'total_bases'],
  nfl: ['passing_yards', 'rushing_yards', 'receiving_yards'],
}

// ──── SMART DEFAULT LINE ────

/**
 * Pick the pre-set threshold closest to the player's season average.
 * This ensures the default line shown on each prop card is the most
 * relevant benchmark for that specific player.
 */
export function getSmartDefault(stat: string, sport: Sport, seasonAvg: number): number {
  const lines = COMMON_LINES[sport]?.[stat]
  if (!lines || lines.length === 0) return Math.round(seasonAvg * 2) / 2 // fallback to nearest 0.5

  // Find the threshold closest to the season average
  let closest = lines[0]
  let minDiff = Math.abs(seasonAvg - closest)

  for (const line of lines) {
    const diff = Math.abs(seasonAvg - line)
    if (diff < minDiff) {
      minDiff = diff
      closest = line
    }
  }

  return closest
}

/**
 * Get all available thresholds for a stat, returning them in order.
 * If no pre-set thresholds exist, generates sensible defaults from the season average.
 */
export function getThresholds(stat: string, sport: Sport, seasonAvg?: number): number[] {
  const lines = COMMON_LINES[sport]?.[stat]
  if (lines && lines.length > 0) return lines

  // Fallback: generate thresholds around the season average
  if (seasonAvg && seasonAvg > 0) {
    const base = Math.round(seasonAvg)
    return [
      Math.max(0.5, base - Math.ceil(base * 0.4)),
      Math.max(0.5, base - Math.ceil(base * 0.2)),
      base,
      base + Math.ceil(base * 0.2),
      base + Math.ceil(base * 0.4),
    ]
  }

  return [0.5] // absolute fallback
}

/**
 * Get all stat keys for a sport (in display order).
 * Core stats come first, then the rest grouped by category.
 */
export function getOrderedStats(sport: Sport): string[] {
  const core = CORE_STATS[sport] || []
  const categories = STAT_CATEGORIES[sport] || []
  const allStats = categories.flatMap(c => c.stats)

  // Core stats first, then remaining in category order
  const remaining = allStats.filter(s => !core.includes(s))
  return [...core, ...remaining]
}
