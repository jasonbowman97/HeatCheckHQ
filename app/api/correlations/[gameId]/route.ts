// ============================================================
// api/correlations/[gameId]/route.ts — Correlation Matrix API
// ============================================================
// GET: Returns prop correlation matrix for a specific game.

import { NextRequest, NextResponse } from 'next/server'
import { computeCorrelationMatrix } from '@/lib/correlation-engine'
import { buildMatchupXRay } from '@/lib/matchup-xray-service'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { Sport } from '@/types/shared'
import type { CorrelationPlayer } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport

  try {
    // Get game data to know which teams are playing
    const xray = await buildMatchupXRay({ sport, gameId })
    if (!xray) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Build player list from key matchup players + leaders
    const players: CorrelationPlayer[] = []
    const seenIds = new Set<string>()

    for (const matchup of xray.keyMatchups) {
      for (const p of [matchup.playerA, matchup.playerB]) {
        if (p.id && !seenIds.has(p.id)) {
          seenIds.add(p.id)
          players.push({
            id: p.id,
            name: p.name,
            team: p.team,
            stat: 'pts',
            line: 0,
          })
        }
      }
    }

    // Compute correlation matrix
    // In production, historicalLogs would come from gamelog-parser
    // For now, we return the structure with empty logs (no correlations computed)
    const matrix = computeCorrelationMatrix({
      sport,
      date: new Date().toISOString().slice(0, 10),
      gameId,
      players,
      historicalLogs: {},
    })

    return NextResponse.json(matrix, {
      headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
    })
  } catch (error) {
    console.error('[correlations] Error:', error)
    return NextResponse.json({ error: 'Failed to compute correlations' }, { status: 500 })
  }
}
