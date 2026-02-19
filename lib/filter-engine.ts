// ============================================================
// lib/filter-engine.ts — Filter execution engine for Edge Lab
// ============================================================
// Evaluates filter conditions against enriched game logs.
// Used for both live matching (tonight's games) and backtesting.

import type { Player, Game } from '@/types/shared'
import type {
  FilterCondition,
  FilterOperator,
  CustomFilter,
  EnrichedGameLog,
  FilterMatch,
} from '@/types/edge-lab'
import { getFieldDef } from './filter-registry'

/**
 * Evaluate whether a single game log matches ALL conditions in a filter
 */
export function evaluateFilter(
  filter: CustomFilter,
  gameLog: EnrichedGameLog,
  player?: Player,
  game?: Game,
): { matches: boolean; matchedConditions: FilterMatch['matchedConditions'] } {
  const matchedConditions: FilterMatch['matchedConditions'] = []

  for (const condition of filter.conditions) {
    const fieldDef = getFieldDef(condition.field)
    if (!fieldDef) continue

    const actualValue = fieldDef.evaluate(gameLog, player, game)
    const passes = evaluateCondition(condition.operator, actualValue, condition.value)

    if (!passes) {
      return { matches: false, matchedConditions: [] }
    }

    matchedConditions.push({
      field: condition.field,
      label: condition.fieldLabel ?? fieldDef.label,
      value: String(actualValue),
      threshold: formatThreshold(condition.operator, condition.value),
    })
  }

  return { matches: true, matchedConditions }
}

/**
 * Run a filter against a batch of game logs (for backtesting)
 */
export function evaluateFilterBatch(
  filter: CustomFilter,
  gameLogs: EnrichedGameLog[],
): { matches: EnrichedGameLog[]; nonMatches: EnrichedGameLog[] } {
  const matches: EnrichedGameLog[] = []
  const nonMatches: EnrichedGameLog[] = []

  for (const log of gameLogs) {
    const { matches: isMatch } = evaluateFilter(filter, log)
    if (isMatch) {
      matches.push(log)
    } else {
      nonMatches.push(log)
    }
  }

  return { matches, nonMatches }
}

/**
 * Evaluate a single condition (operator + value check)
 */
function evaluateCondition(
  operator: FilterOperator,
  actual: any,
  expected: any,
): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected

    case 'neq':
      return actual !== expected

    case 'gt':
      return typeof actual === 'number' && actual > expected

    case 'gte':
      return typeof actual === 'number' && actual >= expected

    case 'lt':
      return typeof actual === 'number' && actual < expected

    case 'lte':
      return typeof actual === 'number' && actual <= expected

    case 'between': {
      if (typeof actual !== 'number' || !Array.isArray(expected) || expected.length !== 2) {
        return false
      }
      return actual >= expected[0] && actual <= expected[1]
    }

    case 'in': {
      if (!Array.isArray(expected)) return false
      return expected.includes(actual)
    }

    case 'not_in': {
      if (!Array.isArray(expected)) return true
      return !expected.includes(actual)
    }

    default:
      return false
  }
}

/**
 * Format threshold value for display
 */
function formatThreshold(operator: FilterOperator, value: any): string {
  switch (operator) {
    case 'eq': return `= ${value}`
    case 'neq': return `!= ${value}`
    case 'gt': return `> ${value}`
    case 'gte': return `>= ${value}`
    case 'lt': return `< ${value}`
    case 'lte': return `<= ${value}`
    case 'between':
      return Array.isArray(value) ? `${value[0]}-${value[1]}` : String(value)
    case 'in':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'not_in':
      return Array.isArray(value) ? `not ${value.join(', ')}` : `not ${value}`
    default:
      return String(value)
  }
}

/**
 * Validate filter conditions before saving
 */
export function validateFilter(filter: Partial<CustomFilter>): string[] {
  const errors: string[] = []

  if (!filter.name?.trim()) {
    errors.push('Filter name is required')
  }

  if (!filter.conditions || filter.conditions.length === 0) {
    errors.push('At least one condition is required')
  }

  if (filter.conditions) {
    for (const condition of filter.conditions) {
      const fieldDef = getFieldDef(condition.field)
      if (!fieldDef) {
        errors.push(`Unknown field: ${condition.field}`)
        continue
      }

      if (condition.value === null || condition.value === undefined) {
        errors.push(`Value is required for "${fieldDef.label}"`)
      }

      if (condition.operator === 'between') {
        if (!Array.isArray(condition.value) || condition.value.length !== 2) {
          errors.push(`"${fieldDef.label}" with 'between' operator requires [min, max] array`)
        }
      }
    }
  }

  return errors
}

/**
 * Get a human-readable summary of the filter
 */
export function summarizeFilter(filter: CustomFilter): string {
  if (filter.conditions.length === 0) return 'No conditions set'

  const parts = filter.conditions.map(c => {
    const label = c.fieldLabel ?? c.field
    return `${label} ${formatThreshold(c.operator, c.value)}`
  })

  const direction = filter.direction ? ` (${filter.direction})` : ''
  return parts.join(' AND ') + direction
}
