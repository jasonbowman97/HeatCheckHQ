// ============================================================
// lib/criteria-pipeline.ts — Research Criteria evaluation engine
// ============================================================
// Evaluates saved research criteria against today's games and
// players. Used by daily pipeline (10am ET) and on-demand.

import type { ResearchCriteria, CriteriaCondition, CriteriaField } from '@/types/daily-checkin'
import type { Sport, Game, GameLog } from '@/types/shared'

export interface CriteriaMatchContext {
  playerId: string
  playerName: string
  team: string
  sport: Sport
  stat: string
  line: number
  game: Game
  // Dynamic context values that conditions evaluate against
  values: Record<CriteriaField, any>
}

export interface CriteriaMatch {
  criteriaId: string
  criteriaName: string
  playerId: string
  playerName: string
  team: string
  stat: string
  line: number
  direction: 'over' | 'under'
  matchedConditions: number
  totalConditions: number
  matchedAt: string
  gameId: string
}

/**
 * Evaluate a single criteria against a match context.
 * Returns true if ALL conditions are met.
 */
export function evaluateCriteria(
  criteria: ResearchCriteria,
  context: CriteriaMatchContext,
): boolean {
  // Check sport match
  if (criteria.sport !== context.sport) return false
  // Check stat match
  if (criteria.stat !== context.stat) return false

  // All conditions must pass (AND logic)
  return criteria.conditions.every(cond =>
    evaluateCondition(cond, context.values)
  )
}

/**
 * Evaluate a single condition against context values.
 */
function evaluateCondition(
  condition: CriteriaCondition,
  values: Record<string, any>,
): boolean {
  const actual = values[condition.field]
  if (actual === undefined || actual === null) return false

  switch (condition.operator) {
    case 'eq':
      return actual === condition.value
    case 'gt':
      return typeof actual === 'number' && actual > condition.value
    case 'gte':
      return typeof actual === 'number' && actual >= condition.value
    case 'lt':
      return typeof actual === 'number' && actual < condition.value
    case 'lte':
      return typeof actual === 'number' && actual <= condition.value
    case 'between': {
      if (typeof actual !== 'number' || !Array.isArray(condition.value)) return false
      const [min, max] = condition.value
      return actual >= min && actual <= max
    }
    case 'in': {
      if (!Array.isArray(condition.value)) return false
      return condition.value.includes(actual)
    }
    default:
      return false
  }
}

/**
 * Run all active criteria against a batch of match contexts.
 * Returns a list of matches (criteria that triggered).
 */
export function runCriteriaBatch(
  criteria: ResearchCriteria[],
  contexts: CriteriaMatchContext[],
): CriteriaMatch[] {
  const matches: CriteriaMatch[] = []
  const activeCriteria = criteria.filter(c => c.isActive)

  for (const crit of activeCriteria) {
    for (const ctx of contexts) {
      if (evaluateCriteria(crit, ctx)) {
        matches.push({
          criteriaId: crit.id,
          criteriaName: crit.name,
          playerId: ctx.playerId,
          playerName: ctx.playerName,
          team: ctx.team,
          stat: ctx.stat,
          line: ctx.line,
          direction: crit.direction,
          matchedConditions: crit.conditions.length,
          totalConditions: crit.conditions.length,
          matchedAt: new Date().toISOString(),
          gameId: ctx.game.id,
        })
      }
    }
  }

  return matches
}

/**
 * Build context values from game log data for criteria evaluation.
 */
export function buildContextValues(
  gameLog: GameLog,
  game: Game,
  convergenceScore?: number,
  hitRateL10?: number,
  seasonAvg?: number,
  line?: number,
): Record<CriteriaField, any> {
  return {
    home_away: gameLog.isHome ? 'home' : 'away',
    opponent_def_rank: gameLog.opponentDefRank,
    rest_days: gameLog.restDays,
    is_back_to_back: gameLog.isBackToBack,
    team_spread: game.spread ?? 0,
    convergence_score: convergenceScore ?? 0,
    hit_rate_l10: hitRateL10 ?? 0,
    season_avg_vs_line: line != null && seasonAvg != null ? seasonAvg - line : 0,
    streak_direction: 'neutral', // Would need streak data
    game_total: game.total ?? 0,
    // MLB-specific (default for non-MLB)
    pitcher_hand: 'R',
    wind_speed: 0,
    temperature: 70,
    // NFL-specific
    is_indoor: false,
    is_primetime: false,
    is_divisional: false,
  }
}

/**
 * Criteria field metadata for the builder UI.
 */
export const CRITERIA_FIELDS: Array<{
  field: CriteriaField
  label: string
  category: 'general' | 'performance' | 'matchup' | 'mlb' | 'nfl'
  type: 'number' | 'boolean' | 'select'
  options?: { label: string; value: any }[]
  min?: number
  max?: number
}> = [
  // General
  { field: 'home_away', label: 'Home / Away', category: 'general', type: 'select',
    options: [{ label: 'Home', value: 'home' }, { label: 'Away', value: 'away' }] },
  { field: 'is_back_to_back', label: 'Back-to-Back', category: 'general', type: 'boolean' },
  { field: 'rest_days', label: 'Rest Days', category: 'general', type: 'number', min: 0, max: 10 },

  // Performance
  { field: 'convergence_score', label: 'Convergence Score', category: 'performance', type: 'number', min: 0, max: 7 },
  { field: 'hit_rate_l10', label: 'L10 Hit Rate', category: 'performance', type: 'number', min: 0, max: 100 },
  { field: 'season_avg_vs_line', label: 'Avg vs Line Margin', category: 'performance', type: 'number', min: -20, max: 20 },
  { field: 'streak_direction', label: 'Streak Direction', category: 'performance', type: 'select',
    options: [{ label: 'Hot', value: 'hot' }, { label: 'Cold', value: 'cold' }, { label: 'Neutral', value: 'neutral' }] },

  // Matchup
  { field: 'opponent_def_rank', label: 'Opp Defense Rank', category: 'matchup', type: 'number', min: 1, max: 30 },
  { field: 'team_spread', label: 'Team Spread', category: 'matchup', type: 'number', min: -20, max: 20 },
  { field: 'game_total', label: 'Game Total', category: 'matchup', type: 'number', min: 150, max: 280 },

  // MLB
  { field: 'pitcher_hand', label: 'Pitcher Hand', category: 'mlb', type: 'select',
    options: [{ label: 'Right', value: 'R' }, { label: 'Left', value: 'L' }] },
  { field: 'wind_speed', label: 'Wind Speed (mph)', category: 'mlb', type: 'number', min: 0, max: 40 },
  { field: 'temperature', label: 'Temperature (F)', category: 'mlb', type: 'number', min: 30, max: 110 },

  // NFL
  { field: 'is_indoor', label: 'Indoor Game', category: 'nfl', type: 'boolean' },
  { field: 'is_primetime', label: 'Primetime Game', category: 'nfl', type: 'boolean' },
  { field: 'is_divisional', label: 'Divisional Game', category: 'nfl', type: 'boolean' },
]
