// ============================================================
// lib/gamelog-parser.ts — ESPN gamelog → GameLog[] transformer
// ============================================================
// Parses raw ESPN athlete gamelog responses into our unified
// GameLog type with enrichment (rest days, B2B, markers).

import type { GameLog, Sport } from '@/types/shared'
import {
  fetchNBAAthleteGameLog,
  fetchAthleteGameLog,
  fetchNFLAthleteGameLog,
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
    case 'nfl':
      return parseNFLGameLogs(playerId)
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

      // Map ESPN labels → internal stat keys (must match statLabels in design-tokens.ts)
      const mapped: Record<string, number> = { ...stats }
      if (stats['PTS'] !== undefined) mapped.points = stats['PTS']
      if (stats['REB'] !== undefined) mapped.rebounds = stats['REB']
      if (stats['AST'] !== undefined) mapped.assists = stats['AST']
      if (stats['3PM'] !== undefined) mapped.threes = stats['3PM']
      if (stats['STL'] !== undefined) mapped.steals = stats['STL']
      if (stats['BLK'] !== undefined) mapped.blocks = stats['BLK']
      if (stats['TO'] !== undefined) mapped.turnovers = stats['TO']
      if (stats['MIN'] !== undefined) mapped.minutes = stats['MIN']
      // Combo stats
      mapped.pts_reb_ast = (stats['PTS'] ?? 0) + (stats['REB'] ?? 0) + (stats['AST'] ?? 0)
      mapped.pts_reb = (stats['PTS'] ?? 0) + (stats['REB'] ?? 0)
      mapped.pts_ast = (stats['PTS'] ?? 0) + (stats['AST'] ?? 0)
      mapped.reb_ast = (stats['REB'] ?? 0) + (stats['AST'] ?? 0)
      // Double-double: 1 if at least 2 of PTS/REB/AST/STL/BLK ≥ 10
      const ddCats = [stats['PTS'] ?? 0, stats['REB'] ?? 0, stats['AST'] ?? 0, stats['STL'] ?? 0, stats['BLK'] ?? 0]
      mapped.double_double = ddCats.filter(v => v >= 10).length >= 2 ? 1 : 0

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
        stats: mapped,
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

      // Map ESPN labels → internal stat keys (must match statLabels in design-tokens.ts)
      const mapped: Record<string, number> = { ...stats }
      if (stats['H'] !== undefined) mapped.hits = stats['H']
      if (stats['HR'] !== undefined) mapped.home_runs = stats['HR']
      if (stats['RBI'] !== undefined) mapped.rbis = stats['RBI']
      if (stats['R'] !== undefined) mapped.runs = stats['R']
      if (stats['SB'] !== undefined) mapped.stolen_bases = stats['SB']
      if (stats['TB'] !== undefined) mapped.total_bases = stats['TB']
      if (stats['K'] !== undefined) mapped.strikeouts_pitcher = stats['K']
      if (stats['BB'] !== undefined) mapped.walks_pitcher = stats['BB']
      if (stats['ER'] !== undefined) mapped.earned_runs = stats['ER']
      if (stats['HA'] !== undefined) mapped.hits_allowed = stats['HA']
      if (stats['IP'] !== undefined) mapped.innings_pitched = stats['IP']
      if (stats['OUTS'] !== undefined) mapped.outs_recorded = stats['OUTS']

      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as any)?.abbreviation as string ?? ''
      const date = (meta?.gameDate as string) ?? ''
      const isHome = (meta?.homeAway as string) === 'home'

      entries.push({
        date,
        opponent,
        isHome,
        stats: mapped,
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

// ── NFL Parser ──

async function parseNFLGameLogs(playerId: string): Promise<GameLog[]> {
  const raw = await fetchNFLAthleteGameLog(playerId) as any

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
        // NFL stats: C/ATT format for passing
        if (val.includes('/') && !val.startsWith('/')) {
          const [made, attempted] = val.split('/').map(Number)
          if (label === 'C/ATT') {
            stats.completions = made || 0
            stats.passAtt = attempted || 0
          }
          stats[label] = made || 0
        } else {
          stats[label] = Number(val) || 0
        }
      })

      // Map ESPN labels → internal stat keys (must match statLabels in design-tokens.ts)
      const mapped: Record<string, number> = { ...stats }
      if (stats['YDS'] !== undefined) mapped.passing_yards = stats['YDS']
      if (stats['TD'] !== undefined) mapped.passing_tds = stats['TD']
      if (stats['RUSH YDS'] !== undefined) mapped.rushing_yards = stats['RUSH YDS']
      if (stats['RUSH TD'] !== undefined) mapped.rushing_tds = stats['RUSH TD']
      if (stats['REC'] !== undefined) mapped.receptions = stats['REC']
      if (stats['REC YDS'] !== undefined) mapped.receiving_yards = stats['REC YDS']
      if (stats['REC TD'] !== undefined) mapped.receiving_tds = stats['REC TD']
      if (stats['INT'] !== undefined) mapped.interceptions = stats['INT']
      if (stats['completions'] !== undefined) mapped.completions = stats['completions']
      // Fantasy points approximation
      mapped.fantasy_points = ((stats['YDS'] ?? 0) * 0.04) + ((stats['TD'] ?? 0) * 4) +
        ((stats['RUSH YDS'] ?? 0) * 0.1) + ((stats['RUSH TD'] ?? 0) * 6) +
        ((stats['REC'] ?? 0) * 1) + ((stats['REC YDS'] ?? 0) * 0.1) + ((stats['REC TD'] ?? 0) * 6) -
        ((stats['INT'] ?? 0) * 2)

      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as any)?.abbreviation as string ?? ''
      const date = (meta?.gameDate as string) ?? ''
      const isHome = (meta?.homeAway as string) === 'home'

      entries.push({
        date,
        opponent,
        isHome,
        stats: mapped,
        opponentDefRank: 0,
        isBackToBack: false,
        restDays: 7, // NFL is weekly
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
