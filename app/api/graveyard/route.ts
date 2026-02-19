// ============================================================
// api/graveyard/route.ts — Graveyard CRUD
// ============================================================
// GET: List user's graveyard entries
// POST: Add a new entry (missed bet)
// DELETE: Remove an entry

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/get-user-tier'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { GraveyardEntry } from '@/types/innovation-playbook'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tier = await getUserTier()

  const { data, error } = await supabase
    .from('graveyard_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(tier === 'pro' ? 100 : 10)

  if (error) {
    console.error('[graveyard] GET error:', error)
    return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 })
  }

  const entries: GraveyardEntry[] = (data ?? []).map(mapRowToEntry)

  return NextResponse.json({ entries }, {
    headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { playerName, playerId, sport, stat, line, direction, actualValue, convergenceAtTimeOfBet, autopsy } = body

  if (!playerName || !stat || line == null || !direction || actualValue == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const margin = direction === 'over'
    ? actualValue - line
    : line - actualValue

  const { data, error } = await supabase
    .from('graveyard_entries')
    .insert({
      user_id: user.id,
      player_id: playerId ?? '',
      player_name: playerName,
      sport: sport ?? 'nba',
      stat,
      line,
      direction,
      actual_value: actualValue,
      margin,
      convergence_at_bet: convergenceAtTimeOfBet ?? 0,
      autopsy_json: autopsy ?? null,
      date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) {
    console.error('[graveyard] POST error:', error)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }

  return NextResponse.json({ entry: mapRowToEntry(data) }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('graveyard_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[graveyard] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function mapRowToEntry(row: any): GraveyardEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    playerId: row.player_id,
    playerName: row.player_name,
    sport: row.sport,
    stat: row.stat,
    line: row.line,
    direction: row.direction,
    actualValue: row.actual_value,
    margin: row.margin,
    convergenceAtTimeOfBet: row.convergence_at_bet,
    result: 'miss',
    autopsy: row.autopsy_json ?? {
      rootCauses: [],
      processGrade: 'C',
      processAssessment: 'No autopsy generated',
      wasUnlucky: false,
      unluckScore: 50,
      wouldBetAgain: false,
      lessonsLearned: [],
    },
  }
}
