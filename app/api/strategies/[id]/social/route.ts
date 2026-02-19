// ============================================================
// app/api/strategies/[id]/social/route.ts — Vote, follow, fork
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: strategyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const action = body.action as 'vote' | 'follow' | 'unfollow' | 'fork'

  switch (action) {
    case 'vote': {
      const vote = body.vote as 1 | -1
      if (vote !== 1 && vote !== -1) {
        return NextResponse.json({ error: 'Vote must be 1 or -1' }, { status: 400 })
      }

      // Upsert vote
      const { data: existing } = await supabase
        .from('strategy_votes')
        .select('vote')
        .eq('strategy_id', strategyId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        if (existing.vote === vote) {
          // Remove vote (toggle off)
          await supabase
            .from('strategy_votes')
            .delete()
            .eq('strategy_id', strategyId)
            .eq('user_id', user.id)

          // Decrement by vote value
          await supabase.rpc('adjust_strategy_vote_score', { sid: strategyId, delta: -vote })
        } else {
          // Change vote direction
          await supabase
            .from('strategy_votes')
            .update({ vote })
            .eq('strategy_id', strategyId)
            .eq('user_id', user.id)

          await supabase.rpc('adjust_strategy_vote_score', { sid: strategyId, delta: vote * 2 })
        }
      } else {
        // New vote
        await supabase
          .from('strategy_votes')
          .insert({ strategy_id: strategyId, user_id: user.id, vote })

        await supabase.rpc('adjust_strategy_vote_score', { sid: strategyId, delta: vote })
      }

      return NextResponse.json({ ok: true })
    }

    case 'follow': {
      await supabase
        .from('strategy_follows')
        .upsert({ strategy_id: strategyId, user_id: user.id, created_at: new Date().toISOString() })

      await supabase.rpc('increment_strategy_counter', { strategy_id: strategyId, counter_name: 'follower_count' })
      return NextResponse.json({ ok: true })
    }

    case 'unfollow': {
      await supabase
        .from('strategy_follows')
        .delete()
        .eq('strategy_id', strategyId)
        .eq('user_id', user.id)

      await supabase.rpc('decrement_strategy_counter', { strategy_id: strategyId, counter_name: 'follower_count' })
      return NextResponse.json({ ok: true })
    }

    case 'fork': {
      // Copy strategy for the user
      const { data: original } = await supabase
        .from('public_strategies')
        .select('*')
        .eq('id', strategyId)
        .single()

      if (!original) {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
      }

      const now = new Date().toISOString()
      const { data: forked, error } = await supabase
        .from('public_strategies')
        .insert({
          author_id: user.id,
          author_display_name: user.email?.split('@')[0] ?? 'Anonymous',
          name: `${original.name} (fork)`,
          description: original.description,
          sport: original.sport,
          prop_type: original.prop_type,
          direction: original.direction,
          conditions_json: original.conditions_json,
          tags: original.tags,
          backtest_json: original.backtest_json,
          forked_from_id: strategyId,
          forked_from_name: original.name,
          forked_from_author: original.author_display_name,
          is_published: false,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to fork' }, { status: 500 })
      }

      // Increment fork count on original
      await supabase.rpc('increment_strategy_counter', { strategy_id: strategyId, counter_name: 'fork_count' })

      return NextResponse.json({ forkedId: forked.id })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
