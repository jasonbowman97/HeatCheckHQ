// ============================================================
// lib/correlation-engine.ts — Prop Correlation Analysis
// ============================================================
// Computes pairwise correlations between player props
// to identify profitable parlays and fades.

import type { GameLog, Sport } from '@/types/shared'
import type {
  CorrelationMatrix,
  CorrelationPair,
  CorrelationPlayer,
  ParlayInsight,
} from '@/types/innovation-playbook'

interface CorrelationInput {
  sport: Sport
  date: string
  gameId: string
  players: CorrelationPlayer[]
  // Historical game logs keyed by playerId
  historicalLogs: Record<string, GameLog[]>
}

export function computeCorrelationMatrix(input: CorrelationInput): CorrelationMatrix {
  const { sport, date, gameId, players, historicalLogs } = input

  const correlations: CorrelationPair[] = []

  // Compute pairwise correlations
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i]
      const playerB = players[j]

      const pair = computePairCorrelation(
        playerA,
        playerB,
        historicalLogs[playerA.id] ?? [],
        historicalLogs[playerB.id] ?? [],
      )

      if (pair) {
        correlations.push(pair)
      }
    }
  }

  // Generate parlay insights
  const parlayInsights = generateParlayInsights(correlations, players)

  return {
    sport,
    date,
    gameId,
    players,
    correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
    parlayInsights,
  }
}

function computePairCorrelation(
  playerA: CorrelationPlayer,
  playerB: CorrelationPlayer,
  logsA: GameLog[],
  logsB: GameLog[],
): CorrelationPair | null {
  // Find games where both players played on the same date
  const dateMapA = new Map(logsA.map(g => [g.date, g]))
  const sharedDates: string[] = []

  for (const logB of logsB) {
    if (dateMapA.has(logB.date)) {
      sharedDates.push(logB.date)
    }
  }

  if (sharedDates.length < 10) {
    return null // Not enough shared games for reliable correlation
  }

  // Extract stat values for shared dates
  const valuesA = sharedDates.map(d => dateMapA.get(d)!.stats[playerA.stat] ?? 0)
  const valuesB = sharedDates.map(d => logsB.find(g => g.date === d)!.stats[playerB.stat] ?? 0)

  const correlation = pearsonCorrelation(valuesA, valuesB)

  const relationship = getRelationship(correlation)

  const insight = buildCorrelationInsight(playerA, playerB, correlation, relationship)

  return {
    playerAId: playerA.id,
    playerBId: playerB.id,
    statA: playerA.stat,
    statB: playerB.stat,
    correlation: Math.round(correlation * 1000) / 1000,
    sampleSize: sharedDates.length,
    relationship,
    insight,
  }
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0) return 0

  const meanX = x.reduce((s, v) => s + v, 0) / n
  const meanY = y.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  if (denominator === 0) return 0

  return numerator / denominator
}

function getRelationship(r: number): CorrelationPair['relationship'] {
  const abs = Math.abs(r)
  if (abs >= 0.7) return r > 0 ? 'strong_positive' : 'strong_negative'
  if (abs >= 0.4) return r > 0 ? 'moderate_positive' : 'moderate_negative'
  return 'weak'
}

function buildCorrelationInsight(
  playerA: CorrelationPlayer,
  playerB: CorrelationPlayer,
  correlation: number,
  relationship: CorrelationPair['relationship'],
): string {
  if (relationship === 'strong_positive') {
    return `When ${playerA.name} goes over, ${playerB.name} tends to as well (r=${correlation.toFixed(2)}). Good parlay stack.`
  }
  if (relationship === 'strong_negative') {
    return `${playerA.name} and ${playerB.name} perform inversely (r=${correlation.toFixed(2)}). Consider fading one when betting the other.`
  }
  if (relationship === 'moderate_positive') {
    return `Moderate positive correlation between ${playerA.name} and ${playerB.name} (r=${correlation.toFixed(2)}).`
  }
  if (relationship === 'moderate_negative') {
    return `Moderate negative correlation (r=${correlation.toFixed(2)}). Their outputs tend to move in opposite directions.`
  }
  return `Weak correlation (r=${correlation.toFixed(2)}). These props are largely independent.`
}

function generateParlayInsights(
  correlations: CorrelationPair[],
  players: CorrelationPlayer[],
): ParlayInsight[] {
  const insights: ParlayInsight[] = []

  // Find strong positive correlations (good stacks)
  const strongPositive = correlations.filter(c => c.relationship === 'strong_positive')
  for (const pair of strongPositive.slice(0, 3)) {
    const pA = players.find(p => p.id === pair.playerAId)
    const pB = players.find(p => p.id === pair.playerBId)
    if (pA && pB) {
      insights.push({
        type: 'stack',
        players: [pA.name, pB.name],
        correlation: pair.correlation,
        historicalHitRate: 0, // Would be computed from historical data
        explanation: pair.insight,
      })
    }
  }

  // Find strong negative correlations (fades)
  const strongNegative = correlations.filter(c => c.relationship === 'strong_negative')
  for (const pair of strongNegative.slice(0, 3)) {
    const pA = players.find(p => p.id === pair.playerAId)
    const pB = players.find(p => p.id === pair.playerBId)
    if (pA && pB) {
      insights.push({
        type: 'fade',
        players: [pA.name, pB.name],
        correlation: pair.correlation,
        historicalHitRate: 0,
        explanation: pair.insight,
      })
    }
  }

  return insights
}
