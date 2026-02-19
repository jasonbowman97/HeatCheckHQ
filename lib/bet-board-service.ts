// ============================================================
// lib/bet-board-service.ts — Collaborative Bet Board logic
// ============================================================
// Board CRUD helpers, member management, prop voting, and
// result tracking utilities.

import type { BetBoard, BetBoardProp } from '@/types/innovation-playbook'

// ── Board stats ──

export interface BoardStats {
  totalProps: number
  hitRate: number
  missRate: number
  pending: number
  avgConvergence: number
  topContributor: string | null
}

export function computeBoardStats(board: BetBoard): BoardStats {
  const props = board.props
  const total = props.length
  if (total === 0) {
    return { totalProps: 0, hitRate: 0, missRate: 0, pending: 0, avgConvergence: 0, topContributor: null }
  }

  const hits = props.filter(p => p.result === 'hit').length
  const misses = props.filter(p => p.result === 'miss').length
  const pending = props.filter(p => !p.result).length
  const resolved = hits + misses

  const avgConvergence = props.reduce((s, p) => s + (p.convergenceScore ?? 0), 0) / total

  // Find top contributor
  const contribCount = new Map<string, number>()
  for (const prop of props) {
    contribCount.set(prop.addedByName, (contribCount.get(prop.addedByName) ?? 0) + 1)
  }
  let topContributor: string | null = null
  let maxCount = 0
  for (const [name, count] of contribCount) {
    if (count > maxCount) {
      maxCount = count
      topContributor = name
    }
  }

  return {
    totalProps: total,
    hitRate: resolved > 0 ? Math.round((hits / resolved) * 100) : 0,
    missRate: resolved > 0 ? Math.round((misses / resolved) * 100) : 0,
    pending,
    avgConvergence: Math.round(avgConvergence * 10) / 10,
    topContributor,
  }
}

// ── Vote aggregation ──

export function getVoteSummary(prop: BetBoardProp): {
  agrees: number
  disagrees: number
  sentiment: 'positive' | 'negative' | 'neutral'
} {
  const agrees = prop.votes.filter(v => v.vote === 'agree').length
  const disagrees = prop.votes.filter(v => v.vote === 'disagree').length
  const sentiment = agrees > disagrees ? 'positive' :
    disagrees > agrees ? 'negative' : 'neutral'
  return { agrees, disagrees, sentiment }
}

// ── DB row mappers ──

export function mapRowToBoard(row: any, members: any[], props: any[]): BetBoard {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    members: members.map(m => ({
      userId: m.user_id,
      displayName: m.display_name ?? 'Unknown',
      avatarUrl: m.avatar_url,
      role: m.role,
      joinedAt: m.joined_at,
    })),
    props: props.map(mapRowToProp),
    date: row.date ?? row.created_at?.slice(0, 10) ?? '',
    sport: row.sport,
    isPublic: row.is_public ?? false,
    createdAt: row.created_at,
  }
}

export function mapRowToProp(row: any): BetBoardProp {
  return {
    id: row.id,
    addedBy: row.added_by,
    addedByName: row.added_by_name ?? 'Unknown',
    playerId: row.player_id ?? '',
    playerName: row.player_name,
    team: row.team ?? '',
    stat: row.stat,
    line: row.line,
    direction: row.direction,
    convergenceScore: row.convergence_score,
    confidence: row.confidence,
    note: row.note,
    votes: row.votes_json ?? [],
    result: row.result,
    actualValue: row.actual_value,
    addedAt: row.added_at ?? row.created_at,
  }
}
