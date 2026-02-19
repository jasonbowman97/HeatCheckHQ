// ============================================================
// app/api/strategies/route.ts — Community strategies list + publish
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/get-user-tier'
import { cacheHeader, CACHE } from '@/lib/cache'
import { mapRowToStrategy, validateForPublishing, sortStrategies } from '@/lib/community-service'
import type { LeaderboardSort } from '@/lib/community-service'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sport = url.searchParams.get('sport') ?? undefined
  const sort = (url.searchParams.get('sort') ?? 'hot') as LeaderboardSort
  const authorId = url.searchParams.get('authorId') ?? undefined
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100)
  const offset = Number(url.searchParams.get('offset') ?? '0')

  const supabase = await createClient()

  let query = supabase
    .from('public_strategies')
    .select('*')
    .eq('is_published', true)

  if (sport) query = query.eq('sport', sport)
  if (authorId) query = query.eq('author_id', authorId)

  // Fetch more than needed for client-side sort
  query = query.range(offset, offset + limit + 50 - 1)

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 })
  }

  const strategies = (rows ?? []).map(mapRowToStrategy)
  const sorted = sortStrategies(strategies, sort).slice(0, limit)

  return NextResponse.json({ strategies: sorted }, {
    headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tier = await getUserTier()
  if (tier !== 'pro') {
    return NextResponse.json({ error: 'Pro required to publish strategies' }, { status: 403 })
  }

  const body = await req.json()

  // Validate
  const validation = validateForPublishing(body)
  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', errors: validation.errors, warnings: validation.warnings }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('public_strategies')
    .insert({
      author_id: user.id,
      author_display_name: body.authorName ?? user.email?.split('@')[0] ?? 'Anonymous',
      name: body.name,
      description: body.description,
      sport: body.sport,
      prop_type: body.propType ?? null,
      direction: body.direction ?? 'both',
      conditions_json: JSON.stringify(body.conditions),
      tags: JSON.stringify(body.tags),
      backtest_json: JSON.stringify(body.backtest),
      live_performance_json: JSON.stringify(body.livePerformance ?? { season: '', games: 0, hits: 0, hitRate: 0, roi: 0, lastMatchDate: '' }),
      equity_sparkline_json: JSON.stringify(body.equitySparkline ?? []),
      forked_from_id: body.forkedFromId ?? null,
      is_published: true,
      published_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to publish strategy' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, warnings: validation.warnings })
}
