// ============================================================
// api/graveyard/autopsy/route.ts — Generate bet autopsy
// ============================================================
// POST: Analyzes a missed bet and returns root causes + grade.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/get-user-tier'
import { generateAutopsy } from '@/lib/graveyard-service'

export const dynamic = 'force-dynamic'

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
  const {
    playerName,
    stat,
    line,
    direction,
    actualValue,
    convergenceAtTimeOfBet,
    minutesPlayed,
    teamResult,
    finalMargin,
    wasBlowout,
    hadInjuryDuringGame,
    hadLineupChange,
    isBackToBack,
  } = body

  if (!playerName || !stat || line == null || !direction || actualValue == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const autopsy = generateAutopsy({
    playerName,
    stat,
    line,
    direction,
    actualValue,
    convergenceAtTimeOfBet: convergenceAtTimeOfBet ?? 0,
    minutesPlayed,
    teamResult,
    finalMargin,
    wasBlowout,
    hadInjuryDuringGame,
    hadLineupChange,
    isBackToBack,
  })

  return NextResponse.json({ autopsy })
}
