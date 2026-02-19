// ============================================================
// types/edge-lab.ts — Custom Filter Builder + Backtest Engine
// ============================================================

import type { Sport, GameLog, Player, Game } from './shared'

// ---- FILTER CONDITIONS ----

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'not_in'

export interface FilterCondition {
  id: string                 // unique within the filter (for UI key)
  field: string              // registry key, e.g., 'home_away', 'opponent_def_rank'
  operator: FilterOperator
  value: any                 // single value, array (for 'in'), or [min, max] (for 'between')
  fieldLabel?: string        // "Opponent Defense Rank"
  fieldCategory?: string     // "Matchup", "Rest", "Team Context", etc.
  valueLabel?: string        // human-readable value, e.g., "Home" or "20-30"
}

export interface CustomFilter {
  id: string
  userId: string
  name: string
  description?: string
  sport: Sport
  propType?: string          // e.g., 'player_points' — NULL = any prop type
  direction?: 'over' | 'under'
  conditions: FilterCondition[]
  isActive: boolean
  isPublic: boolean

  // Cached performance
  cachedBacktest?: BacktestResult
  backtestSeasons?: string[]
  backtestUpdatedAt?: string

  // Live season performance
  liveSeason?: string
  liveMatches: number
  liveHits: number
  liveHitRate: number
  liveROI: number
  liveUpdatedAt?: string

  // Metadata
  createdAt: string
  updatedAt: string
  lastFiredAt?: string
  timesFired: number

  // Community (when public)
  publishedAt?: string
  followerCount: number
  forkCount: number
  forkedFromId?: string
  forkedFromName?: string
}

// ---- FILTER EXECUTION ----

export interface FilterMatch {
  id: string
  filterId: string
  gameId: string
  playerId: string
  playerName: string
  playerHeadshot?: string
  team: string
  opponent: string
  stat: string
  line: number
  direction: 'over' | 'under'

  matchedConditions: Array<{
    field: string
    label: string
    value: string
    threshold: string
  }>
  convergenceScore?: number

  gameDate: string
  gameTime?: string
  isHome: boolean
  venue?: string

  // Post-game (null if game hasn't happened yet)
  actualValue?: number
  result?: 'hit' | 'miss'
  margin?: number
}

// ---- BACKTEST ----

export interface BacktestResult {
  filterId: string
  filterName: string
  seasons: string[]
  executionTimeMs: number

  // Core metrics
  totalGames: number
  hits: number
  misses: number
  hitRate: number            // 0-1 decimal

  // Betting simulation (flat 1-unit, assumed -110 juice)
  totalUnitsWagered: number
  totalProfit: number        // in units
  roi: number                // decimal (0.084 = 8.4%)

  // Risk metrics
  maxDrawdown: number
  longestWinStreak: number
  longestLossStreak: number
  sharpeRatio: number
  kellyFraction: number

  // Confidence assessment
  sampleSize: 'insufficient' | 'low' | 'moderate' | 'high'
  confidenceWarning?: string

  // Time series data for equity curve
  equityCurve: EquityCurvePoint[]

  // Monthly breakdown
  monthlyBreakdown: Array<{
    month: string
    games: number
    hits: number
    hitRate: number
    profit: number
  }>

  // Season breakdown
  seasonBreakdown: Array<{
    season: string
    games: number
    hits: number
    hitRate: number
    profit: number
    roi: number
  }>

  // Sport-specific breakdowns
  byTeam?: Array<{ team: string; games: number; hitRate: number; profit: number }>
  byDayOfWeek?: Array<{ day: string; games: number; hitRate: number }>
}

export interface EquityCurvePoint {
  date: string
  gameNumber: number
  cumulativeProfit: number
  cumulativeROI: number
  result: 'hit' | 'miss'
  playerName: string
  stat: string
  line: number
  actualValue: number
}

// ---- ENRICHED GAME LOG (for filter engine) ----

export interface EnrichedGameLog extends GameLog {
  playerId: string
  playerName: string
  teamAbbrev: string
  opponentAbbrev: string
  propType?: string
  primaryStatKey: string
  propLines?: Record<string, number>
  primaryPropType?: string

  // Pre-computed fields
  statAvgL5?: number
  statAvgL10?: number
  hitRateL10?: number
  minutesProjected?: number
  teamStreak?: number
  isDivisional?: boolean
  seasonGameNumber?: number
  teamSpread?: number
  teamImpliedTotal?: number
  gameTotal?: number

  // Sport-specific
  opponentPaceRank?: number       // NBA
  keyTeammateOut?: boolean         // NBA
  opposingPitcherHand?: string     // MLB
  opposingPitcherERA?: number      // MLB
  weather?: { windSpeed: number; windDirection: string; temp: number }
  isDayGame?: boolean              // MLB
  ballparkFactor?: number          // MLB
  isIndoor?: boolean               // NFL
  isPrimetime?: boolean            // NFL
  weekNumber?: number              // NFL
}

// ---- FILTER FIELD REGISTRY ----

export interface FilterFieldDef {
  key: string
  label: string
  category: string
  description: string
  sport: Sport | 'all'
  type: 'select' | 'number' | 'range' | 'boolean' | 'multi_select'
  options?: Array<{ value: any; label: string }>
  min?: number
  max?: number
  step?: number
  defaultOperator: FilterOperator
  unit?: string
  evaluate: (gameLog: EnrichedGameLog, player?: Player, game?: Game) => any
}

// ---- IMPORT ----

export interface ImportedBet {
  rowNumber: number
  date?: string
  playerName?: string
  sport?: Sport
  stat?: string
  line?: number
  direction?: 'over' | 'under'
  stake?: number
  odds?: number
  result?: 'hit' | 'miss' | 'push'
  profit?: number

  parsed: boolean
  parseErrors?: string[]

  enrichment?: {
    matchedPlayerId?: string
    matchedGameId?: string
    convergenceAtTimeOfBet?: number
    opponentDefRank?: number
    wasBackToBack?: boolean
    isHome?: boolean
    processQuality?: 'good' | 'neutral' | 'bad'
  }
}

export interface SheetImportResult {
  id: string
  filename: string
  totalRows: number
  parsedCount: number
  errorCount: number
  bets: ImportedBet[]

  enrichmentSummary?: {
    goodProcessBets: number
    badProcessBets: number
    processQualityRate: number
    avgConvergenceOnWins: number
    avgConvergenceOnLosses: number
    retroResearchGrade: string
  }
}
