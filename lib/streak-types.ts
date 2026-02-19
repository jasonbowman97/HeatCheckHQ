/**
 * Types and configuration for the Streak Tracker dashboards (NBA, MLB, NFL).
 * The client fetches enriched player data (raw per-game stats) from sport-specific
 * API routes, then recomputes hit rates locally when the user changes filters.
 */

/* ── Per-game stat row ── */

export interface PlayerGameStat {
  date: string
  opponent: string
  // NBA stats
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
  // MLB stats
  h: number
  hr: number
  rbi: number
  r: number
  sb: number
  tb: number
  k: number
  // NFL stats
  passYd: number
  passTd: number
  rushYd: number
  rushTd: number
  recYd: number
  rec: number
  recTd: number
}

/* ── Enriched player object returned by the API ── */

export interface EnrichedPlayer {
  id: string
  name: string
  team: string
  position: string
  games: PlayerGameStat[] // Last 20 games, newest first
  seasonAvg: Record<string, number>
  playingToday: boolean
  opponent?: string
}

/* ── Stat filter presets ── */

export type GameStatKey = keyof Pick<
  PlayerGameStat,
  | "pts" | "reb" | "ast" | "threepm" | "stl" | "blk"
  | "h" | "hr" | "rbi" | "r" | "sb" | "tb" | "k"
  | "passYd" | "passTd" | "rushYd" | "rushTd" | "recYd" | "rec" | "recTd"
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

export type SportKey = "nba" | "mlb" | "nfl"

/* ── NBA Stat Configs ── */

export const NBA_STAT_CONFIGS: StatFilterConfig[] = [
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

/* ── MLB Stat Configs ── */

export const MLB_STAT_CONFIGS: StatFilterConfig[] = [
  {
    key: "H",
    label: "Hits",
    shortLabel: "H",
    gameStatKey: "h",
    thresholds: [1, 2, 3],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "HR",
    label: "Home Runs",
    shortLabel: "HR",
    gameStatKey: "hr",
    thresholds: [1, 2],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "RBI",
    label: "RBIs",
    shortLabel: "RBI",
    gameStatKey: "rbi",
    thresholds: [1, 2, 3, 4],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "R",
    label: "Runs",
    shortLabel: "R",
    gameStatKey: "r",
    thresholds: [1, 2],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "SB",
    label: "Stolen Bases",
    shortLabel: "SB",
    gameStatKey: "sb",
    thresholds: [1, 2],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "TB",
    label: "Total Bases",
    shortLabel: "TB",
    gameStatKey: "tb",
    thresholds: [2, 3, 4, 5],
    defaultThreshold: 2,
    defaultWindow: 10,
  },
  {
    key: "K",
    label: "Strikeouts",
    shortLabel: "K",
    gameStatKey: "k",
    thresholds: [4, 5, 6, 7, 8, 10],
    defaultThreshold: 6,
    defaultWindow: 10,
  },
]

/* ── NFL Stat Configs ── */

export const NFL_STAT_CONFIGS: StatFilterConfig[] = [
  {
    key: "PASS_YD",
    label: "Passing Yards",
    shortLabel: "Pass YD",
    gameStatKey: "passYd",
    thresholds: [200, 225, 250, 275, 300],
    defaultThreshold: 250,
    defaultWindow: 10,
  },
  {
    key: "PASS_TD",
    label: "Passing TDs",
    shortLabel: "Pass TD",
    gameStatKey: "passTd",
    thresholds: [1, 2, 3],
    defaultThreshold: 2,
    defaultWindow: 10,
  },
  {
    key: "RUSH_YD",
    label: "Rushing Yards",
    shortLabel: "Rush YD",
    gameStatKey: "rushYd",
    thresholds: [50, 70, 80, 100],
    defaultThreshold: 70,
    defaultWindow: 10,
  },
  {
    key: "RUSH_TD",
    label: "Rushing TDs",
    shortLabel: "Rush TD",
    gameStatKey: "rushTd",
    thresholds: [1, 2],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
  {
    key: "REC_YD",
    label: "Receiving Yards",
    shortLabel: "Rec YD",
    gameStatKey: "recYd",
    thresholds: [50, 60, 75, 100],
    defaultThreshold: 60,
    defaultWindow: 10,
  },
  {
    key: "REC",
    label: "Receptions",
    shortLabel: "REC",
    gameStatKey: "rec",
    thresholds: [3, 4, 5, 6],
    defaultThreshold: 4,
    defaultWindow: 10,
  },
  {
    key: "REC_TD",
    label: "Receiving TDs",
    shortLabel: "Rec TD",
    gameStatKey: "recTd",
    thresholds: [1, 2],
    defaultThreshold: 1,
    defaultWindow: 10,
  },
]

/* ── Sport config lookup ── */

export const SPORT_STAT_CONFIGS: Record<SportKey, StatFilterConfig[]> = {
  nba: NBA_STAT_CONFIGS,
  mlb: MLB_STAT_CONFIGS,
  nfl: NFL_STAT_CONFIGS,
}

export const SPORT_LABELS: Record<SportKey, string> = {
  nba: "NBA",
  mlb: "MLB",
  nfl: "NFL",
}

/** Team logo URL template per sport */
export function getTeamLogoUrl(sport: SportKey, teamAbbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${teamAbbr.toLowerCase()}.png`
}

/* ── Backward compat: STAT_CONFIGS is NBA ── */
export const STAT_CONFIGS = NBA_STAT_CONFIGS

export type WindowSize = 5 | 10 | 15 | 20

export const WINDOW_OPTIONS: { value: WindowSize; label: string }[] = [
  { value: 5, label: "Last 5" },
  { value: 10, label: "Last 10" },
  { value: 15, label: "Last 15" },
  { value: 20, label: "Season" },
]
