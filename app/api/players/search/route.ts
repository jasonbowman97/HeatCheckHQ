// ============================================================
// app/api/players/search/route.ts — Fuzzy player search
// ============================================================
// Returns player suggestions for the prop input autocomplete.
// Searches across all sports (NBA, MLB, NFL) with today's game info.

import { NextResponse, type NextRequest } from 'next/server'
import type { PlayerSearchResult, Sport } from '@/types/shared'
import { searchPlayers } from '@/lib/player-service'
import { getNBAScoreboard } from '@/lib/nba-api'
import { fetchMLBScoreboard } from '@/lib/espn/client'

export const revalidate = 3600 // 1 hour — player index changes rarely

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const sport = searchParams.get('sport') as Sport | null
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 25)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const players = await searchPlayers(query, sport ?? undefined, limit)

    // Enrich with today's game info
    const todayTeams = await getTodayTeams(sport)

    const results: PlayerSearchResult[] = players.map(p => {
      const teamGame = todayTeams.get(p.team.abbrev)
      return {
        ...p,
        hasGameToday: !!teamGame,
        todaysOpponent: teamGame?.opponent,
        todaysGameTime: teamGame?.gameTime,
      }
    })

    // Sort: players with games today first
    results.sort((a, b) => {
      if (a.hasGameToday && !b.hasGameToday) return -1
      if (!a.hasGameToday && b.hasGameToday) return 1
      return 0
    })

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } },
    )
  } catch (error) {
    console.error('[Player Search] Error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}

// ── Today's schedule lookup ──

interface TeamGameInfo {
  opponent: string
  gameTime: string
}

// Cache today's team schedule across requests
let cachedTeamGames: { data: Map<string, TeamGameInfo>; date: string } | null = null

async function getTodayTeams(sport?: Sport | null): Promise<Map<string, TeamGameInfo>> {
  const today = new Date().toISOString().slice(0, 10)
  if (cachedTeamGames?.date === today) return cachedTeamGames.data

  const map = new Map<string, TeamGameInfo>()

  try {
    if (!sport || sport === 'nba') {
      const games = await getNBAScoreboard()
      for (const g of games) {
        map.set(g.homeTeam.abbreviation, {
          opponent: `vs ${g.awayTeam.abbreviation}`,
          gameTime: g.date,
        })
        map.set(g.awayTeam.abbreviation, {
          opponent: `@ ${g.homeTeam.abbreviation}`,
          gameTime: g.date,
        })
      }
    }

    if (!sport || sport === 'mlb') {
      const raw = await fetchMLBScoreboard()
      const events = ((raw as any).events ?? []) as any[]
      for (const evt of events) {
        const comp = evt.competitions?.[0]
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
        if (away?.team && home?.team) {
          map.set(home.team.abbreviation, {
            opponent: `vs ${away.team.abbreviation}`,
            gameTime: evt.date ?? '',
          })
          map.set(away.team.abbreviation, {
            opponent: `@ ${home.team.abbreviation}`,
            gameTime: evt.date ?? '',
          })
        }
      }
    }
  } catch {
    // Non-critical — return empty map if schedule fetch fails
  }

  cachedTeamGames = { data: map, date: today }
  return map
}
