// ============================================================
// api/correlations/[gameId]/route.ts — Correlation Matrix API
// ============================================================
// GET: Returns prop correlation matrix for a specific game.
// Fetches real game logs for players in the matchup to compute
// pairwise correlations.

import { NextRequest, NextResponse } from 'next/server'
import { computeCorrelationMatrix } from '@/lib/correlation-engine'
import { buildMatchupXRay } from '@/lib/matchup-xray-service'
import { fetchAndParseGameLogs } from '@/lib/gamelog-parser'
import { searchPlayers } from '@/lib/player-service'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { GameLog, Sport } from '@/types/shared'
import type { CorrelationPlayer } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport

  // Stat to correlate — default varies by sport
  const defaultStat = sport === 'nba' ? 'PTS' : sport === 'mlb' ? 'H' : 'passYd'
  const stat = searchParams.get('stat') ?? defaultStat

  try {
    // Get game data to know which teams are playing
    const xray = await buildMatchupXRay({ sport, gameId })
    if (!xray) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Build player list from key matchup players
    const players: CorrelationPlayer[] = []
    const seenIds = new Set<string>()

    // Add key matchup players
    for (const matchup of xray.keyMatchups) {
      for (const p of [matchup.playerA, matchup.playerB]) {
        if (p.id && !seenIds.has(p.id)) {
          seenIds.add(p.id)
          players.push({
            id: p.id,
            name: p.name,
            team: p.team,
            stat,
            line: 0,
          })
        }
      }
    }

    // If matchup data is sparse, supplement with top players from each team
    if (players.length < 4) {
      const homeAbbrev = xray.game.homeTeam.abbrev
      const awayAbbrev = xray.game.awayTeam.abbrev

      // Search for common star players by team abbreviation
      for (const abbrev of [homeAbbrev, awayAbbrev]) {
        try {
          const teamPlayers = await searchPlayers(abbrev, sport, 4)
          for (const p of teamPlayers) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id)
              players.push({
                id: p.id,
                name: p.name,
                team: p.team.abbrev,
                stat,
                line: 0,
              })
            }
          }
        } catch { /* skip */ }
      }
    }

    // Fetch game logs for all players in parallel
    const historicalLogs: Record<string, GameLog[]> = {}
    const logResults = await Promise.allSettled(
      players.map(async p => {
        const logs = await fetchAndParseGameLogs(p.id, sport)
        return { id: p.id, logs }
      })
    )

    for (const result of logResults) {
      if (result.status === 'fulfilled' && result.value.logs.length > 0) {
        historicalLogs[result.value.id] = result.value.logs
      }
    }

    // Compute correlation matrix with real data
    const matrix = computeCorrelationMatrix({
      sport,
      date: new Date().toISOString().slice(0, 10),
      gameId,
      players,
      historicalLogs,
    })

    return NextResponse.json(matrix, {
      headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
    })
  } catch (error) {
    console.error('[correlations] Error:', error)
    return NextResponse.json({ error: 'Failed to compute correlations' }, { status: 500 })
  }
}
