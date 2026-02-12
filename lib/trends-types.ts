export interface Trend {
  id: string
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
  /** Whether this player has a game scheduled today */
  playingToday?: boolean
  /** Opponent abbreviation if playing today */
  opponent?: string
}
