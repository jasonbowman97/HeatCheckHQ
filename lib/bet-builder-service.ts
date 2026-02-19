// ============================================================
// lib/bet-builder-service.ts — 60-Second Bet Builder engine
// ============================================================
// Step-by-step prop recommendation engine that guides users
// through sport → confidence → prop selection → parlay summary.

import type { Sport } from '@/types/shared'
import type { BetBuilderProp, BetBuilderState } from '@/types/innovation-playbook'
import type { SituationRoomProp } from '@/types/innovation-playbook'

interface RecommendationInput {
  sport: Sport
  confidence: 'high' | 'medium' | 'any'
  availableProps: SituationRoomProp[]
}

export interface PropRecommendation {
  props: BetBuilderProp[]
  totalAvailable: number
}

/**
 * Filter and rank props based on user preferences in the builder.
 */
export function getRecommendedProps(input: RecommendationInput): PropRecommendation {
  const { sport, confidence, availableProps } = input

  // Filter by confidence level
  let minScore = 0
  switch (confidence) {
    case 'high':
      minScore = 6
      break
    case 'medium':
      minScore = 5
      break
    case 'any':
      minScore = 3
      break
  }

  const filtered = availableProps
    .filter(p => p.convergenceScore >= minScore)
    .sort((a, b) => {
      // Primary: convergence score
      if (b.convergenceScore !== a.convergenceScore) return b.convergenceScore - a.convergenceScore
      // Secondary: confidence
      return b.confidence - a.confidence
    })

  const props: BetBuilderProp[] = filtered.map(p => ({
    playerId: p.playerId,
    playerName: p.playerName,
    team: p.team,
    stat: p.stat,
    line: p.line,
    direction: p.direction,
    convergenceScore: p.convergenceScore,
    confidence: p.confidence,
  }))

  return {
    props,
    totalAvailable: props.length,
  }
}

/**
 * Calculate parlay odds and payout for selected props.
 * Assumes standard -110 odds per leg unless specified.
 */
export function calculateParlayPayout(
  selectedProps: BetBuilderProp[],
  wager: number = 10,
): { totalOdds: number; payout: number; impliedProbability: number } {
  if (selectedProps.length === 0) {
    return { totalOdds: 0, payout: 0, impliedProbability: 0 }
  }

  // Calculate combined decimal odds
  let decimalProduct = 1
  for (const prop of selectedProps) {
    const odds = prop.odds ?? -110
    const decimal = americanToDecimal(odds)
    decimalProduct *= decimal
  }

  const payout = Math.round(wager * decimalProduct * 100) / 100
  const impliedProbability = 1 / decimalProduct

  // Convert back to American odds
  const totalOdds = decimalToAmerican(decimalProduct)

  return { totalOdds, payout, impliedProbability }
}

/**
 * Suggest optimal parlay combinations based on correlation data.
 * Groups props that are positively correlated (same game stacks)
 * and warns about negatively correlated legs.
 */
export function suggestParlayGroups(
  props: BetBuilderProp[],
): { stacks: BetBuilderProp[][]; warnings: string[] } {
  const warnings: string[] = []

  // Group by team for stacking
  const byTeam = new Map<string, BetBuilderProp[]>()
  for (const prop of props) {
    const existing = byTeam.get(prop.team) ?? []
    existing.push(prop)
    byTeam.set(prop.team, existing)
  }

  const stacks: BetBuilderProp[][] = []
  for (const [team, teamProps] of byTeam) {
    if (teamProps.length >= 2) {
      stacks.push(teamProps)
    }
  }

  // Warn about mixed directions in same game
  for (const [team, teamProps] of byTeam) {
    const overs = teamProps.filter(p => p.direction === 'over')
    const unders = teamProps.filter(p => p.direction === 'under')
    if (overs.length > 0 && unders.length > 0) {
      warnings.push(
        `Mixed over/under for ${team} players. These may be negatively correlated.`
      )
    }
  }

  return { stacks, warnings }
}

// ── Helpers ──

function americanToDecimal(odds: number): number {
  if (odds < 0) return 1 + (100 / Math.abs(odds))
  return 1 + (odds / 100)
}

function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100)
  return Math.round(-100 / (decimal - 1))
}
