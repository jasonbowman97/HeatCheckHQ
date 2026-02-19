// ============================================================
// api/what-if/route.ts — What-If Team Impact Simulator
// ============================================================
// POST: Given a player who is OUT, computes how their absence
// impacts teammate stat projections using historical game logs.

import { NextRequest, NextResponse } from 'next/server'
import { getUserTier } from '@/lib/get-user-tier'
import { resolvePlayerById, searchPlayers } from '@/lib/player-service'
import { fetchAndParseGameLogs } from '@/lib/gamelog-parser'
import type { Sport } from '@/types/shared'

export const dynamic = 'force-dynamic'

interface TeammateImpact {
  id: string
  name: string
  position: string
  headshotUrl: string
  stat: string
  withPlayer: { avg: number; games: number }
  withoutPlayer: { avg: number; games: number }
  delta: number
  deltaPct: number
  direction: 'boost' | 'drop' | 'neutral'
}

export async function POST(req: NextRequest) {
  const userTier = await getUserTier()

  if (userTier === 'anonymous') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { playerId, sport, stat } = body as {
      playerId: string
      sport: Sport
      stat: string
    }

    if (!playerId || !sport || !stat) {
      return NextResponse.json({ error: 'Missing required fields (playerId, sport, stat)' }, { status: 400 })
    }

    // Resolve the absent player
    const absentPlayer = await resolvePlayerById(playerId, sport)
    if (!absentPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Get the absent player's game logs to know which games they played/missed
    const absentLogs = await fetchAndParseGameLogs(playerId, sport)
    if (absentLogs.length === 0) {
      return NextResponse.json({ error: 'No game log data available for this player' }, { status: 404 })
    }

    // Build set of dates the absent player played
    const playedDates = new Set(absentLogs.map(g => g.date))

    // Find teammates on the same team
    const teammateCandidates = await searchPlayers(
      absentPlayer.team.abbrev,
      sport,
      25,
    )

    // Filter to actual teammates (same team abbrev, not the absent player)
    const teammates = teammateCandidates.filter(
      p => p.team.abbrev === absentPlayer.team.abbrev && p.id !== playerId
    )

    // Fetch game logs for all teammates in parallel
    const impacts: TeammateImpact[] = []

    const results = await Promise.allSettled(
      teammates.slice(0, 12).map(async (tm) => {
        const logs = await fetchAndParseGameLogs(tm.id, sport)
        if (logs.length < 5) return null

        // Split logs: games WITH the absent player vs WITHOUT
        const withPlayerGames = logs.filter(g => playedDates.has(g.date))
        const withoutPlayerGames = logs.filter(g => !playedDates.has(g.date))

        // Need at least 3 games in each bucket for meaningful comparison
        if (withPlayerGames.length < 3 || withoutPlayerGames.length < 2) return null

        const avgWith = withPlayerGames.reduce((s, g) => s + (g.stats[stat] ?? 0), 0) / withPlayerGames.length
        const avgWithout = withoutPlayerGames.reduce((s, g) => s + (g.stats[stat] ?? 0), 0) / withoutPlayerGames.length

        const delta = avgWithout - avgWith
        const deltaPct = avgWith > 0 ? (delta / avgWith) * 100 : 0

        return {
          id: tm.id,
          name: tm.name,
          position: tm.position,
          headshotUrl: tm.headshotUrl ?? '',
          stat,
          withPlayer: { avg: Math.round(avgWith * 10) / 10, games: withPlayerGames.length },
          withoutPlayer: { avg: Math.round(avgWithout * 10) / 10, games: withoutPlayerGames.length },
          delta: Math.round(delta * 10) / 10,
          deltaPct: Math.round(deltaPct * 10) / 10,
          direction: delta > 0.5 ? 'boost' as const : delta < -0.5 ? 'drop' as const : 'neutral' as const,
        }
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        impacts.push(r.value)
      }
    }

    // Sort by absolute delta descending (biggest impact first)
    impacts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

    // Compute team-level summary
    const totalWithAvg = impacts.length > 0
      ? impacts.reduce((s, i) => s + i.withPlayer.avg, 0)
      : 0
    const totalWithoutAvg = impacts.length > 0
      ? impacts.reduce((s, i) => s + i.withoutPlayer.avg, 0)
      : 0

    return NextResponse.json({
      absentPlayer: {
        id: absentPlayer.id,
        name: absentPlayer.name,
        team: absentPlayer.team,
        position: absentPlayer.position,
        headshotUrl: absentPlayer.headshotUrl,
        sport: absentPlayer.sport,
      },
      stat,
      impacts,
      summary: {
        teamTotalWith: Math.round(totalWithAvg * 10) / 10,
        teamTotalWithout: Math.round(totalWithoutAvg * 10) / 10,
        netDelta: Math.round((totalWithoutAvg - totalWithAvg) * 10) / 10,
        teammatesAnalyzed: impacts.length,
        biggestBeneficiary: impacts.find(i => i.direction === 'boost')?.name ?? null,
        biggestLoser: impacts.find(i => i.direction === 'drop')?.name ?? null,
      },
    })
  } catch (error) {
    console.error('[what-if] Error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
