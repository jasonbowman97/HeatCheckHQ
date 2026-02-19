// ============================================================
// app/api/narratives/[playerId]/route.ts — Player narrative timeline
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheHeader, CACHE } from '@/lib/cache'
import {
  mapRowToTimelineEntry,
  computeNarrativePerformance,
  sortTimeline,
} from '@/lib/narrative-timeline-service'

export async function GET(req: Request, { params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200)

  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('narrative_timeline')
    .select('*')
    .eq('player_id', playerId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch narratives' }, { status: 500 })
  }

  const entries = (rows ?? []).map(mapRowToTimelineEntry)
  const timeline = sortTimeline(entries)
  const performance = computeNarrativePerformance(entries)

  return NextResponse.json({
    playerId,
    timeline,
    performance,
    total: entries.length,
  }, {
    headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
  })
}
