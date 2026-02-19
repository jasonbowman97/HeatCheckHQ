// ============================================================
// lib/backtest-engine.ts — Historical backtesting for Edge Lab
// ============================================================
// Runs a filter against historical enriched game logs and computes
// hit rate, ROI, equity curve, drawdown, Sharpe ratio, Kelly fraction.

import type { CustomFilter, EnrichedGameLog, BacktestResult, EquityCurvePoint } from '@/types/edge-lab'
import { evaluateFilter } from './filter-engine'
import { mean, stdDev } from './math-utils'

interface MatchedLog extends EnrichedGameLog {
  betResult: 'hit' | 'miss'
}

interface BacktestInput {
  filter: CustomFilter
  gameLogs: EnrichedGameLog[]
  seasons: string[]
  assumedOdds?: number // American odds, default -110
}

export function runBacktest(input: BacktestInput): BacktestResult {
  const startTime = Date.now()
  const { filter, gameLogs, seasons, assumedOdds = -110 } = input

  // Evaluate filter against all game logs
  const matchingLogs: MatchedLog[] = []

  for (const log of gameLogs) {
    const { matches } = evaluateFilter(filter, log)
    if (!matches) continue

    // Determine hit/miss based on direction
    const statKey = log.primaryStatKey
    const actualValue = log.stats[statKey] ?? 0
    const propLine = log.propLines?.[statKey]
    if (propLine == null) continue

    const direction = filter.direction ?? 'over'
    const isHit = direction === 'over'
      ? actualValue > propLine
      : actualValue < propLine

    matchingLogs.push({ ...log, betResult: isHit ? 'hit' : 'miss' })
  }

  // Core metrics
  const totalGames = matchingLogs.length
  const hits = matchingLogs.filter(m => m.betResult === 'hit').length
  const misses = totalGames - hits
  const hitRate = totalGames > 0 ? hits / totalGames : 0

  // Betting simulation (flat 1-unit, assumed odds)
  const payoutMultiplier = americanToDecimal(assumedOdds)
  const totalUnitsWagered = totalGames
  let cumulativeProfit = 0
  let maxProfit = 0
  let maxDrawdown = 0
  let currentStreak = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  const equityCurve: EquityCurvePoint[] = []
  const dailyReturns: number[] = []

  // Sort matching logs chronologically
  const sorted = [...matchingLogs].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i]
    const profit = log.betResult === 'hit' ? payoutMultiplier : -1

    cumulativeProfit += profit
    dailyReturns.push(profit)

    // Track max profit and drawdown
    if (cumulativeProfit > maxProfit) {
      maxProfit = cumulativeProfit
    }
    const drawdown = maxProfit - cumulativeProfit
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }

    // Track streaks
    if (log.betResult === 'hit') {
      currentWinStreak++
      currentLossStreak = 0
      if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak
    } else {
      currentLossStreak++
      currentWinStreak = 0
      if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak
    }

    equityCurve.push({
      date: log.date,
      gameNumber: i + 1,
      cumulativeProfit,
      cumulativeROI: totalGames > 0 ? cumulativeProfit / (i + 1) : 0,
      result: log.betResult,
      playerName: log.playerName,
      stat: log.primaryStatKey,
      line: log.propLines?.[log.primaryStatKey] ?? 0,
      actualValue: log.stats[log.primaryStatKey] ?? 0,
    })
  }

  const roi = totalUnitsWagered > 0 ? cumulativeProfit / totalUnitsWagered : 0

  // Risk metrics
  const sharpeRatio = calculateSharpe(dailyReturns)
  const kellyFraction = calculateKelly(hitRate, payoutMultiplier)

  // Sample size assessment
  const sampleSize: BacktestResult['sampleSize'] =
    totalGames < 30 ? 'insufficient' :
    totalGames < 100 ? 'low' :
    totalGames < 500 ? 'moderate' :
    'high'

  const confidenceWarning = totalGames < 30
    ? 'Fewer than 30 matches — results are not statistically reliable'
    : totalGames < 100
    ? 'Sample size is limited. Results may not reflect true edge.'
    : undefined

  // Monthly breakdown
  const monthlyBreakdown = buildMonthlyBreakdown(sorted, payoutMultiplier)

  // Season breakdown
  const seasonBreakdown = buildSeasonBreakdown(sorted, seasons, payoutMultiplier)

  return {
    filterId: filter.id,
    filterName: filter.name,
    seasons,
    executionTimeMs: Date.now() - startTime,
    totalGames,
    hits,
    misses,
    hitRate,
    totalUnitsWagered,
    totalProfit: cumulativeProfit,
    roi,
    maxDrawdown,
    longestWinStreak,
    longestLossStreak,
    sharpeRatio,
    kellyFraction,
    sampleSize,
    confidenceWarning,
    equityCurve,
    monthlyBreakdown,
    seasonBreakdown,
  }
}

// ── RISK METRICS ──

function calculateSharpe(returns: number[]): number {
  if (returns.length < 2) return 0
  const avgReturn = mean(returns)
  const sd = stdDev(returns)
  if (sd === 0) return 0
  // Annualized: assume ~250 betting days per year
  return (avgReturn / sd) * Math.sqrt(250)
}

function calculateKelly(hitRate: number, payoutMultiplier: number): number {
  // Kelly Criterion: f* = (bp - q) / b
  // where b = payout multiplier, p = win probability, q = 1 - p
  if (payoutMultiplier <= 0) return 0
  const q = 1 - hitRate
  const kelly = (payoutMultiplier * hitRate - q) / payoutMultiplier
  return Math.max(0, Math.min(0.25, kelly)) // Cap at 25% for safety
}

function americanToDecimal(odds: number): number {
  if (odds < 0) return 100 / Math.abs(odds)
  return odds / 100
}

// ── BREAKDOWNS ──

function buildMonthlyBreakdown(
  sorted: MatchedLog[],
  payoutMultiplier: number,
): BacktestResult['monthlyBreakdown'] {
  const byMonth: Record<string, { games: number; hits: number; profit: number }> = {}

  for (const log of sorted) {
    const month = log.date.substring(0, 7) // YYYY-MM
    if (!byMonth[month]) {
      byMonth[month] = { games: 0, hits: 0, profit: 0 }
    }
    byMonth[month].games++
    if (log.betResult === 'hit') {
      byMonth[month].hits++
      byMonth[month].profit += payoutMultiplier
    } else {
      byMonth[month].profit -= 1
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      games: data.games,
      hits: data.hits,
      hitRate: data.games > 0 ? data.hits / data.games : 0,
      profit: Math.round(data.profit * 100) / 100,
    }))
}

function buildSeasonBreakdown(
  sorted: MatchedLog[],
  seasons: string[],
  payoutMultiplier: number,
): BacktestResult['seasonBreakdown'] {
  // Group by season (derive from date — Oct-Jun = NBA, Apr-Sep = MLB, Sep-Jan = NFL)
  // For simplicity, group by year
  const bySeason: Record<string, { games: number; hits: number; profit: number }> = {}

  for (const season of seasons) {
    bySeason[season] = { games: 0, hits: 0, profit: 0 }
  }

  for (const log of sorted) {
    const year = log.date.substring(0, 4)
    // Find the matching season
    const season = seasons.find(s => s.includes(year)) ?? year
    if (!bySeason[season]) {
      bySeason[season] = { games: 0, hits: 0, profit: 0 }
    }
    bySeason[season].games++
    if (log.betResult === 'hit') {
      bySeason[season].hits++
      bySeason[season].profit += payoutMultiplier
    } else {
      bySeason[season].profit -= 1
    }
  }

  return Object.entries(bySeason)
    .filter(([, data]) => data.games > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([season, data]) => ({
      season,
      games: data.games,
      hits: data.hits,
      hitRate: data.games > 0 ? data.hits / data.games : 0,
      profit: Math.round(data.profit * 100) / 100,
      roi: data.games > 0 ? data.profit / data.games : 0,
    }))
}
