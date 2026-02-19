// ============================================================
// types/innovation-playbook.ts — Situation Room & related types
// ============================================================

import type { Sport, Player, Game, GameLog } from './shared'
import type { ConvergenceFactor, NarrativeFlag, HeatRingGame } from './check-prop'

// ── SITUATION ROOM (Game-Day Command Center) ──

export interface SituationRoomState {
  sport: Sport
  date: string
  games: SituationRoomGame[]
  topPropAlerts: PropAlert[]
  liveUpdates: LiveUpdate[]
  weatherAlerts: WeatherAlert[]
}

export interface SituationRoomGame {
  game: Game
  topProps: SituationRoomProp[]
  lineMovements: LineMovement[]
  injuryUpdates: InjuryUpdate[]
  convergenceHighlights: ConvergenceHighlight[]
}

export interface SituationRoomProp {
  playerId: string
  playerName: string
  playerHeadshot?: string
  team: string
  stat: string
  line: number
  convergenceScore: number
  direction: 'over' | 'under'
  confidence: number
  topFactors: string[]
}

export interface PropAlert {
  id: string
  type: 'line_movement' | 'injury' | 'weather' | 'convergence_shift'
  severity: 'high' | 'medium' | 'low'
  headline: string
  detail: string
  timestamp: string
  relatedPlayerId?: string
  relatedGameId?: string
}

export interface LiveUpdate {
  id: string
  timestamp: string
  type: 'injury' | 'lineup' | 'weather' | 'line_move' | 'news'
  headline: string
  impact: string
  affectedProps: string[]
}

export interface WeatherAlert {
  gameId: string
  venue: string
  condition: string
  temp: number
  wind: number
  windDirection: string
  impactLevel: 'high' | 'medium' | 'low'
  affectedStats: string[]
}

export interface LineMovement {
  playerId: string
  stat: string
  previousLine: number
  currentLine: number
  direction: 'up' | 'down'
  timestamp: string
  magnitude: number
}

export interface InjuryUpdate {
  playerId: string
  playerName: string
  team: string
  previousStatus: string
  currentStatus: string
  timestamp: string
  impactAssessment: string
}

export interface ConvergenceHighlight {
  playerId: string
  playerName: string
  stat: string
  line: number
  convergenceScore: number
  direction: 'over' | 'under'
  changeFromYesterday?: number
}

