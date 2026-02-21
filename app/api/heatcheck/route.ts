// ============================================================
// app/api/heatcheck/route.ts — The HeatCheck API endpoint
// ============================================================
// GET /api/heatcheck?sport=nba
// Returns today's top picks for a given sport.
// Pro tier only. 5-minute ISR cache.

import { NextResponse, type NextRequest } from 'next/server'
import type { Sport } from '@/types/shared'
import { generateHeatCheckBoard } from '@/lib/heatcheck-service'
import { getUserTier } from '@/lib/get-user-tier'

export const revalidate = 300 // 5-minute CDN cache

const VALID_SPORTS: Sport[] = ['nba', 'mlb', 'nfl']

export async function GET(req: NextRequest) {
  try {
    const sport = req.nextUrl.searchParams.get('sport') as Sport | null

    if (!sport || !VALID_SPORTS.includes(sport)) {
      return NextResponse.json(
        { error: 'invalid_sport', message: 'Sport parameter is required (nba, mlb, nfl)' },
        { status: 400 },
      )
    }

    // Pro tier gate
    const userTier = await getUserTier()
    if (userTier !== 'pro') {
      return NextResponse.json(
        { error: 'pro_required', message: 'The HeatCheck requires a Pro subscription' },
        { status: 403 },
      )
    }

    const result = await generateHeatCheckBoard(sport)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('[HeatCheck] Unexpected error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
