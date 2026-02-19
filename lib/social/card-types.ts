/** Shared types for social cheat sheet data */

export interface DvpRow {
  teamAbbr: string
  teamLogo: string
  opponentAbbr: string
  opponentLogo: string
  position: string
  statCategory: string
  avgAllowed: number
  rank: number
  rankLabel: string
  playerName: string
}

export interface ParlayRow {
  playerName: string
  team: string
  teamLogo: string
  prop: string        // e.g. "PTS O24.5"
  line: number
  hitRate: string     // e.g. "8/10"
  hitPct: number      // e.g. 0.8
  recentGames: boolean[]  // last 10 results
  trend: "hot" | "cold"
}

export interface NrfiRow {
  awayTeam: string
  awayLogo: string
  awayPitcher: string
  awayHand: string
  awayNrfiPct: number
  awayStreak: number
  homeTeam: string
  homeLogo: string
  homePitcher: string
  homeHand: string
  homeNrfiPct: number
  homeStreak: number
  combinedPct: number
  venue: string
}

export interface StrikeoutRow {
  pitcher: string
  team: string
  teamLogo: string
  opponent: string
  opponentLogo: string
  kLine: number
  kPerGame: number
  oppKPct: number
  l3Avg: number
  trend: "over" | "under" | "push"
}

export interface RecapSection {
  title: string
  icon: string          // emoji
  playerName: string
  teamLogo: string
  stat: string
  detail: string
}

export interface StreakSheetRow {
  playerName: string
  team: string
  teamLogo: string
  statLabel: string        // "25+ PTS", "10+ REB", "8+ AST"
  hitCount: number         // 7, 8, 9, or 10
  windowSize: number       // 10
  recentGames: boolean[]   // last 10 hit/miss
  gameStats: number[]      // actual stat values per game (e.g., [28, 22, 30, ...])
  windowAvg: number        // average over window
  seasonAvg: number        // season average
  opponent?: string        // if playing today
}

export type SheetType =
  | "nba_dvp"
  | "nba_parlay"
  | "mlb_nrfi"
  | "mlb_strikeout"
  | "daily_recap"
  | "nba_pts_streaks"
  | "nba_reb_streaks"
  | "nba_ast_streaks"
