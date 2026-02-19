// ============================================================
// lib/situation-room-service.ts — Game-Day Command Center
// ============================================================
// Aggregates all today's games, top props, line movements,
// injury updates, and convergence highlights into a single
// real-time dashboard feed.

import type { Sport, Game, Player } from '@/types/shared'
import type {
  SituationRoomState,
  SituationRoomGame,
  SituationRoomProp,
  PropAlert,
  LiveUpdate,
  ConvergenceHighlight,
} from '@/types/innovation-playbook'

interface SituationRoomInput {
  sport: Sport
  date: string
  games: Game[]
  // In production, these would come from real-time data feeds
  playerProps?: SituationRoomProp[]
  alerts?: PropAlert[]
  updates?: LiveUpdate[]
}

export function buildSituationRoom(input: SituationRoomInput): SituationRoomState {
  const { sport, date, games, playerProps = [], alerts = [], updates = [] } = input

  // Group props by game
  const gameProps = new Map<string, SituationRoomProp[]>()
  for (const prop of playerProps) {
    // In production, we'd match props to games via team/game ID
    // For now, we'll aggregate
  }

  const situationGames: SituationRoomGame[] = games.map(game => ({
    game,
    topProps: playerProps.filter(p =>
      p.team === game.homeTeam.abbrev || p.team === game.awayTeam.abbrev
    ).sort((a, b) => b.convergenceScore - a.convergenceScore).slice(0, 5),
    lineMovements: [],
    injuryUpdates: [],
    convergenceHighlights: [],
  }))

  // Top prop alerts (highest convergence across all games)
  const topPropAlerts = playerProps
    .filter(p => p.convergenceScore >= 5)
    .sort((a, b) => b.convergenceScore - a.convergenceScore)
    .slice(0, 10)
    .map<PropAlert>((prop, i) => ({
      id: `alert_${i}`,
      type: 'convergence_shift',
      severity: prop.convergenceScore >= 6 ? 'high' : 'medium',
      headline: `${prop.playerName} ${prop.stat} ${prop.direction.toUpperCase()} ${prop.line}`,
      detail: `${prop.convergenceScore}/7 factors aligned. Top factors: ${prop.topFactors.join(', ')}`,
      timestamp: new Date().toISOString(),
      relatedPlayerId: prop.playerId,
    }))

  return {
    sport,
    date,
    games: situationGames,
    topPropAlerts: [...topPropAlerts, ...alerts].slice(0, 20),
    liveUpdates: updates,
    weatherAlerts: [],
  }
}

/**
 * Sort and rank props for the Situation Room top picks
 */
export function rankPropsForSituationRoom(
  props: SituationRoomProp[],
): SituationRoomProp[] {
  return [...props].sort((a, b) => {
    // Primary: convergence score
    if (b.convergenceScore !== a.convergenceScore) {
      return b.convergenceScore - a.convergenceScore
    }
    // Secondary: confidence
    return b.confidence - a.confidence
  })
}

/**
 * Filter props by minimum convergence threshold
 */
export function filterByConvergence(
  props: SituationRoomProp[],
  minScore: number = 5,
): SituationRoomProp[] {
  return props.filter(p => p.convergenceScore >= minScore)
}

/**
 * Group alerts by severity for display
 */
export function groupAlertsBySeverity(
  alerts: PropAlert[],
): Record<'high' | 'medium' | 'low', PropAlert[]> {
  return {
    high: alerts.filter(a => a.severity === 'high'),
    medium: alerts.filter(a => a.severity === 'medium'),
    low: alerts.filter(a => a.severity === 'low'),
  }
}
