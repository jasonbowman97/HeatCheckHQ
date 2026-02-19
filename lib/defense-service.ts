// ============================================================
// lib/defense-service.ts — Defense ranking resolver
// ============================================================
// Bridges existing BettingPros DVP data to DefenseRanking type
// used by the convergence engine and matchup context.

import type { DefenseRanking, Player, Game, Sport } from '@/types/shared'
import { getPositionRankings, type Position, type StatCategory } from './nba-defense-vs-position'

// ── NBA stat → DVP stat mapping ──

const NBA_STAT_TO_DVP: Record<string, StatCategory> = {
  PTS: 'PTS',
  REB: 'REB',
  AST: 'AST',
  '3PM': '3PM',
  STL: 'STL',
  BLK: 'BLK',
}

// ── NBA position normalization ──
// ESPN returns various position formats; normalize to 5-position

const POSITION_MAP: Record<string, Position> = {
  PG: 'PG', 'Point Guard': 'PG',
  SG: 'SG', 'Shooting Guard': 'SG',
  SF: 'SF', 'Small Forward': 'SF',
  PF: 'PF', 'Power Forward': 'PF',
  C: 'C', 'Center': 'C',
  G: 'SG',  // Default guard to SG
  F: 'SF',  // Default forward to SF
  'G-F': 'SG', 'F-G': 'SF',
  'F-C': 'PF', 'C-F': 'PF',
}

function normalizePosition(pos: string): Position {
  return POSITION_MAP[pos] ?? 'SF' // Default to SF if unknown
}

// ESPN abbreviation mapping (matches nba-defense-vs-position.ts)
const ESPN_TO_BP: Record<string, string> = {
  GS: 'GSW', SA: 'SAS', NY: 'NYK', NO: 'NOR',
  WSH: 'WAS', PHX: 'PHO', UTAH: 'UTH',
}

function espnAbbrToBP(espnAbbr: string): string {
  return ESPN_TO_BP[espnAbbr] ?? espnAbbr
}

// ── Public API ──

export async function resolveDefenseRanking(
  player: Player,
  game: Game,
  stat: string,
): Promise<DefenseRanking> {
  const isHome = game.homeTeam.id === player.team.id
  const opponentAbbrev = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev

  switch (player.sport) {
    case 'nba':
      return resolveNBADefense(player, opponentAbbrev, stat)
    default:
      // For MLB/NFL, return a neutral ranking until sport-specific DVP is wired
      return {
        teamId: '',
        teamAbbrev: opponentAbbrev,
        rank: 15, // Middle of the pack
        statsAllowed: 0,
        sport: player.sport,
        position: player.position,
        stat,
      }
  }
}

async function resolveNBADefense(
  player: Player,
  opponentAbbrev: string,
  stat: string,
): Promise<DefenseRanking> {
  const dvpStat = NBA_STAT_TO_DVP[stat]
  const position = normalizePosition(player.position)

  if (!dvpStat) {
    return {
      teamId: '',
      teamAbbrev: opponentAbbrev,
      rank: 15,
      statsAllowed: 0,
      sport: 'nba',
      position: player.position,
      stat,
    }
  }

  try {
    const rankings = await getPositionRankings(position, dvpStat)
    const bpAbbr = espnAbbrToBP(opponentAbbrev)
    const entry = rankings.find(r => r.teamAbbr === bpAbbr)

    return {
      teamId: '',
      teamAbbrev: opponentAbbrev,
      rank: entry?.rank ?? 15,
      statsAllowed: entry?.avgAllowed ?? 0,
      sport: 'nba',
      position: player.position,
      stat,
    }
  } catch {
    return {
      teamId: '',
      teamAbbrev: opponentAbbrev,
      rank: 15,
      statsAllowed: 0,
      sport: 'nba',
      position: player.position,
      stat,
    }
  }
}
