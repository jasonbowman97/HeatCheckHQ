// ============================================================
// types/innovation-playbook.ts — Innovation Playbook feature types
// Covers: Heat Ring, Narrative Timeline, Situation Room,
// Convergence Dashboard, Narrative Tracker, Prop Spectrum,
// 60-Second Bet Builder, What-If Simulator, Matchup X-Ray,
// The Graveyard, Correlation Matrix, Collaborative Bet Board
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

// ── NARRATIVE TIMELINE ──

export interface NarrativeTimelineEntry {
  id: string
  playerId: string
  date: string
  gameId: string
  narrativeType: NarrativeFlag['type']
  headline: string
  detail: string
  impact: 'positive' | 'negative' | 'neutral'
  actualPerformance?: {
    stat: string
    value: number
    line: number
    result: 'hit' | 'miss'
  }
}

// ── 60-SECOND BET BUILDER ──

export interface BetBuilderStep {
  step: 1 | 2 | 3 | 4
  label: string
  description: string
}

export interface BetBuilderState {
  currentStep: 1 | 2 | 3 | 4
  sport?: Sport
  confidence?: 'high' | 'medium' | 'any'
  selectedProps: BetBuilderProp[]
  parlayOdds?: number
  parlayPayout?: number
}

export interface BetBuilderProp {
  playerId: string
  playerName: string
  team: string
  stat: string
  line: number
  direction: 'over' | 'under'
  convergenceScore: number
  confidence: number
  odds?: number
}

// ── WHAT-IF SIMULATOR ──

export interface WhatIfScenario {
  id: string
  basePlayerId: string
  baseStat: string
  baseLine: number
  modifications: WhatIfModification[]
  result: WhatIfResult
}

export interface WhatIfModification {
  type: 'change_line' | 'change_opponent' | 'change_venue' | 'toggle_b2b'
    | 'change_rest_days' | 'add_injury' | 'remove_injury'
  label: string
  value: any
}

export interface WhatIfResult {
  originalConvergence: number
  modifiedConvergence: number
  originalDirection: 'over' | 'under' | 'toss-up'
  modifiedDirection: 'over' | 'under' | 'toss-up'
  factorChanges: Array<{
    factorKey: string
    factorName: string
    originalSignal: 'over' | 'under' | 'neutral'
    modifiedSignal: 'over' | 'under' | 'neutral'
    changed: boolean
  }>
  summary: string
}

// ── MATCHUP X-RAY ──

export interface MatchupXRay {
  game: Game
  homeTeamProfile: TeamMatchupProfile
  awayTeamProfile: TeamMatchupProfile
  keyMatchups: KeyMatchup[]
  historicalH2H: H2HHistory
  paceProjection: PaceProjection
}

export interface TeamMatchupProfile {
  team: string
  offensiveRating: number
  defensiveRating: number
  pace: number
  recentForm: 'hot' | 'cold' | 'neutral'
  recentRecord: string
  strengthsVsOpponent: string[]
  weaknessesVsOpponent: string[]
}

export interface KeyMatchup {
  playerA: { id: string; name: string; team: string; position: string }
  playerB: { id: string; name: string; team: string; position: string }
  matchupType: 'offensive_vs_defensive' | 'position_battle' | 'pace_mismatch'
  advantage: 'playerA' | 'playerB' | 'even'
  detail: string
}

export interface H2HHistory {
  totalGames: number
  homeWins: number
  awayWins: number
  avgTotal: number
  avgSpread: number
  recentResults: Array<{
    date: string
    homeScore: number
    awayScore: number
    total: number
  }>
}

export interface PaceProjection {
  projectedPace: number
  leagueAvgPace: number
  projectedTotal: number
  vegasTotal?: number
  paceImpact: 'fast' | 'average' | 'slow'
}

// ── THE GRAVEYARD (Bad Beat Autopsy) ──

export interface GraveyardEntry {
  id: string
  userId: string
  date: string
  playerId: string
  playerName: string
  sport: Sport
  stat: string
  line: number
  direction: 'over' | 'under'
  actualValue: number
  margin: number
  convergenceAtTimeOfBet: number
  result: 'miss'

  autopsy: BetAutopsy
}

export interface BetAutopsy {
  rootCauses: AutopsyCause[]
  processGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  processAssessment: string
  wasUnlucky: boolean
  unluckScore: number // 0-100 (how much was bad luck vs bad process)
  wouldBetAgain: boolean
  lessonsLearned: string[]
}

export interface AutopsyCause {
  type: 'injury_during_game' | 'blowout' | 'foul_trouble' | 'weather_change'
    | 'lineup_change' | 'bad_matchup_read' | 'line_was_sharp' | 'regression'
    | 'minute_restriction' | 'game_flow' | 'other'
  label: string
  detail: string
  wasKnowable: boolean
  severity: 'primary' | 'contributing' | 'minor'
}

// ── CORRELATION MATRIX ──

export interface CorrelationMatrix {
  sport: Sport
  date: string
  gameId: string
  players: CorrelationPlayer[]
  correlations: CorrelationPair[]
  parlayInsights: ParlayInsight[]
}

export interface CorrelationPlayer {
  id: string
  name: string
  team: string
  stat: string
  line: number
}

export interface CorrelationPair {
  playerAId: string
  playerBId: string
  statA: string
  statB: string
  correlation: number // -1 to 1
  sampleSize: number
  relationship: 'strong_positive' | 'moderate_positive' | 'weak'
    | 'moderate_negative' | 'strong_negative'
  insight: string
}

export interface ParlayInsight {
  type: 'stack' | 'fade' | 'contrarian'
  players: string[]
  correlation: number
  historicalHitRate: number
  explanation: string
}

// ── COLLABORATIVE BET BOARD ──

export interface BetBoard {
  id: string
  name: string
  createdBy: string
  members: BetBoardMember[]
  props: BetBoardProp[]
  date: string
  sport?: Sport
  isPublic: boolean
  createdAt: string
}

export interface BetBoardMember {
  userId: string
  displayName: string
  avatarUrl?: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: string
}

export interface BetBoardProp {
  id: string
  addedBy: string
  addedByName: string
  playerId: string
  playerName: string
  team: string
  stat: string
  line: number
  direction: 'over' | 'under'
  convergenceScore?: number
  confidence?: number
  note?: string
  votes: { userId: string; vote: 'agree' | 'disagree' }[]
  result?: 'hit' | 'miss' | 'push'
  actualValue?: number
  addedAt: string
}
