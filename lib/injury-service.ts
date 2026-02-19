// ============================================================
// lib/injury-service.ts — Team injury data resolver
// ============================================================
// Fetches injury reports for a player's team and their opponent
// using existing ESPN team summary endpoints.

import type { Player, Game } from '@/types/shared'
import type { InjuryContext } from '@/types/check-prop'
import { getNBATeamSummary } from './nba-api'

export interface TeamInjuries {
  teammates: InjuryContext[]
  opponents: InjuryContext[]
}

export async function fetchTeamInjuries(
  player: Player,
  game: Game,
): Promise<TeamInjuries> {
  const isHome = game.homeTeam.id === player.team.id
  const playerTeamId = player.team.id
  const opponentTeamId = isHome ? game.awayTeam.id : game.homeTeam.id

  switch (player.sport) {
    case 'nba':
      return fetchNBAInjuries(playerTeamId, opponentTeamId, player.name)
    default:
      return { teammates: [], opponents: [] }
  }
}

async function fetchNBAInjuries(
  playerTeamId: string,
  opponentTeamId: string,
  currentPlayerName: string,
): Promise<TeamInjuries> {
  const [teamSummary, opponentSummary] = await Promise.all([
    getNBATeamSummary(playerTeamId).catch(() => null),
    getNBATeamSummary(opponentTeamId).catch(() => null),
  ])

  const teammates: InjuryContext[] = (teamSummary?.injuries ?? [])
    .filter(inj => inj.name !== currentPlayerName)
    .map(inj => ({
      playerName: inj.name,
      team: 'teammate',
      status: normalizeStatus(inj.status),
      impact: estimateImpact(inj.status),
      relevance: inj.detail || 'Teammate injury may affect usage',
    }))

  const opponents: InjuryContext[] = (opponentSummary?.injuries ?? [])
    .map(inj => ({
      playerName: inj.name,
      team: 'opponent',
      status: normalizeStatus(inj.status),
      impact: estimateImpact(inj.status),
      relevance: inj.detail || 'Opponent injury may affect matchup',
    }))

  return { teammates, opponents }
}

function normalizeStatus(status: string): InjuryContext['status'] {
  const s = status.toLowerCase()
  if (s.includes('out') || s.includes('suspended')) return 'Out'
  if (s.includes('doubtful')) return 'Out'
  if (s.includes('questionable')) return 'Questionable'
  if (s.includes('probable')) return 'Probable'
  if (s.includes('day-to-day') || s.includes('day to day')) return 'Day-to-Day'
  return 'Questionable'
}

function estimateImpact(status: string): 'high' | 'medium' | 'low' {
  const s = status.toLowerCase()
  if (s.includes('out') || s.includes('suspended')) return 'high'
  if (s.includes('doubtful')) return 'high'
  if (s.includes('questionable')) return 'medium'
  if (s.includes('probable') || s.includes('day-to-day')) return 'low'
  return 'medium'
}
