// ============================================================
// lib/prop-spectrum-service.ts — KDE computation & distribution
// ============================================================

import type { GameLog } from '@/types/shared'
import type { KDEOverlay } from '@/types/check-prop'
import { mean, median, stdDev, generateKDE, silvermanBandwidth } from './math-utils'

interface SpectrumInput {
  gameLogs: GameLog[]
  stat: string
  line: number
}

interface SpectrumResult {
  distribution: {
    values: number[]
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
    kde: Array<{ x: number; y: number }>
  }
  overPct: number
  underPct: number
  volatility: 'low' | 'medium' | 'high'
  volatilityScore: number
  overlays: {
    home: KDEOverlay
    away: KDEOverlay
    vsTopDefense: KDEOverlay
    vsBottomDefense: KDEOverlay
  }
}

export function computeSpectrum(input: SpectrumInput): SpectrumResult {
  const { gameLogs, stat, line } = input

  // Extract stat values
  const values = gameLogs.map(g => g.stats[stat] ?? 0)

  if (values.length === 0) {
    return emptySpectrum()
  }

  // Core distribution stats
  const m = mean(values)
  const med = median(values)
  const sd = stdDev(values)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

  // KDE computation
  const bandwidth = values.length >= 5 ? silvermanBandwidth(values) : sd * 0.5 || 1
  const kdeMin = Math.max(0, minVal - bandwidth * 2)
  const kdeMax = maxVal + bandwidth * 2
  const kde = generateKDE(values, bandwidth, kdeMin, kdeMax, 100)

  // Over/under percentages
  const overCount = values.filter(v => v > line).length
  const overPct = overCount / values.length
  const underPct = 1 - overPct

  // Volatility assessment
  const cv = m > 0 ? (sd / m) * 100 : 0 // coefficient of variation
  const volatilityScore = Math.min(100, cv * 2)
  const volatility: 'low' | 'medium' | 'high' =
    volatilityScore < 30 ? 'low' :
    volatilityScore < 60 ? 'medium' :
    'high'

  // Split overlays
  const homeGames = gameLogs.filter(g => g.isHome)
  const awayGames = gameLogs.filter(g => !g.isHome)
  const topDefGames = gameLogs.filter(g => g.opponentDefRank <= 10)
  const bottomDefGames = gameLogs.filter(g => g.opponentDefRank >= 21)

  return {
    distribution: {
      values,
      mean: m,
      median: med,
      stdDev: sd,
      min: minVal,
      max: maxVal,
      kde,
    },
    overPct,
    underPct,
    volatility,
    volatilityScore,
    overlays: {
      home: buildOverlay(homeGames, stat, bandwidth, kdeMin, kdeMax),
      away: buildOverlay(awayGames, stat, bandwidth, kdeMin, kdeMax),
      vsTopDefense: buildOverlay(topDefGames, stat, bandwidth, kdeMin, kdeMax),
      vsBottomDefense: buildOverlay(bottomDefGames, stat, bandwidth, kdeMin, kdeMax),
    },
  }
}

function buildOverlay(
  games: GameLog[],
  stat: string,
  bandwidth: number,
  xMin: number,
  xMax: number,
): KDEOverlay {
  const values = games.map(g => g.stats[stat] ?? 0)
  if (values.length < 3) {
    return { kde: [], mean: mean(values), games: values.length }
  }

  const bw = values.length >= 5 ? silvermanBandwidth(values) : bandwidth
  return {
    kde: generateKDE(values, bw, xMin, xMax, 100),
    mean: mean(values),
    games: values.length,
  }
}

function emptySpectrum(): SpectrumResult {
  return {
    distribution: { values: [], mean: 0, median: 0, stdDev: 0, min: 0, max: 0, kde: [] },
    overPct: 0,
    underPct: 0,
    volatility: 'low',
    volatilityScore: 0,
    overlays: {
      home: { kde: [], mean: 0, games: 0 },
      away: { kde: [], mean: 0, games: 0 },
      vsTopDefense: { kde: [], mean: 0, games: 0 },
      vsBottomDefense: { kde: [], mean: 0, games: 0 },
    },
  }
}
