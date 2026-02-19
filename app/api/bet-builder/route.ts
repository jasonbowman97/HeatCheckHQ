// ============================================================
// api/bet-builder/route.ts — Prop recommendations by sport + confidence
// ============================================================
// GET: Returns ranked props for the bet builder wizard.

import { NextRequest, NextResponse } from 'next/server'
import { buildSituationRoom } from '@/lib/situation-room-service'
import { getRecommendedProps } from '@/lib/bet-builder-service'
import { getNBAScoreboard, type NBAScheduleGame } from '@/lib/nba-api'
import { fetchMLBScoreboard, fetchNFLScoreboard } from '@/lib/espn/client'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { Sport, Game } from '@/types/shared'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport
  const confidence = (searchParams.get('confidence') ?? 'any') as 'high' | 'medium' | 'any'

  try {
    // Fetch today's games
    const games = await fetchGames(sport)

    // Build situation room to get all available props
    const state = buildSituationRoom({
      sport,
      date: new Date().toISOString().slice(0, 10),
      games,
    })

    // Collect all props from all games
    const allProps = state.games.flatMap(g => g.topProps)

    // Get recommendations
    const result = getRecommendedProps({ sport, confidence, availableProps: allProps })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': cacheHeader(CACHE.LIVE) },
    })
  } catch (error) {
    console.error('[bet-builder] Error:', error)
    return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 })
  }
}

async function fetchGames(sport: Sport): Promise<Game[]> {
  switch (sport) {
    case 'nba': {
      const games = await getNBAScoreboard()
      return games.map(g => ({
        id: g.id, sport: 'nba' as const, date: g.date,
        homeTeam: { id: g.homeTeam.id, abbrev: g.homeTeam.abbreviation, name: g.homeTeam.displayName, logo: g.homeTeam.logo },
        awayTeam: { id: g.awayTeam.id, abbrev: g.awayTeam.abbreviation, name: g.awayTeam.displayName, logo: g.awayTeam.logo },
        venue: g.venue,
        spread: g.odds ? parseSpread(g.odds.details) : undefined,
        total: g.odds?.overUnder,
      }))
    }
    case 'mlb': {
      const raw = await fetchMLBScoreboard()
      return ((raw as any).events ?? []).map((ev: any) => espnToGame('mlb', ev))
    }
    case 'nfl': {
      const raw = await fetchNFLScoreboard()
      return ((raw as any).events ?? []).map((ev: any) => espnToGame('nfl', ev))
    }
    default:
      return []
  }
}

function espnToGame(sport: Sport, ev: any): Game {
  const comp = ev.competitions?.[0]
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const odds = comp?.odds?.[0]
  return {
    id: ev.id ?? '', sport, date: ev.date ?? '',
    homeTeam: { id: home?.team?.id ?? '', abbrev: home?.team?.abbreviation ?? '', name: home?.team?.displayName ?? '', logo: home?.team?.logo ?? '' },
    awayTeam: { id: away?.team?.id ?? '', abbrev: away?.team?.abbreviation ?? '', name: away?.team?.displayName ?? '', logo: away?.team?.logo ?? '' },
    venue: comp?.venue?.fullName ?? '',
    spread: odds ? parseSpread(odds.details ?? '') : undefined,
    total: odds?.overUnder,
  }
}

function parseSpread(details: string): number | undefined {
  const match = details?.match(/([-+]?\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : undefined
}
