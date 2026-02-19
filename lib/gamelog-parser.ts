// ============================================================
// lib/gamelog-parser.ts — ESPN gamelog → GameLog[] transformer
// ============================================================
// Parses raw ESPN athlete gamelog responses into our unified
// GameLog type with enrichment (rest days, B2B, markers).

import type { GameLog, Sport } from '@/types/shared'
import {
  fetchNBAAthleteGameLog,
  fetchAthleteGameLog,
} from './espn/client'

// ── Public API ──

export async function fetchAndParseGameLogs(
  playerId: string,
  sport: Sport,
): Promise<GameLog[]> {
  switch (sport) {
    case 'nba':
      return parseNBAGameLogs(playerId)
    case 'mlb':
      return parseMLBGameLogs(playerId)
    default:
      return []
  }
}

// ── NBA Parser ──

async function parseNBAGameLogs(playerId: string): Promise<GameLog[]> {
  const raw = await fetchNBAAthleteGameLog(playerId) as any

  const labels = (raw.labels ?? []) as string[]
  const eventMeta = (raw.events ?? {}) as Record<string, any>

  const seasonTypes = raw.seasonTypes as any[] | undefined
  if (!seasonTypes?.length) return []

  const entries: GameLog[] = []
  const regularSeason = seasonTypes.find(
    (st: any) => (st.displayName as string)?.includes('Regular')
  ) ?? seasonTypes[0]
  const categories = (regularSeason?.categories ?? []) as any[]

  for (const cat of categories) {
    const events = (cat.events ?? []) as any[]
    for (const evt of events) {
      const eventId = evt.eventId as string
      const statsArr = (evt.stats ?? []) as Array<string | number>

      const stats: Record<string, number> = {}
      labels.forEach((label, i) => {
        const val = String(statsArr[i] ?? '')
        if (val.includes('-') && !val.startsWith('-')) {
          const [made, attempted] = val.split('-').map(Number)
          if (label === 'FG') { stats.FGM = made || 0; stats.FGA = attempted || 0 }
          else if (label === '3PT') { stats['3PM'] = made || 0; stats['3PA'] = attempted || 0 }
          else if (label === 'FT') { stats.FTM = made || 0; stats.FTA = attempted || 0 }
          stats[label] = made || 0
        } else {
          stats[label] = Number(val) || 0
        }
      })

      const meta = eventMeta[eventId]
      const eventNote = (meta?.eventNote as string) ?? ''
      if (eventNote.includes('All-Star')) continue

      const opponent = (meta?.opponent as any)?.abbreviation as string ?? ''
      const date = (meta?.gameDate as string) ?? ''
      const isHome = (meta?.homeAway as string) === 'home'

      entries.push({
        date,
        opponent,
        isHome,
        stats,
        opponentDefRank: 0, // Will be enriched later
        isBackToBack: false,
        restDays: 1,
        markers: [],
      })
    }
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Enrich rest days and B2B
  enrichRestDays(entries)

  return entries
}

// ── MLB Parser ──

async function parseMLBGameLogs(playerId: string): Promise<GameLog[]> {
  const raw = await fetchAthleteGameLog(playerId) as any

  const labels = (raw.labels ?? []) as string[]
  const eventMeta = (raw.events ?? {}) as Record<string, any>

  const seasonTypes = raw.seasonTypes as any[] | undefined
  if (!seasonTypes?.length) return []

  const entries: GameLog[] = []
  const regularSeason = seasonTypes.find(
    (st: any) => (st.displayName as string)?.includes('Regular')
  ) ?? seasonTypes[0]
  const categories = (regularSeason?.categories ?? []) as any[]

  for (const cat of categories) {
    const events = (cat.events ?? []) as any[]
    for (const evt of events) {
      const eventId = evt.eventId as string
      const statsArr = (evt.stats ?? []) as Array<string | number>

      const stats: Record<string, number> = {}
      labels.forEach((label, i) => {
        const val = String(statsArr[i] ?? '')
        stats[label] = Number(val) || 0
      })

      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as any)?.abbreviation as string ?? ''
      const date = (meta?.gameDate as string) ?? ''
      const isHome = (meta?.homeAway as string) === 'home'

      entries.push({
        date,
        opponent,
        isHome,
        stats,
        opponentDefRank: 0,
        isBackToBack: false,
        restDays: 1,
        markers: [],
      })
    }
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  enrichRestDays(entries)

  return entries
}

// ── Rest day enrichment ──

function enrichRestDays(logs: GameLog[]): void {
  // logs are sorted newest-first
  for (let i = 0; i < logs.length; i++) {
    if (i < logs.length - 1) {
      const current = new Date(logs[i].date)
      const previous = new Date(logs[i + 1].date)
      const diffMs = current.getTime() - previous.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      logs[i].restDays = Math.max(0, diffDays - 1)
      logs[i].isBackToBack = diffDays <= 1
    }
  }
}
