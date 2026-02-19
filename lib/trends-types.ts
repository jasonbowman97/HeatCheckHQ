export interface Trend {
  id: string
  /** ESPN athlete ID — used for fetching game logs on click */
  playerId?: string
  playerName: string
  team: string
  position: string
  type: "hot" | "cold"
  category: string
  headline: string
  detail: string
  streakLength: number
  streakLabel: string
  /** Recent game results: true = hit the trend, false = missed */
  recentGames: boolean[]
  /** A key stat value to display prominently */
  statValue: string
  statLabel: string
  /** Player's season average for the primary stat (e.g. "22.4 PPG") */
  seasonAvg?: string
  /** Whether this player has a game scheduled today */
  playingToday?: boolean
  /** Opponent abbreviation if playing today */
  opponent?: string
  /** Threshold consistency data — hit rate against common prop-style thresholds */
  threshold?: {
    /** The threshold value (e.g. 25.5) */
    line: number
    /** The stat being measured (e.g. "PTS", "Pass YDS") */
    stat: string
    /** Games over the threshold out of total (e.g. "8/10") */
    hitRate: string
    /** Hit rate as a decimal for sorting (e.g. 0.8) */
    hitPct: number
  }
  /** Flagged as an elite streak for social media graphics (20+ PTS, 8+ REB, 6+ AST consecutive) */
  eliteStreak?: boolean
}
