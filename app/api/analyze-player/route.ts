// ============================================================
// app/api/analyze-player/route.ts — Multi-prop lightweight analysis
// ============================================================
// Fetches ALL props for a player in a single request.
// Returns lightweight summaries for the prop card grid.
// The full deep analysis is still handled by /api/check-prop.

import { NextResponse, type NextRequest } from 'next/server'
import type { PlayerAnalysis, PropSummary } from '@/types/analyzer'
import { resolvePlayerById } from '@/lib/player-service'
import { resolveGameForPlayer } from '@/lib/game-service'
import { fetchAndParseGameLogs } from '@/lib/gamelog-parser'
import { resolveDefenseRanking } from '@/lib/defense-service'
import { evaluate as evaluateConvergence } from '@/lib/convergence-engine'
import { computeSeasonStats, getHitRate } from '@/lib/game-log-service'
import { getStatLabel, statLabels } from '@/lib/design-tokens'
import { getSmartDefault, getOrderedStats } from '@/lib/prop-lines'
import { mean, computeVolatility } from '@/lib/math-utils'

export const revalidate = 300 // 5-minute CDN cache

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { playerId, sport } = body

    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json(
        { error: 'player_not_found', message: 'Player ID is required' },
        { status: 400 },
      )
    }

    // ──── PHASE 1: Resolve player + fetch data (shared across all stats) ────

    const player = await resolvePlayerById(playerId, sport)
    if (!player) {
      return NextResponse.json(
        { error: 'player_not_found', message: `No player found with ID "${playerId}"` },
        { status: 404 },
      )
    }

    // Parallel: game + gamelogs (both are player-level, not stat-level)
    const [game, gameLogs] = await Promise.all([
      resolveGameForPlayer(player),
      fetchAndParseGameLogs(playerId, player.sport),
    ])

    if (gameLogs.length === 0) {
      return NextResponse.json(
        { error: 'no_data', message: `No game log data found for ${player.name}` },
        { status: 200 },
      )
    }

    // ──── PHASE 2: Compute per-stat summaries ────

    const orderedStats = getOrderedStats(player.sport)
    const sportStatLabels = statLabels[player.sport] || {}

    // Only process stats that have labels defined
    const availableStats = orderedStats.filter(s => sportStatLabels[s])

    // Compute season averages for all stats at once
    const seasonAverages: Record<string, number> = {}
    for (const stat of availableStats) {
      const vals = gameLogs.map(g => g.stats[stat] ?? 0)
      seasonAverages[stat] = vals.length > 0 ? mean(vals) : 0
    }

    // Determine opponent info for H2H
    const isHome = game ? game.homeTeam.id === player.team.id : false
    const opponentAbbrev = game
      ? (isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev)
      : null

    // Build lightweight prop summaries
    // Defense ranking varies by stat, so we fetch it per-stat in parallel
    const propPromises = availableStats.map(async (stat): Promise<PropSummary | null> => {
      try {
        const seasonAvg = seasonAverages[stat]

        // Skip stats with zero average (player doesn't record this stat)
        if (seasonAvg === 0 && gameLogs.every(g => (g.stats[stat] ?? 0) === 0)) {
          return null
        }

        const line = getSmartDefault(stat, player.sport, seasonAvg)

        // Game values
        const allValues = gameLogs.map(g => g.stats[stat] ?? 0)
        const last10 = gameLogs.slice(0, 10)
        const last5 = gameLogs.slice(0, 5)
        const last10Values = last10.map(g => g.stats[stat] ?? 0)
        const last10Opponents = last10.map(g => g.opponent)
        const last10Dates = last10.map(g => g.date)
        const last5Values = last5.map(g => g.stats[stat] ?? 0)
        const last5Avg = last5Values.length > 0 ? mean(last5Values) : 0
        const last10Avg = last10Values.length > 0 ? mean(last10Values) : 0

        // Hit rates
        const hitRateL5 = getHitRate(gameLogs, stat, line, 5)
        const hitRateL10 = getHitRate(gameLogs, stat, line, 10)
        const hitRateSeason = getHitRate(gameLogs, stat, line)

        // H2H hit rate
        let hitRateH2H: number | null = null
        if (opponentAbbrev) {
          const h2hGames = gameLogs.filter(g => g.opponent === opponentAbbrev)
          if (h2hGames.length >= 3) {
            hitRateH2H = h2hGames.filter(g => (g.stats[stat] ?? 0) > line).length / h2hGames.length
          }
        }

        // Trend detection
        const trendThreshold = seasonAvg * 0.1 // 10% above/below season avg
        const trend: PropSummary['trend'] =
          last5Avg > seasonAvg + trendThreshold ? 'hot' :
          last5Avg < seasonAvg - trendThreshold ? 'cold' :
          'steady'

        // Quick convergence (if we have a game, run the engine; otherwise use hit rates)
        let convergenceOver = 0
        let convergenceUnder = 0
        let confidence = 50

        if (game) {
          try {
            const seasonStats = { playerId, sport: player.sport, stat, ...computeSeasonStats(gameLogs, stat) }
            const defenseRanking = await resolveDefenseRanking(player, game, stat)
            const convergence = evaluateConvergence(
              player, game, gameLogs, seasonStats, defenseRanking, stat, line,
            )
            convergenceOver = convergence.overCount
            convergenceUnder = convergence.underCount

            // Derive confidence from convergence + hit rate
            const dominant = Math.max(convergenceOver, convergenceUnder)
            const convergenceStrength = (dominant / 7) * 100
            const hitRateStrength = Math.abs(hitRateL10 - 0.5) * 200
            confidence = Math.round((convergenceStrength * 0.6) + (hitRateStrength * 0.4))
            confidence = Math.min(99, Math.max(10, confidence))
          } catch {
            // Defense ranking may fail for some stat/sport combos; use hit rate only
            convergenceOver = hitRateL10 > 0.5 ? 4 : 3
            convergenceUnder = 7 - convergenceOver
            confidence = Math.round(Math.abs(hitRateL10 - 0.5) * 200)
            confidence = Math.min(99, Math.max(10, confidence))
          }
        } else {
          // No game: base verdict on hit rates
          convergenceOver = hitRateL10 > 0.5 ? 4 : 3
          convergenceUnder = 7 - convergenceOver
          confidence = Math.round(Math.abs(hitRateL10 - 0.5) * 200)
          confidence = Math.min(99, Math.max(10, confidence))
        }

        // Verdict
        const verdict: PropSummary['verdict'] =
          convergenceOver >= 5 ? 'over' :
          convergenceUnder >= 5 ? 'under' :
          'neutral'

        return {
          stat,
          statLabel: getStatLabel(stat, player.sport),
          line,
          seasonAvg,
          last5Avg,
          last10Avg,
          hitRateL10,
          hitRateL5,
          hitRateSeason,
          hitRateH2H,
          trend,
          convergenceOver,
          convergenceUnder,
          verdict,
          confidence,
          last10Values,
          last10Opponents,
          last10Dates,
          allValues,
          volatility: computeVolatility(allValues),
        }
      } catch {
        return null // skip this stat if computation fails
      }
    })

    const propResults = await Promise.all(propPromises)
    const props = propResults.filter((p): p is PropSummary => p !== null)

    // Sort by confidence (highest first)
    props.sort((a, b) => b.confidence - a.confidence)

    // ──── PHASE 3: Compute lightweight matchup context ────

    let matchupContext: PlayerAnalysis['matchupContext'] = undefined
    if (game && opponentAbbrev) {
      // Use the first core stat to get a representative defense rank
      const coreStatForDefense = props[0]?.stat
      let opponentDefRank = 15 // neutral default
      if (coreStatForDefense) {
        try {
          const defRanking = await resolveDefenseRanking(player, game, coreStatForDefense)
          if (defRanking?.rank) {
            opponentDefRank = defRanking.rank
          }
        } catch {
          // Defense rank unavailable — keep neutral default
        }
      }

      const mostRecentLog = gameLogs[0]
      const restDays = mostRecentLog?.restDays ?? 2
      const isB2B = mostRecentLog?.isBackToBack ?? false

      matchupContext = {
        opponentAbbrev,
        opponentDefRank,
        isHome,
        restDays,
        isB2B,
      }
    }

    const result: PlayerAnalysis = {
      player,
      nextGame: game ?? null,
      sport: player.sport,
      props,
      seasonAverages,
      gamesPlayed: gameLogs.length,
      matchupContext,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })

  } catch (error) {
    console.error('[Prop Analyzer] Unexpected error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
