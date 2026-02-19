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
import { searchPlayers } from '@/lib/player-service'
import { fetchAndParseGameLogs } from '@/lib/gamelog-parser'
import { evaluate as evaluateConvergence } from '@/lib/convergence-engine'
import { resolveDefenseRanking } from '@/lib/defense-service'
import { statLabels } from '@/lib/design-tokens'
import { mean } from '@/lib/math-utils'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { Sport, Game, Player, SeasonStats } from '@/types/shared'
import type { SituationRoomProp, WeatherAlert } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'

// Primary stats to evaluate per sport (top 3 for speed)
const PRIMARY_STATS: Record<Sport, string[]> = {
  nba: ['points', 'rebounds', 'assists'],
  mlb: ['hits', 'home_runs', 'strikeouts_pitcher'],
  nfl: ['passing_yards', 'rushing_yards', 'receiving_yards'],
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport
  const date = searchParams.get('date') ?? undefined

  try {
    // Fetch today's games for the sport
    const games = await fetchGames(sport, date)

    // Generate convergence props for players in today's games
    const playerProps = await generateGameProps(games, sport)

    // Build the situation room state with real props
    const state = buildSituationRoom({
      sport,
      date: date ?? new Date().toISOString().slice(0, 10),
      games,
      playerProps,
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

// ── Prop Generation ──

async function generateGameProps(games: Game[], sport: Sport): Promise<SituationRoomProp[]> {
  if (games.length === 0) return []

  const allProps: SituationRoomProp[] = []
  const stats = PRIMARY_STATS[sport] ?? []
  const PLAYERS_PER_TEAM = 3

  // Process games in batches of 3 to avoid overwhelming ESPN
  const GAME_BATCH = 3
  for (let gi = 0; gi < games.length; gi += GAME_BATCH) {
    const gameBatch = games.slice(gi, gi + GAME_BATCH)

    await Promise.all(gameBatch.map(async (game) => {
      try {
        // Get top players from each team
        const [homePlayers, awayPlayers] = await Promise.all([
          searchPlayers(game.homeTeam.abbrev, sport, PLAYERS_PER_TEAM).catch(() => []),
          searchPlayers(game.awayTeam.abbrev, sport, PLAYERS_PER_TEAM).catch(() => []),
        ])

        const gamePlayers = [...homePlayers, ...awayPlayers]

        // Process players in parallel
        const playerResults = await Promise.allSettled(
          gamePlayers.map(async (player) => {
            try {
              const gameLogs = await fetchAndParseGameLogs(player.id, sport)
              if (gameLogs.length < 5) return []

              const props: SituationRoomProp[] = []

              for (const stat of stats) {
                const values = gameLogs.map(g => g.stats[stat] ?? 0)
                const avg = values.length > 0 ? mean(values) : 0
                if (avg === 0) continue

                // Use season avg as the "line" for convergence evaluation
                const line = Math.round(avg * 2) / 2 // Round to nearest 0.5

                const seasonStats: SeasonStats = {
                  playerId: player.id,
                  sport,
                  stat,
                  average: avg,
                  gamesPlayed: gameLogs.length,
                  total: values.reduce((a, b) => a + b, 0),
                  high: Math.max(...values),
                  low: Math.min(...values),
                }

                const defenseRanking = await resolveDefenseRanking(player, game, stat)

                const result = evaluateConvergence(
                  player, game, gameLogs, seasonStats, defenseRanking, stat, line,
                )

                const direction = result.overCount >= result.underCount ? 'over' : 'under'
                const convergenceScore = Math.max(result.overCount, result.underCount)

                // Only include meaningful convergence (4+/7)
                if (convergenceScore >= 4) {
                  const topFactors = result.factors
                    .filter(f => f.signal === direction)
                    .sort((a, b) => b.strength - a.strength)
                    .slice(0, 3)
                    .map(f => f.name)

                  props.push({
                    playerId: player.id,
                    playerName: player.name,
                    team: player.team.abbrev,
                    stat,
                    line,
                    convergenceScore,
                    direction: direction as 'over' | 'under',
                    confidence: convergenceScore / 7,
                    topFactors,
                  })
                }
              }

              return props
            } catch {
              return []
            }
          })
        )

        for (const result of playerResults) {
          if (result.status === 'fulfilled') {
            allProps.push(...result.value)
          }
        }
      } catch {
        // Skip game on error
      }
    }))
  }

  return allProps.sort((a, b) => b.convergenceScore - a.convergenceScore)
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
