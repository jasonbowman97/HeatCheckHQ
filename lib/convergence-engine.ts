// ============================================================
// lib/convergence-engine.ts — 9-factor convergence evaluation
// ============================================================

import type { Player, Game, GameLog, SeasonStats, DefenseRanking } from '@/types/shared'
import type { ConvergenceFactor } from '@/types/check-prop'
import { mean } from './math-utils'

interface ConvergenceResult {
  factors: ConvergenceFactor[]
  overCount: number
  underCount: number
  neutralCount: number
}

export function evaluate(
  player: Player,
  game: Game,
  gameLogs: GameLog[],
  seasonStats: SeasonStats,
  defenseRanking: DefenseRanking,
  stat: string,
  line: number,
): ConvergenceResult {
  const factors: ConvergenceFactor[] = []

  // ──── FACTOR 1: RECENT TREND (Last 10 games) ────
  const last10 = gameLogs.slice(0, 10)
  const last10Values = last10.map(g => g.stats[stat] ?? 0)
  const last10HitRate = last10.length > 0
    ? last10Values.filter(v => v > line).length / last10.length
    : 0.5

  // Also factor in the average margin (how much they beat/miss the line)
  const last10Avg = last10Values.length > 0 ? mean(last10Values) : line
  const last10Margin = last10Avg - line
  // Tighter thresholds: 55%/45% to catch leaners, with strength scaling for stronger signals
  const trendSignal = last10HitRate > 0.55 ? 'over' as const
    : last10HitRate < 0.45 ? 'under' as const
    : 'neutral' as const
  // Strength combines hit rate deviation AND average margin
  const hitRateDeviation = Math.abs(last10HitRate - 0.5) * 2
  const marginStrength = Math.min(1, Math.abs(last10Margin) / Math.max(1, line * 0.3))
  const trendStrength = Math.min(1, hitRateDeviation * 0.6 + marginStrength * 0.4)

  factors.push({
    key: 'recent_trend',
    name: 'Recent Trend',
    signal: trendSignal,
    strength: trendStrength,
    detail: `${Math.round(last10HitRate * 100)}% hit rate in last 10 games (avg ${last10Avg.toFixed(1)})`,
    dataPoint: `${last10Values.filter(v => v > line).length}/${last10.length} over`,
    icon: trendSignal === 'over' ? '📈' : trendSignal === 'under' ? '📉' : '➡',
  })

  // ──── FACTOR 2: SEASON AVERAGE vs LINE ────
  const seasonAvg = seasonStats.average
  const avgGap = seasonAvg - line
  // Use percentage-based threshold: 15% of the line value (min 1 unit)
  // This makes the threshold proportional — a 2-point gap on a line of 25 is small,
  // but a 2-point gap on a line of 4 is very significant
  const avgThreshold = Math.max(1, line * 0.15)

  factors.push({
    key: 'season_avg',
    name: 'Season Average',
    signal: avgGap > avgThreshold ? 'over' : avgGap < -avgThreshold ? 'under' : 'neutral',
    strength: Math.min(1, Math.abs(avgGap) / (avgThreshold * 2.5)),
    detail: `Season average: ${seasonAvg.toFixed(1)} vs line ${line}`,
    dataPoint: `${avgGap > 0 ? '+' : ''}${avgGap.toFixed(1)} above line`,
    icon: avgGap > avgThreshold ? '⬆' : avgGap < -avgThreshold ? '⬇' : '↔',
  })

  // ──── FACTOR 3: OPPONENT DEFENSE ────
  const defRank = defenseRanking.rank
  const defStatsAllowed = defenseRanking.statsAllowed

  factors.push({
    key: 'matchup',
    name: 'Opponent Defense',
    signal: defRank >= 21 ? 'over' : defRank <= 10 ? 'under' : 'neutral',
    strength: defRank >= 21 ? (defRank - 20) / 10 : defRank <= 10 ? (11 - defRank) / 10 : 0.2,
    detail: `Opponent ranks #${defRank} defending ${player.position}s`,
    dataPoint: `${defStatsAllowed.toFixed(1)} ${stat}/game allowed`,
    icon: defRank >= 21 ? '🎯' : defRank <= 10 ? '🛡' : '⚖',
  })

  // ──── FACTOR 4: HOME/AWAY SPLIT ────
  const isHome = game.homeTeam.id === player.team.id
  const homeGames = gameLogs.filter(g => g.isHome)
  const awayGames = gameLogs.filter(g => !g.isHome)
  const homeAvg = homeGames.length > 0 ? mean(homeGames.map(g => g.stats[stat] ?? 0)) : seasonAvg
  const awayAvg = awayGames.length > 0 ? mean(awayGames.map(g => g.stats[stat] ?? 0)) : seasonAvg
  const venueAvg = isHome ? homeAvg : awayAvg
  const venueGap = venueAvg - line
  // Proportional threshold: 12% of line (min 0.8 units)
  const venueThreshold = Math.max(0.8, line * 0.12)

  factors.push({
    key: 'venue',
    name: 'Home/Away Split',
    signal: venueGap > venueThreshold ? 'over' : venueGap < -venueThreshold ? 'under' : 'neutral',
    strength: Math.min(1, Math.abs(venueGap) / (venueThreshold * 2.5)),
    detail: `${isHome ? 'Home' : 'Away'} avg: ${venueAvg.toFixed(1)} (H: ${homeAvg.toFixed(1)} / A: ${awayAvg.toFixed(1)})`,
    dataPoint: `${isHome ? '🏠' : '✈'} ${venueAvg.toFixed(1)} avg`,
    icon: isHome ? '🏠' : '✈',
  })

  // ──── FACTOR 5: REST / FATIGUE ────
  const isB2B = gameLogs[0]?.isBackToBack ?? false
  const restDays = gameLogs[0]?.restDays ?? 1
  const b2bGames = gameLogs.filter(g => g.isBackToBack)
  const b2bAvg = b2bGames.length > 0 ? mean(b2bGames.map(g => g.stats[stat] ?? 0)) : seasonAvg
  const restedGames = gameLogs.filter(g => g.restDays >= 2)
  const restedAvg = restedGames.length > 0 ? mean(restedGames.map(g => g.stats[stat] ?? 0)) : seasonAvg

  factors.push({
    key: 'rest',
    name: 'Rest / Fatigue',
    signal: isB2B ? 'under' : restDays >= 2 ? 'over' : 'neutral',
    strength: isB2B
      ? Math.min(1, Math.abs(seasonAvg - b2bAvg) / 4)
      : restDays >= 2
        ? Math.min(1, Math.abs(restedAvg - seasonAvg) / 4)
        : 0.1,
    detail: isB2B
      ? `Back-to-back. B2B avg: ${b2bAvg.toFixed(1)} vs season ${seasonAvg.toFixed(1)}`
      : `${restDays} days rest. Rested avg: ${restedAvg.toFixed(1)}`,
    dataPoint: isB2B ? `⚠ B2B: ${b2bAvg.toFixed(1)} avg` : `${restDays}d rest`,
    icon: isB2B ? '😴' : restDays >= 2 ? '⚡' : '➡',
  })

  // ──── FACTOR 6: HEAD-TO-HEAD HISTORY ────
  const opponentAbbrev = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev
  const h2hGames = gameLogs.filter(g => g.opponent === opponentAbbrev)
  const h2hHitRate = h2hGames.length >= 3
    ? h2hGames.filter(g => (g.stats[stat] ?? 0) > line).length / h2hGames.length
    : null

  factors.push({
    key: 'h2h',
    name: 'Head-to-Head',
    signal: h2hHitRate !== null
      ? (h2hHitRate > 0.6 ? 'over' : h2hHitRate < 0.4 ? 'under' : 'neutral')
      : 'neutral',
    strength: h2hHitRate !== null ? Math.abs(h2hHitRate - 0.5) * 2 : 0,
    detail: h2hGames.length >= 3
      ? `${Math.round((h2hHitRate ?? 0) * 100)}% hit rate vs ${opponentAbbrev} (${h2hGames.length} games)`
      : `Limited H2H data (${h2hGames.length} games)`,
    dataPoint: h2hGames.length >= 3
      ? `${h2hGames.filter(g => (g.stats[stat] ?? 0) > line).length}/${h2hGames.length} over`
      : 'N/A',
    icon: h2hHitRate !== null && h2hHitRate > 0.6 ? '✅' : h2hHitRate !== null && h2hHitRate < 0.4 ? '❌' : '❓',
  })

  // ──── FACTOR 7: MOMENTUM / STREAK ────
  let streak = 0
  for (const g of gameLogs) {
    const val = g.stats[stat] ?? 0
    if (streak === 0) { streak = val > line ? 1 : -1 }
    else if (streak > 0 && val > line) { streak++ }
    else if (streak < 0 && val <= line) { streak-- }
    else { break }
  }

  factors.push({
    key: 'momentum',
    name: 'Momentum',
    signal: streak >= 3 ? 'over' : streak <= -3 ? 'under' : 'neutral',
    strength: Math.min(1, Math.abs(streak) / 7),
    detail: streak > 0
      ? `${streak}-game over streak`
      : streak < 0
        ? `${Math.abs(streak)}-game under streak`
        : 'No active streak',
    dataPoint: `${streak > 0 ? '🔥' : streak < 0 ? '🧊' : '➡'} ${Math.abs(streak)} games`,
    icon: streak >= 3 ? '🔥' : streak <= -3 ? '🧊' : '➡',
  })

  // ──── FACTOR 8: MINUTES TREND (workload signal) ────
  // If a player's minutes are trending up, they're getting more opportunity → over
  // If minutes are declining, less runway to hit props → under
  // Only applies when we have minutes data and stat is NOT minutes itself
  const minutesData = gameLogs
    .slice(0, 10)
    .map(g => g.minutesPlayed)
    .filter((m): m is number => m != null && m > 0)

  if (minutesData.length >= 5 && stat !== 'minutes') {
    const recentMins = mean(minutesData.slice(0, 5))  // L5 avg minutes
    const olderMins = mean(minutesData.slice(5))       // L6-10 avg minutes (or all older)
    const seasonMinutes = gameLogs
      .map(g => g.minutesPlayed)
      .filter((m): m is number => m != null && m > 0)
    const seasonMinsAvg = seasonMinutes.length > 0 ? mean(seasonMinutes) : recentMins

    // Compare recent 5 game minutes to older 5 game minutes
    const minsDelta = recentMins - olderMins
    const minsVsSeason = recentMins - seasonMinsAvg
    // Threshold: 2+ min difference is significant
    const minsSignal: 'over' | 'under' | 'neutral' =
      minsDelta > 2 ? 'over' :
      minsDelta < -2 ? 'under' :
      'neutral'

    factors.push({
      key: 'minutes_trend',
      name: 'Minutes Trend',
      signal: minsSignal,
      strength: Math.min(1, Math.abs(minsDelta) / 5),
      detail: `L5 avg: ${recentMins.toFixed(1)} min vs prior: ${olderMins.toFixed(1)} min (szn: ${seasonMinsAvg.toFixed(1)})`,
      dataPoint: `${minsDelta > 0 ? '+' : ''}${minsDelta.toFixed(1)} min shift`,
      icon: minsSignal === 'over' ? '⏱' : minsSignal === 'under' ? '📉' : '➡',
    })
  } else {
    // No minutes data or stat IS minutes — push neutral with no strength
    factors.push({
      key: 'minutes_trend',
      name: 'Minutes Trend',
      signal: 'neutral',
      strength: 0,
      detail: stat === 'minutes' ? 'N/A (analyzing minutes prop)' : 'Insufficient minutes data',
      dataPoint: 'N/A',
      icon: '➡',
    })
  }

  // ──── FACTOR 9: PACE / GAME ENVIRONMENT ────
  // Uses the game O/U total as a proxy for game pace and scoring environment.
  // High game totals → more possessions, more scoring, more stats → favors overs for counting stats.
  // Low game totals → grind-it-out game → favors unders.
  // We compare the game total to sport-specific median totals.
  const gameTotal = game.total
  const sportMedianTotals: Record<string, number> = {
    nba: 224,
    mlb: 8.5,
    nfl: 44,
  }
  const medianTotal = sportMedianTotals[player.sport] ?? 224

  if (gameTotal != null && gameTotal > 0) {
    const totalDelta = gameTotal - medianTotal
    // Threshold: ~5% above/below median is meaningful
    const paceThreshold = medianTotal * 0.05
    const paceSignal: 'over' | 'under' | 'neutral' =
      totalDelta > paceThreshold ? 'over' :
      totalDelta < -paceThreshold ? 'under' :
      'neutral'

    // Also compute implied team total for more detail
    const spread = game.spread ?? 0
    const teamImplied = isHome
      ? (gameTotal / 2) - (spread / 2)
      : (gameTotal / 2) + (spread / 2)

    factors.push({
      key: 'game_environment',
      name: 'Game Environment',
      signal: paceSignal,
      strength: Math.min(1, Math.abs(totalDelta) / (paceThreshold * 3)),
      detail: `Game total: ${gameTotal} (median: ${medianTotal}). Team implied: ${teamImplied.toFixed(1)}`,
      dataPoint: `O/U ${gameTotal} · Implied ${teamImplied.toFixed(1)}`,
      icon: paceSignal === 'over' ? '🏃' : paceSignal === 'under' ? '🐢' : '⚖',
    })
  } else {
    // No odds data available
    factors.push({
      key: 'game_environment',
      name: 'Game Environment',
      signal: 'neutral',
      strength: 0,
      detail: 'Game total unavailable',
      dataPoint: 'N/A',
      icon: '➡',
    })
  }

  // ──── TALLY ────
  const overCount = factors.filter(f => f.signal === 'over').length
  const underCount = factors.filter(f => f.signal === 'under').length
  const neutralCount = factors.filter(f => f.signal === 'neutral').length

  return { factors, overCount, underCount, neutralCount }
}
