// ============================================================
// api/bet-boards/[id]/members/route.ts — Member management
// ============================================================
// GET: List members. POST: Add member (invite).

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
    .from('bet_board_members')
    .select('*')
    .eq('board_id', boardId)

  if (error) {
    console.error('[bet-board-members] GET error:', error)
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
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

  // Check the requester is an owner/editor
  const { data: membership } = await supabase
    .from('bet_board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'viewer') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, displayName, role } = body

  if (!userId || !displayName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bet_board_members')
    .insert({
      board_id: boardId,
      user_id: userId,
      display_name: displayName,
      role: role ?? 'editor',
    })

  if (error) {
    console.error('[bet-board-members] POST error:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
