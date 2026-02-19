// ============================================================
// api/matchup-xray/[gameId]/route.ts — Matchup X-Ray API
// ============================================================
// GET: Returns full matchup analysis for a specific game.

import { NextRequest, NextResponse } from 'next/server'
import { buildMatchupXRay } from '@/lib/matchup-xray-service'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { Sport } from '@/types/shared'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params
  const { searchParams } = new URL(req.url)
  const sport = (searchParams.get('sport') ?? 'nba') as Sport

  try {
    const xray = await buildMatchupXRay({ sport, gameId })

    if (!xray) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(xray, {
      headers: { 'Cache-Control': cacheHeader(CACHE.LIVE) },
    })
  } catch (error) {
    console.error('[matchup-xray] Error:', error)
    return NextResponse.json({ error: 'Failed to build matchup analysis' }, { status: 500 })
  }
}
