// ============================================================
// api/bet-boards/route.ts — Board CRUD
// ============================================================
// GET: List user's boards. POST: Create a new board.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/get-user-tier'
import { cacheHeader, CACHE } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get boards where user is a member
  const { data: memberships } = await supabase
    .from('bet_board_members')
    .select('board_id')
    .eq('user_id', user.id)

  const boardIds = (memberships ?? []).map(m => m.board_id)

  if (boardIds.length === 0) {
    return NextResponse.json({ boards: [] }, {
      headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
    })
  }

  const { data: boards, error } = await supabase
    .from('bet_boards')
    .select('*')
    .in('id', boardIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[bet-boards] GET error:', error)
    return NextResponse.json({ error: 'Failed to load boards' }, { status: 500 })
  }

  return NextResponse.json({ boards: boards ?? [] }, {
    headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tier = await getUserTier()
  if (tier !== 'pro') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const body = await req.json()
  const { name, sport, isPublic } = body

  if (!name) {
    return NextResponse.json({ error: 'Board name required' }, { status: 400 })
  }

  // Create board
  const { data: board, error } = await supabase
    .from('bet_boards')
    .insert({
      name,
      created_by: user.id,
      sport: sport ?? null,
      is_public: isPublic ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('[bet-boards] POST error:', error)
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
  }

  // Add creator as owner member
  await supabase.from('bet_board_members').insert({
    board_id: board.id,
    user_id: user.id,
    display_name: user.email?.split('@')[0] ?? 'Owner',
    role: 'owner',
  })

  return NextResponse.json({ board }, { status: 201 })
}
