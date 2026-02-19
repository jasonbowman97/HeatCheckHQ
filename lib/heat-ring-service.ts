// ============================================================
// lib/heat-ring-service.ts — Compute Heat Ring data from game logs
// ============================================================

import type { GameLog } from '@/types/shared'
import type { HeatRingGame } from '@/types/check-prop'
import { mean } from './math-utils'

interface HeatRingInput {
  gameLogs: GameLog[]
  stat: string
  line: number
  maxGames?: number // 10 for free, 20 for pro
}

interface HeatRingResult {
  games: HeatRingGame[]
  aggregates: {
    hitRate: number
    hitCount: number
    totalGames: number
    avgMargin: number
    avgValue: number
    streak: number
  }
}

export function computeHeatRing(input: HeatRingInput): HeatRingResult {
  const { gameLogs, stat, line, maxGames = 10 } = input

  const recentGames = gameLogs.slice(0, maxGames)

  const heatRingGames: HeatRingGame[] = recentGames.map(g => {
    const actualValue = g.stats[stat] ?? 0
    const margin = actualValue - line

    return {
      gameId: g.gameId ?? '',
      date: g.date,
      opponent: g.opponent,
      opponentDefRank: g.opponentDefRank,
      isHome: g.isHome,
      isBackToBack: g.isBackToBack,
      actualValue,
      line,
      margin,
      isHit: actualValue > line,
    }
  })

  // Compute aggregates
  const values = heatRingGames.map(g => g.actualValue)
  const margins = heatRingGames.map(g => g.margin)
  const hitCount = heatRingGames.filter(g => g.isHit).length
  const totalGames = heatRingGames.length

  // Compute current streak
  let streak = 0
  for (const g of heatRingGames) {
    if (streak === 0) {
      streak = g.isHit ? 1 : -1
    } else if (streak > 0 && g.isHit) {
      streak++
    } else if (streak < 0 && !g.isHit) {
      streak--
    } else {
      break
    }
  }

  return {
    games: heatRingGames,
    aggregates: {
      hitRate: totalGames > 0 ? hitCount / totalGames : 0,
      hitCount,
      totalGames,
      avgMargin: margins.length > 0 ? mean(margins) : 0,
      avgValue: values.length > 0 ? mean(values) : 0,
      streak,
    },
  }
}
