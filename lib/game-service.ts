// ============================================================
// lib/game-service.ts — Unified game resolution
// ============================================================
// Resolves today's game for a given player by checking the
// live scoreboard for all sports. Also handles game-by-ID lookup.

import type { Game, Player, Sport } from '@/types/shared'
import { getNBAScoreboard, type NBAScheduleGame } from './nba-api'
import { fetchMLBScoreboard, fetchNFLScoreboard } from './espn/client'

// ── Today's game for a player ──

export async function resolveGameForPlayer(player: Player, gameId?: string): Promise<Game | null> {
  switch (player.sport) {
    case 'nba':
      return resolveNBAGame(player, gameId)
    case 'mlb':
      return resolveMLBGame(player, gameId)
    case 'nfl':
      return resolveNFLGame(player, gameId)
    default:
      return null
  }
}

// ── NBA ──

async function resolveNBAGame(player: Player, gameId?: string): Promise<Game | null> {
  const games = await getNBAScoreboard()

  let target: NBAScheduleGame | undefined

  if (gameId) {
    target = games.find(g => g.id === gameId)
  } else {
    // Find a game featuring the player's team
    target = games.find(
      g => g.homeTeam.abbreviation === player.team.abbrev ||
           g.awayTeam.abbreviation === player.team.abbrev
    )
  }

  if (!target) return null

  return {
    id: target.id,
    sport: 'nba',
    date: target.date,
    homeTeam: {
      id: target.homeTeam.id,
      abbrev: target.homeTeam.abbreviation,
      name: target.homeTeam.displayName,
      logo: target.homeTeam.logo,
    },
    awayTeam: {
      id: target.awayTeam.id,
      abbrev: target.awayTeam.abbreviation,
      name: target.awayTeam.displayName,
      logo: target.awayTeam.logo,
    },
    venue: target.venue,
    spread: target.odds ? parseSpread(target.odds.details) : undefined,
    total: target.odds?.overUnder,
  }
}

// ── MLB ──

async function resolveMLBGame(player: Player, gameId?: string): Promise<Game | null> {
  const raw = await fetchMLBScoreboard()
  const events = ((raw as any).events ?? []) as any[]

  let target: any

  if (gameId) {
    target = events.find((e: any) => e.id === gameId)
  } else {
    target = events.find((e: any) => {
      const comp = e.competitions?.[0]
      const competitors = comp?.competitors ?? []
      return competitors.some((c: any) =>
        c.team?.abbreviation === player.team.abbrev
      )
    })
  }

  if (!target) return null

  const comp = target.competitions[0]
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const odds = comp.odds?.[0]

  return {
    id: target.id,
    sport: 'mlb',
    date: target.date ?? '',
    homeTeam: {
      id: home?.team?.id ?? '',
      abbrev: home?.team?.abbreviation ?? '',
      name: home?.team?.displayName ?? '',
      logo: home?.team?.logo ?? '',
    },
    awayTeam: {
      id: away?.team?.id ?? '',
      abbrev: away?.team?.abbreviation ?? '',
      name: away?.team?.displayName ?? '',
      logo: away?.team?.logo ?? '',
    },
    venue: comp.venue?.fullName ?? '',
    spread: odds ? parseSpread(odds.details ?? '') : undefined,
    total: odds?.overUnder,
  }
}

// ── NFL ──

async function resolveNFLGame(player: Player, gameId?: string): Promise<Game | null> {
  const raw = await fetchNFLScoreboard()
  const events = ((raw as any).events ?? []) as any[]

  let target: any

  if (gameId) {
    target = events.find((e: any) => e.id === gameId)
  } else {
    target = events.find((e: any) => {
      const comp = e.competitions?.[0]
      const competitors = comp?.competitors ?? []
      return competitors.some((c: any) =>
        c.team?.abbreviation === player.team.abbrev
      )
    })
  }

  if (!target) return null

  const comp = target.competitions[0]
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const odds = comp.odds?.[0]

  return {
    id: target.id,
    sport: 'nfl',
    date: target.date ?? '',
    homeTeam: {
      id: home?.team?.id ?? '',
      abbrev: home?.team?.abbreviation ?? '',
      name: home?.team?.displayName ?? '',
      logo: home?.team?.logo ?? '',
    },
    awayTeam: {
      id: away?.team?.id ?? '',
      abbrev: away?.team?.abbreviation ?? '',
      name: away?.team?.displayName ?? '',
      logo: away?.team?.logo ?? '',
    },
    venue: comp.venue?.fullName ?? '',
    spread: odds ? parseSpread(odds.details ?? '') : undefined,
    total: odds?.overUnder,
  }
}

// ── Helpers ──

/**
 * Parse ESPN odds details string like "BOS -4.5" into a number.
 * Returns the home team's spread perspective.
 */
function parseSpread(details: string): number | undefined {
  if (!details) return undefined
  const match = details.match(/([-+]?\d+\.?\d*)/)
  if (!match) return undefined
  return parseFloat(match[1])
}
