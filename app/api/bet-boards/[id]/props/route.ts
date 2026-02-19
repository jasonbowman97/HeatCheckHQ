// ============================================================
// api/bet-boards/[id]/props/route.ts — Board prop management
// ============================================================
// GET: List props for board. POST: Add prop. PATCH: Vote/result.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: boardId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('bet_board_props')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[bet-board-props] GET error:', error)
    return NextResponse.json({ error: 'Failed to load props' }, { status: 500 })
  }

  return NextResponse.json({ props: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: boardId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { playerName, playerId, team, stat, line, direction, convergenceScore, confidence, note } = body

  if (!playerName || !stat || line == null || !direction) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bet_board_props')
    .insert({
      board_id: boardId,
      added_by: user.id,
      added_by_name: user.email?.split('@')[0] ?? 'Unknown',
      player_id: playerId ?? '',
      player_name: playerName,
      team: team ?? '',
      stat,
      line,
      direction,
      convergence_score: convergenceScore,
      confidence,
      note,
      votes_json: [],
    })
    .select()
    .single()

  if (error) {
    console.error('[bet-board-props] POST error:', error)
    return NextResponse.json({ error: 'Failed to add prop' }, { status: 500 })
  }

  return NextResponse.json({ prop: data }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _boardId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { propId, vote, result, actualValue } = body

  if (!propId) {
    return NextResponse.json({ error: 'Missing propId' }, { status: 400 })
  }

  // Fetch current prop
  const { data: prop } = await supabase
    .from('bet_board_props')
    .select('*')
    .eq('id', propId)
    .single()

  if (!prop) {
    return NextResponse.json({ error: 'Prop not found' }, { status: 404 })
  }

  const updates: Record<string, any> = {}

  // Handle vote
  if (vote) {
    const votes = (prop.votes_json ?? []) as Array<{ userId: string; vote: string }>
    const existing = votes.findIndex(v => v.userId === user.id)
    if (existing >= 0) {
      votes[existing].vote = vote
    } else {
      votes.push({ userId: user.id, vote })
    }
    updates.votes_json = votes
  }

  // Handle result
  if (result !== undefined) {
    updates.result = result
  }
  if (actualValue !== undefined) {
    updates.actual_value = actualValue
  }

  const { error } = await supabase
    .from('bet_board_props')
    .update(updates)
    .eq('id', propId)

  if (error) {
    console.error('[bet-board-props] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update prop' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
