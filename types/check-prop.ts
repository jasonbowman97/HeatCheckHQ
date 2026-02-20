// ============================================================
// types/check-prop.ts — THE CORE DATA TYPE for Prop Analyzer
// ============================================================

import type { Player, Game, GameLog, Sport } from './shared'

export interface PropCheckResult {
  // ---- INPUT ECHO ----
  player: Player
  stat: string
  statLabel: string           // "Points" (display-friendly)
  line: number
  game: Game
  isPlayerHome: boolean

  // ---- 1. VERDICT ----
  verdict: {
    direction: 'over' | 'under' | 'toss-up'
    convergenceScore: number   // 0-7
    confidence: number         // 0-100 weighted
    label: string              // "STRONG OVER"
    sublabel: string
    icon: string
    color: string
    hitRateL10: number         // hit rate last 10
    avgMarginL10: number       // avg margin last 10
    seasonAvg: number
  }

  // ---- 2. HEAT RING ----
  heatRing: {
    games: HeatRingGame[]      // last 10-20 games
    aggregates: {
      hitRate: number
      hitCount: number
      totalGames: number
      avgMargin: number
      avgValue: number
      streak: number           // positive = consecutive overs, negative = unders
    }
  }

  // ---- 3. PROP SPECTRUM ----
  spectrum: {
    distribution: {
      values: number[]
      mean: number
      median: number
      stdDev: number
      min: number
      max: number
      kde: Array<{ x: number; y: number }> // kernel density estimation, 100 points
    }
    overPct: number
    underPct: number
    volatility: 'low' | 'medium' | 'high'
    volatilityScore: number    // 0-100
    overlays: {
      home: KDEOverlay
      away: KDEOverlay
      vsTopDefense: KDEOverlay
      vsBottomDefense: KDEOverlay
    }
  }

  // ---- 4. CONVERGENCE FACTORS ----
  convergence: {
    factors: ConvergenceFactor[]
    overCount: number
    underCount: number
    neutralCount: number
  }

  // ---- 5. MATCHUP CONTEXT ----
  matchup: {
    opponentDefRank: number
    opponentDefLabel: string   // "MIA ranks 26th defending centers"
    opponentDefStatsAllowed: number
    isHome: boolean
    venue: string
    restDays: number
    isBackToBack: boolean
    teamSpread?: number
    gameTotal?: number
    teamImpliedTotal?: number
    injuries: InjuryContext[]
    // MLB specific
    weather?: { temp: number; windSpeed: number; windDirection: string; humidity: number }
    opposingPitcher?: { name: string; hand: string; era: number; whip: number }
    // NFL specific
    isIndoor?: boolean
    isDivisional?: boolean
  }

  // ---- 6. NARRATIVE FLAGS ----
  narratives: NarrativeFlag[]

  // ---- 7. GAME LOG ----
  gameLog: {
    games: GameLog[]
    movingAverage: number[]    // 5-game rolling average
    seasonAverage: number
  }

  // ---- 8. SIMILAR SITUATIONS (Pro only) ----
  similarSituations?: {
    description: string        // "PGs with 28+ usage vs bottom-10 defense at home on 2+ rest"
    matchingGames: number
    avgValue: number
    hitRate: number
    avgMargin: number
  }
}

// ---- SUB-TYPES ----

export interface HeatRingGame {
  gameId: string
  date: string
  opponent: string
  opponentDefRank: number
  isHome: boolean
  isBackToBack: boolean
  actualValue: number
  line: number
  margin: number             // actual - line
  isHit: boolean
}

export interface KDEOverlay {
  kde: Array<{ x: number; y: number }>
  mean: number
  games: number
}

export interface ConvergenceFactor {
  key: string
  name: string
  signal: 'over' | 'under' | 'neutral'
  strength: number           // 0-1
  detail: string             // "72% hit rate in last 10 games"
  dataPoint: string          // "7/10 over"
  icon: string
}

export interface InjuryContext {
  playerName: string
  team: string
  status: 'Out' | 'Day-to-Day' | 'Questionable' | 'Probable'
  impact: 'high' | 'medium' | 'low'
  relevance: string          // "Starting PG out — increases Jokic usage"
}

export interface NarrativeFlag {
  type: 'revenge_game' | 'milestone' | 'losing_streak' | 'winning_streak'
    | 'blowout_bounce' | 'return_from_injury' | 'contract_year'
    | 'back_to_back_road' | 'rest_mismatch' | 'weather_extreme'
    | 'rivalry' | 'key_teammate_out'
  headline: string
  detail: string
  impact: 'positive' | 'negative' | 'neutral'
  historicalStat?: string
  severity: 'high' | 'medium' | 'low'
}

// ---- REQUEST/RESPONSE ----

export interface PropCheckRequest {
  playerId: string
  stat: string
  line: number
  gameId?: string            // optional: auto-detected from today's schedule
}

export interface PropCheckError {
  error: 'no_game_today' | 'player_not_found' | 'invalid_stat' | 'server_error'
  message: string
  canShowHistorical?: boolean
}
