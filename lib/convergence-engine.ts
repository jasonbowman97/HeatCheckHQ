// ============================================================
// lib/convergence-engine.ts — 7-factor convergence evaluation
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

  factors.push({
    key: 'recent_trend',
    name: 'Recent Trend',
    signal: last10HitRate > 0.6 ? 'over' : last10HitRate < 0.4 ? 'under' : 'neutral',
    strength: Math.abs(last10HitRate - 0.5) * 2,
    detail: `${Math.round(last10HitRate * 100)}% hit rate in last 10 games`,
    dataPoint: `${last10Values.filter(v => v > line).length}/10 over`,
    icon: last10HitRate > 0.6 ? '📈' : last10HitRate < 0.4 ? '📉' : '➡',
  })

  // ──── FACTOR 2: SEASON AVERAGE vs LINE ────
  const seasonAvg = seasonStats.average
  const avgGap = seasonAvg - line

  factors.push({
    key: 'season_avg',
    name: 'Season Average',
    signal: avgGap > 2 ? 'over' : avgGap < -2 ? 'under' : 'neutral',
    strength: Math.min(1, Math.abs(avgGap) / 5),
    detail: `Season average: ${seasonAvg.toFixed(1)} vs line ${line}`,
    dataPoint: `${avgGap > 0 ? '+' : ''}${avgGap.toFixed(1)} above line`,
    icon: avgGap > 2 ? '⬆' : avgGap < -2 ? '⬇' : '↔',
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

  factors.push({
    key: 'venue',
    name: 'Home/Away Split',
    signal: venueGap > 1.5 ? 'over' : venueGap < -1.5 ? 'under' : 'neutral',
    strength: Math.min(1, Math.abs(venueGap) / 4),
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

  // ──── TALLY ────
  const overCount = factors.filter(f => f.signal === 'over').length
  const underCount = factors.filter(f => f.signal === 'under').length
  const neutralCount = factors.filter(f => f.signal === 'neutral').length

  return { factors, overCount, underCount, neutralCount }
}
