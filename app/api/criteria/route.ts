// ============================================================
// api/criteria/route.ts — Research Criteria CRUD + matching
// ============================================================
// GET: List user's criteria
// POST: Create a new criteria
// PATCH: Update criteria (toggle active, rename, update conditions)
// DELETE: Remove a criteria

import { NextRequest, NextResponse } from 'next/server'
import { getUserTier } from '@/lib/get-user-tier'
import { createClient } from '@/lib/supabase/server'
import type { ResearchCriteria, CriteriaCondition } from '@/types/daily-checkin'

export async function GET(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('research_criteria')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const criteria: ResearchCriteria[] = (data ?? []).map(mapRowToCriteria)

    return NextResponse.json({ criteria })
  } catch (error) {
    console.error('[criteria] GET error:', error)
    return NextResponse.json({ error: 'Failed to load criteria' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { name, sport, stat, direction, conditions } = body

    if (!name || !sport || !stat || !direction || !conditions?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Free users limited to 3 criteria, Pro unlimited
    if (userTier !== 'pro') {
      const { count } = await supabase
        .from('research_criteria')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) >= 3) {
        return NextResponse.json({
          error: 'Free users can create up to 3 criteria. Upgrade to Pro for unlimited.',
        }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('research_criteria')
      .insert({
        user_id: user.id,
        name,
        sport,
        stat,
        direction,
        conditions: JSON.stringify(conditions),
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ criteria: mapRowToCriteria(data) }, { status: 201 })
  } catch (error) {
    console.error('[criteria] POST error:', error)
    return NextResponse.json({ error: 'Failed to create criteria' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Criteria ID required' }, { status: 400 })
    }

    // Build safe update object
    const safeUpdates: Record<string, any> = {}
    if (updates.name !== undefined) safeUpdates.name = updates.name
    if (updates.isActive !== undefined) safeUpdates.is_active = updates.isActive
    if (updates.conditions !== undefined) safeUpdates.conditions = JSON.stringify(updates.conditions)
    if (updates.direction !== undefined) safeUpdates.direction = updates.direction

    const { data, error } = await supabase
      .from('research_criteria')
      .update(safeUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Security: only own criteria
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ criteria: mapRowToCriteria(data) })
  } catch (error) {
    console.error('[criteria] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update criteria' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Criteria ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('research_criteria')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Security: only own criteria

    if (error) throw error

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[criteria] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete criteria' }, { status: 500 })
  }
}

// ── Helpers ──

function mapRowToCriteria(row: any): ResearchCriteria {
  const conditions: CriteriaCondition[] = typeof row.conditions === 'string'
    ? JSON.parse(row.conditions)
    : row.conditions ?? []

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    sport: row.sport,
    stat: row.stat,
    direction: row.direction,
    conditions,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    performance: {
      totalMatches: row.total_matches ?? 0,
      hits: row.hits ?? 0,
      misses: row.misses ?? 0,
      hitRate: row.total_matches > 0 ? (row.hits ?? 0) / row.total_matches : 0,
      avgMargin: row.avg_margin ?? 0,
      lastMatchDate: row.last_match_date ?? '',
    },
  }
}
