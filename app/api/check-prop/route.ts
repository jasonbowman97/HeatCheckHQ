// ============================================================
// app/api/check-prop/route.ts — Master PropCheck Controller
// ============================================================
// Orchestrates all data fetching and computation for a prop check.
// Phase 1: Resolve player → game → gameLogs + defense + injuries in parallel
// Phase 2: Run convergence engine, verdict, spectrum, heat ring, narratives
// Phase 3: Assemble and return PropCheckResult

import { NextResponse, type NextRequest } from 'next/server'
import type { PropCheckResult, PropCheckError } from '@/types/check-prop'
import { evaluate as evaluateConvergence } from '@/lib/convergence-engine'
import { synthesizeVerdict } from '@/lib/verdict-service'
import { computeSpectrum } from '@/lib/prop-spectrum-service'
import { computeHeatRing } from '@/lib/heat-ring-service'
import { buildMatchupContext } from '@/lib/matchup-service'
import { detectNarratives } from '@/lib/narrative-detector'
import { buildGameLogTimeline, getHitRate, getAvgMargin, computeSeasonStats } from '@/lib/game-log-service'
import { getStatLabel } from '@/lib/design-tokens'
import { resolvePlayerById } from '@/lib/player-service'
import { resolveGameForPlayer } from '@/lib/game-service'
import { fetchAndParseGameLogs } from '@/lib/gamelog-parser'
import { resolveDefenseRanking } from '@/lib/defense-service'
import { fetchTeamInjuries } from '@/lib/injury-service'
import { findSimilarSituations } from '@/lib/similar-situations-service'
import { getUserTier } from '@/lib/get-user-tier'

export const revalidate = 300 // 5-minute CDN cache

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { playerId, stat, line, gameId, sport } = body

    // Validate inputs
    if (!playerId || typeof playerId !== 'string') {
      return errorResponse('player_not_found', 'Player ID is required')
    }
    if (!stat || typeof stat !== 'string') {
      return errorResponse('invalid_stat', 'Stat type is required')
    }
    if (line == null || typeof line !== 'number' || line < 0) {
      return errorResponse('invalid_stat', 'A valid line number is required')
    }

    // ──── PHASE 1A: Resolve player (needed before other lookups) ────
    const player = await resolvePlayerById(playerId, sport)

    if (!player) {
      return errorResponse('player_not_found', `No player found with ID "${playerId}"`)
    }

    // ──── PHASE 1B: Parallel data fetching (player-dependent) ────
    const [game, gameLogs] = await Promise.all([
      resolveGameForPlayer(player, gameId),
      fetchAndParseGameLogs(playerId, player.sport),
    ])

    if (!game) {
      // Even without a game, we can return historical data
      return errorResponse('no_game_today', `${player.name} does not have a game scheduled today`, true)
    }

    // ──── PHASE 1C: Game-dependent data (needs game + player) ────
    const [defenseRanking, injuryData] = await Promise.all([
      resolveDefenseRanking(player, game, stat),
      fetchTeamInjuries(player, game),
    ])

    // Compute season stats from game logs
    const seasonStatsRaw = computeSeasonStats(gameLogs, stat)
    const seasonStats = {
      playerId,
      sport: player.sport,
      stat,
      ...seasonStatsRaw,
    }

    // Flatten injuries for narrative detector and matchup context
    const allInjuries = [...injuryData.teammates, ...injuryData.opponents]

    const isHome = game.homeTeam.id === player.team.id

    // Determine user tier for Pro-only features
    const userTier = await getUserTier()
    const isPro = userTier === 'pro'

    // ──── PHASE 2: Computation (all pure functions, runs fast) ────

    // 1. Convergence Engine (9 factors)
    const convergence = evaluateConvergence(
      player, game, gameLogs, seasonStats, defenseRanking, stat, line
    )

    // 2. Heat Ring (10 games for free, 20 for Pro)
    const heatRing = computeHeatRing({ gameLogs, stat, line, maxGames: isPro ? 20 : 10 })

    // 3. Prop Spectrum (KDE)
    const spectrum = computeSpectrum({ gameLogs, stat, line })

    // 4. Game Log Timeline
    const gameLogTimeline = buildGameLogTimeline({ gameLogs, stat })

    // 5. Matchup Context
    const matchup = buildMatchupContext({
      player, game, gameLogs, defenseRanking, injuries: allInjuries,
    })

    // 6. Narrative Flags
    const narratives = detectNarratives({
      player, game, gameLogs, seasonStats, injuries: allInjuries,
      isHome, restDays: matchup.restDays, isBackToBack: matchup.isBackToBack,
      stat, line,
    })

    // 7. Verdict Synthesis (uses convergence + hit rate data)
    const hitRateL10 = getHitRate(gameLogs, stat, line, 10)
    const avgMarginL10 = getAvgMargin(gameLogs, stat, line, 10)

    const verdict = synthesizeVerdict({
      factors: convergence.factors,
      overCount: convergence.overCount,
      underCount: convergence.underCount,
      neutralCount: convergence.neutralCount,
      hitRateL10,
      avgMarginL10,
      seasonAvg: seasonStats.average,
    })

    // 8. Similar Situations (Pro only)
    const similarSituations = isPro
      ? findSimilarSituations({
          player, game, gameLogs, defenseRanking, stat, line, isHome,
        }) ?? undefined
      : undefined

    // ──── PHASE 3: Assemble result ────
    const result: PropCheckResult = {
      player,
      stat,
      statLabel: getStatLabel(stat, player.sport),
      line,
      game,
      isPlayerHome: isHome,
      verdict,
      heatRing,
      spectrum,
      convergence,
      matchup,
      narratives,
      gameLog: gameLogTimeline,
      similarSituations,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })

  } catch (error) {
    console.error('[Prop Analyzer] Unexpected error:', error)
    return errorResponse('server_error', 'An unexpected error occurred. Please try again.')
  }
}

// ──── Error helper ────

function errorResponse(
  error: PropCheckError['error'],
  message: string,
  canShowHistorical = false,
) {
  const body: PropCheckError = { error, message, canShowHistorical }
  const status = error === 'server_error' ? 500 :
    error === 'no_game_today' ? 200 : 400
  return NextResponse.json(body, { status })
}
