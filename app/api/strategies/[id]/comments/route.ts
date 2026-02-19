// ============================================================
// app/api/strategies/[id]/comments/route.ts — Strategy comments
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapRowToComment } from '@/lib/community-service'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('strategy_comments')
    .select('*')
    .eq('strategy_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  const comments = (rows ?? []).map(mapRowToComment)

  // Thread replies under parents
  const topLevel = comments.filter(c => !c.parentId)
  const replyMap = new Map<string, typeof comments>()
  for (const c of comments.filter(c => c.parentId)) {
    const arr = replyMap.get(c.parentId!) ?? []
    arr.push(c)
    replyMap.set(c.parentId!, arr)
  }
  for (const c of topLevel) {
    c.replies = replyMap.get(c.id)
  }

  return NextResponse.json({ comments: topLevel })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const text = (body.body ?? '').trim()
  if (!text || text.length > 1000) {
    return NextResponse.json({ error: 'Comment body required (max 1000 chars)' }, { status: 400 })
  }

  const { error } = await supabase
    .from('strategy_comments')
    .insert({
      strategy_id: id,
      author_id: user.id,
      author_display_name: body.authorName ?? user.email?.split('@')[0] ?? 'Anonymous',
      body: text,
      parent_id: body.parentId ?? null,
      created_at: new Date().toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }

  // Increment comment count
  await supabase.rpc('increment_strategy_counter', { strategy_id: id, counter_name: 'comment_count' })

  return NextResponse.json({ ok: true })
}
