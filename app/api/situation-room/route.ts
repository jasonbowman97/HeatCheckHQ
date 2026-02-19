// ============================================================
// api/situation-room/route.ts — Situation Room GET endpoint
// ============================================================
// Returns today's games with top convergence props, alerts,
// and weather data for a given sport.

import { NextRequest, NextResponse } from 'next/server'
import { getNBAScoreboard, type NBAScheduleGame } from '@/lib/nba-api'
import { fetchMLBScoreboard, fetchNFLScoreboard } from '@/lib/espn/client'
import { getAllGameWeather } from '@/lib/weather-api'
import { buildSituationRoom } from '@/lib/situation-room-service'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { Sport, Game } from '@/types/shared'
import type { SituationRoomProp, WeatherAlert } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport
  const date = searchParams.get('date') ?? undefined

  try {
    // Fetch today's games for the sport
    const games = await fetchGames(sport, date)

    // Build the situation room state
    const state = buildSituationRoom({
      sport,
      date: date ?? new Date().toISOString().slice(0, 10),
      games,
    })

    // Enrich with weather data for MLB
    if (sport === 'mlb' && games.length > 0) {
      const homeTeams = games.map(g => g.homeTeam.abbrev)
      const weatherData = await getAllGameWeather(homeTeams).catch(() => ({}))

      state.weatherAlerts = Object.entries(weatherData)
        .filter(([, w]) => w != null)
        .map(([team, w]): WeatherAlert => {
          const game = games.find(g => g.homeTeam.abbrev === team)
          const normalized: WeatherLike = {
            temp: w.temperature,
            windSpeed: w.windSpeed,
            humidity: w.humidity,
            condition: w.condition,
            windDir: w.windDirection,
          }
          return {
            gameId: game?.id ?? '',
            venue: game?.venue ?? '',
            condition: w.condition ?? 'Unknown',
            temp: w.temperature ?? 0,
            wind: w.windSpeed ?? 0,
            windDirection: w.windDirection ?? '',
            impactLevel: assessWeatherImpact(normalized),
            affectedStats: getAffectedStats(normalized),
          }
        })
    }

    return NextResponse.json(state, {
      headers: { 'Cache-Control': cacheHeader(CACHE.LIVE) },
    })
  } catch (error) {
    console.error('[situation-room] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load Situation Room' },
      { status: 500 }
    )
  }
}

// ── Game Fetchers ──

async function fetchGames(sport: Sport, date?: string): Promise<Game[]> {
  switch (sport) {
    case 'nba':
      return fetchNBAGames(date)
    case 'mlb':
      return fetchMLBGames(date)
    case 'nfl':
      return fetchNFLGames(date)
    default:
      return []
  }
}

async function fetchNBAGames(date?: string): Promise<Game[]> {
  const games = await getNBAScoreboard(date)
  return games.map(nbaToGame)
}

function nbaToGame(g: NBAScheduleGame): Game {
  return {
    id: g.id,
    sport: 'nba',
    date: g.date,
    status: parseGameStatus(g.status),
    homeTeam: {
      id: g.homeTeam.id,
      abbrev: g.homeTeam.abbreviation,
      name: g.homeTeam.displayName,
      logo: g.homeTeam.logo,
    },
    awayTeam: {
      id: g.awayTeam.id,
      abbrev: g.awayTeam.abbreviation,
      name: g.awayTeam.displayName,
      logo: g.awayTeam.logo,
    },
    venue: g.venue,
    broadcast: g.broadcast,
    spread: g.odds ? parseSpread(g.odds.details) : undefined,
    total: g.odds?.overUnder,
  }
}

async function fetchMLBGames(date?: string): Promise<Game[]> {
  const raw = await fetchMLBScoreboard(date)
  const events = ((raw as any).events ?? []) as any[]
  return events.map(espnEventToGame.bind(null, 'mlb'))
}

async function fetchNFLGames(date?: string): Promise<Game[]> {
  const raw = await fetchNFLScoreboard(date)
  const events = ((raw as any).events ?? []) as any[]
  return events.map(espnEventToGame.bind(null, 'nfl'))
}

function espnEventToGame(sport: Sport, ev: any): Game {
  const comp = ev.competitions?.[0]
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const odds = comp?.odds?.[0]

  return {
    id: ev.id ?? '',
    sport,
    date: ev.date ?? '',
    status: parseGameStatus(ev.status?.type?.description ?? ''),
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
    venue: comp?.venue?.fullName ?? '',
    broadcast: comp?.broadcasts?.[0]?.names?.[0] ?? '',
    spread: odds ? parseSpread(odds.details ?? '') : undefined,
    total: odds?.overUnder,
  }
}

// ── Helpers ──

function parseGameStatus(status: string): 'scheduled' | 'live' | 'final' {
  const s = status.toLowerCase()
  if (s.includes('final') || s.includes('end')) return 'final'
  if (s.includes('in progress') || s.includes('halftime') || s.includes('half')) return 'live'
  return 'scheduled'
}

function parseSpread(details: string): number | undefined {
  if (!details) return undefined
  const match = details.match(/([-+]?\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : undefined
}

interface WeatherLike {
  temp?: number
  windSpeed?: number
  humidity?: number
  condition?: string
  windDir?: string
}

function assessWeatherImpact(w: WeatherLike): 'high' | 'medium' | 'low' {
  const wind = w.windSpeed ?? 0
  const temp = w.temp ?? 70
  if (wind >= 15 || temp <= 40 || temp >= 100) return 'high'
  if (wind >= 10 || temp <= 50 || temp >= 90) return 'medium'
  return 'low'
}

function getAffectedStats(w: WeatherLike): string[] {
  const stats: string[] = []
  const wind = w.windSpeed ?? 0
  const temp = w.temp ?? 70
  if (wind >= 10) stats.push('HR', 'Total Bases')
  if (temp <= 50) stats.push('Batting Average', 'Runs')
  if (temp >= 90) stats.push('Pitcher Stamina')
  const cond = (w.condition ?? '').toLowerCase()
  if (cond.includes('rain') || cond.includes('storm')) stats.push('Game Delay Risk')
  return stats.length > 0 ? stats : ['Minimal Impact']
}
