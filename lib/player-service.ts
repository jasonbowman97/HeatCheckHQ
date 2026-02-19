// ============================================================
// lib/player-service.ts — Unified player search & resolution
// ============================================================
// Provides cross-sport player search using ESPN roster data.
// Resolves ESPN athlete IDs to our Player type.

import type { Player, Sport } from '@/types/shared'
import {
  fetchNBATeams,
  fetchNBATeamRoster,
  fetchMLBTeams,
  fetchMLBTeamRoster,
} from './espn/client'
import { getNBAScoreboard } from './nba-api'

// ── In-memory player index ──

interface PlayerIndexEntry {
  id: string
  name: string
  nameLower: string
  team: { id: string; abbrev: string; name: string; logo: string }
  position: string
  headshotUrl: string
  sport: Sport
}

let nbaIndex: { entries: PlayerIndexEntry[]; timestamp: number } | null = null
let mlbIndex: { entries: PlayerIndexEntry[]; timestamp: number } | null = null
const INDEX_TTL = 6 * 60 * 60 * 1000 // 6 hours

// ── Index builders ──

async function buildNBAIndex(): Promise<PlayerIndexEntry[]> {
  if (nbaIndex && Date.now() - nbaIndex.timestamp < INDEX_TTL) {
    return nbaIndex.entries
  }

  const teamsRaw = await fetchNBATeams()
  const teams = ((teamsRaw as any).sports?.[0]?.leagues?.[0]?.teams ?? []) as any[]

  const entries: PlayerIndexEntry[] = []

  // Fetch rosters in batches to avoid rate limits
  const BATCH = 10
  for (let i = 0; i < teams.length; i += BATCH) {
    const batch = teams.slice(i, i + BATCH)
    const rosters = await Promise.all(
      batch.map(async (t: any) => {
        try {
          const roster = await fetchNBATeamRoster(t.team.id)
          return { team: t.team, roster }
        } catch {
          return { team: t.team, roster: null }
        }
      })
    )

    for (const { team, roster } of rosters) {
      if (!roster) continue
      const athletes = (roster as any).athletes ?? []
      for (const group of athletes) {
        const items = group.items ?? []
        for (const athlete of items) {
          entries.push({
            id: athlete.id ?? '',
            name: athlete.displayName ?? athlete.fullName ?? '',
            nameLower: (athlete.displayName ?? athlete.fullName ?? '').toLowerCase(),
            team: {
              id: team.id,
              abbrev: team.abbreviation ?? '',
              name: team.displayName ?? '',
              logo: team.logos?.[0]?.href ?? '',
            },
            position: athlete.position?.abbreviation ?? '',
            headshotUrl: athlete.headshot?.href ?? '',
            sport: 'nba',
          })
        }
      }
    }
  }

  nbaIndex = { entries, timestamp: Date.now() }
  return entries
}

async function buildMLBIndex(): Promise<PlayerIndexEntry[]> {
  if (mlbIndex && Date.now() - mlbIndex.timestamp < INDEX_TTL) {
    return mlbIndex.entries
  }

  const teamsRaw = await fetchMLBTeams()
  const teams = ((teamsRaw as any).sports?.[0]?.leagues?.[0]?.teams ?? []) as any[]

  const entries: PlayerIndexEntry[] = []

  const BATCH = 10
  for (let i = 0; i < teams.length; i += BATCH) {
    const batch = teams.slice(i, i + BATCH)
    const rosters = await Promise.all(
      batch.map(async (t: any) => {
        try {
          const roster = await fetchMLBTeamRoster(t.team.id)
          return { team: t.team, roster }
        } catch {
          return { team: t.team, roster: null }
        }
      })
    )

    for (const { team, roster } of rosters) {
      if (!roster) continue
      const athletes = (roster as any).athletes ?? []
      for (const group of athletes) {
        const items = group.items ?? []
        for (const athlete of items) {
          entries.push({
            id: athlete.id ?? '',
            name: athlete.displayName ?? athlete.fullName ?? '',
            nameLower: (athlete.displayName ?? athlete.fullName ?? '').toLowerCase(),
            team: {
              id: team.id,
              abbrev: team.abbreviation ?? '',
              name: team.displayName ?? '',
              logo: team.logos?.[0]?.href ?? '',
            },
            position: athlete.position?.abbreviation ?? '',
            headshotUrl: athlete.headshot?.href ?? '',
            sport: 'mlb',
          })
        }
      }
    }
  }

  mlbIndex = { entries, timestamp: Date.now() }
  return entries
}

// ── Search ──

export async function searchPlayers(
  query: string,
  sport?: Sport,
  limit = 10,
): Promise<Player[]> {
  if (!query || query.length < 2) return []

  const q = query.toLowerCase().trim()

  // Build indices for requested sports
  const indices: PlayerIndexEntry[] = []
  if (!sport || sport === 'nba') {
    try { indices.push(...await buildNBAIndex()) } catch { /* skip */ }
  }
  if (!sport || sport === 'mlb') {
    try { indices.push(...await buildMLBIndex()) } catch { /* skip */ }
  }

  // Fuzzy matching: starts-with gets priority, then includes
  const startsWithMatches: PlayerIndexEntry[] = []
  const containsMatches: PlayerIndexEntry[] = []

  for (const entry of indices) {
    const parts = entry.nameLower.split(' ')
    if (parts.some(p => p.startsWith(q)) || entry.nameLower.startsWith(q)) {
      startsWithMatches.push(entry)
    } else if (entry.nameLower.includes(q)) {
      containsMatches.push(entry)
    }
  }

  const results = [...startsWithMatches, ...containsMatches].slice(0, limit)

  return results.map(toPlayer)
}

// ── Resolve by ID ──

export async function resolvePlayerById(
  playerId: string,
  sport?: Sport,
): Promise<Player | null> {
  // Try each sport's index
  const sports: Sport[] = sport ? [sport] : ['nba', 'mlb']

  for (const s of sports) {
    const index = s === 'nba' ? await buildNBAIndex() : await buildMLBIndex()
    const entry = index.find(e => e.id === playerId)
    if (entry) return toPlayer(entry)
  }

  return null
}

// ── Helpers ──

function toPlayer(entry: PlayerIndexEntry): Player {
  const sportStatMap: Record<Sport, string[]> = {
    nba: ['PTS', 'REB', 'AST', '3PM', 'STL', 'BLK'],
    mlb: ['H', 'HR', 'RBI', 'R', 'SB', 'TB', 'K'],
    nfl: ['passYd', 'passTd', 'rushYd', 'rushTd', 'recYd', 'rec'],
  }

  return {
    id: entry.id,
    name: entry.name,
    team: entry.team,
    position: entry.position,
    headshotUrl: entry.headshotUrl,
    sport: entry.sport,
    availableStats: sportStatMap[entry.sport] ?? [],
  }
}
