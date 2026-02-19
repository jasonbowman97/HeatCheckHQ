// ============================================================
// api/what-if/route.ts — What-If scenario simulation
// ============================================================
// POST: Receives a scenario and returns modified convergence results.
// Requires authentication (free or pro).

import { NextRequest, NextResponse } from 'next/server'
import { getUserTier } from '@/lib/get-user-tier'
import { simulate } from '@/lib/what-if-simulator'
import type { WhatIfModification } from '@/types/innovation-playbook'
import type { Player, Game, GameLog, SeasonStats, DefenseRanking } from '@/types/shared'

export async function POST(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (userTier !== 'pro') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      player,
      game,
      gameLogs,
      seasonStats,
      defenseRanking,
      stat,
      originalLine,
      modifications,
    } = body as {
      player: Player
      game: Game
      gameLogs: GameLog[]
      seasonStats: SeasonStats
      defenseRanking: DefenseRanking
      stat: string
      originalLine: number
      modifications: WhatIfModification[]
    }

    if (!player || !game || !gameLogs || !seasonStats || !defenseRanking || !stat || originalLine == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = simulate({
      player,
      game,
      gameLogs,
      seasonStats,
      defenseRanking,
      stat,
      originalLine,
      modifications,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[what-if] Error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
