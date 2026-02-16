/**
 * Types and configuration for the NBA Streak Tracker dashboard.
 * The client fetches enriched player data (raw per-game stats) from the API,
 * then recomputes hit rates locally when the user changes filters.
 */

/* ── Per-game stat row ── */

export interface PlayerGameStat {
  date: string
  opponent: string
  pts: number
  reb: number
  ast: number
  threepm: number
  stl: number
  blk: number
  to: number
  min: number
  fgm: number
  fga: number
  ftm: number
  fta: number
}

/* ── Enriched player object returned by the API ── */

export interface EnrichedPlayer {
  id: string
  name: string
  team: string
  position: string
  games: PlayerGameStat[] // Last 20 games, newest first
  seasonAvg: {
    pts: number
    reb: number
    ast: number
    threepm: number
    stl: number
    blk: number
    min: number
  }
  playingToday: boolean
  opponent?: string
}

/* ── Stat filter presets ── */

export type GameStatKey = keyof Pick<
  PlayerGameStat,
  "pts" | "reb" | "ast" | "threepm" | "stl" | "blk"
>

export interface StatFilterConfig {
  key: string // Display key: "PTS", "REB", etc.
  label: string // Full label: "Points", "Rebounds", etc.
  shortLabel: string // Short: "PTS", "REB", etc.
  gameStatKey: GameStatKey // Maps to PlayerGameStat field
  thresholds: number[] // Available preset thresholds
  defaultThreshold: number
  defaultWindow: WindowSize
}

export const STAT_CONFIGS: StatFilterConfig[] = [
  {
    key: "PTS",
    label: "Points",
    shortLabel: "PTS",
    gameStatKey: "pts",
    thresholds: [10, 15, 20, 25, 30, 35],
    defaultThreshold: 20,
    defaultWindow: 10,
  },
  {
    key: "REB",
    label: "Rebounds",
    shortLabel: "REB",
    gameStatKey: "reb",
    thresholds: [4, 6, 8, 10, 12],
    defaultThreshold: 8,
    defaultWindow: 10,
  },
  {
    key: "AST",
    label: "Assists",
    shortLabel: "AST",
    gameStatKey: "ast",
    thresholds: [3, 5, 6, 8, 10],
    defaultThreshold: 6,
    defaultWindow: 10,
  },
  {
    key: "3PM",
    label: "Three-Pointers",
    shortLabel: "3PM",
    gameStatKey: "threepm",
    thresholds: [1, 2, 3, 4, 5],
    defaultThreshold: 2,
    defaultWindow: 10,
  },
  {
    key: "STL",
    label: "Steals",
    shortLabel: "STL",
    gameStatKey: "stl",
    thresholds: [1, 2, 3],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "BLK",
    label: "Blocks",
    shortLabel: "BLK",
    gameStatKey: "blk",
    thresholds: [1, 2, 3],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
]

export type WindowSize = 5 | 10 | 15 | 20

export const WINDOW_OPTIONS: { value: WindowSize; label: string }[] = [
  { value: 5, label: "Last 5" },
  { value: 10, label: "Last 10" },
  { value: 15, label: "Last 15" },
  { value: 20, label: "Season" },
]
