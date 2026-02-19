// ============================================================
// types/shared.ts — Shared types across Check My Prop & Edge Lab
// ============================================================

export type Sport = 'mlb' | 'nba' | 'nfl'

export interface Player {
  id: string
  name: string
  firstName?: string
  lastName?: string
  team: {
    id: string
    abbrev: string
    name: string
    fullName?: string
    logo: string
  }
  position: string
  headshotUrl?: string
  sport: Sport
  availableStats: string[] // e.g. ['PTS', 'REB', 'AST', '3PM']
}

export interface PlayerSearchResult extends Player {
  hasGameToday: boolean
  todaysOpponent?: string  // "vs MIA" or "@ BOS"
  todaysGameTime?: string  // "7:30 PM ET"
}

export interface Game {
  id: string
  sport: Sport
  date: string
  status?: 'scheduled' | 'live' | 'final'
  homeTeam: {
    id: string
    abbrev: string
    name: string
    logo: string
  }
  awayTeam: {
    id: string
    abbrev: string
    name: string
    logo: string
  }
  startTime?: string // ISO datetime
  venue: string
  broadcast?: string
  spread?: number    // home team spread
  total?: number     // game total O/U
}

export interface GameLog {
  gameId?: string
  date: string
  opponent: string          // team abbrev
  opponentFullName?: string
  opponentDefRank: number   // 1-30 for this stat vs this position
  isHome: boolean
  isBackToBack: boolean
  restDays: number
  result?: 'W' | 'L'
  minutesPlayed?: number
  stats: Record<string, number>
  markers: GameLogMarker[]
}

export interface GameLogMarker {
  type: 'back_to_back' | 'injury_return' | 'revenge_game' | 'teammate_out'
    | 'rest_advantage' | 'milestone' | 'blowout' | 'trade'
  label: string
}

export interface SeasonStats {
  playerId: string
  sport: Sport
  stat: string
  average: number
  gamesPlayed: number
  total: number
  high: number
  low: number
}

export interface DefenseRanking {
  teamId: string
  teamAbbrev: string
  rank: number        // 1 = best defense, 30 = worst
  statsAllowed: number // avg stats allowed per game at this position
  sport: Sport
  position: string
  stat: string
}
