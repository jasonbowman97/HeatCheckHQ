// ============================================================
// lib/game-log-service.ts — Enriched game log & timeline builder
// ============================================================

import type { GameLog, GameLogMarker } from '@/types/shared'
import { mean, movingAverage } from './math-utils'

interface GameLogTimelineInput {
  gameLogs: GameLog[]
  stat: string
  movingAvgWindow?: number
}

interface GameLogTimelineResult {
  games: GameLog[]
  movingAverage: number[]
  seasonAverage: number
}

export function buildGameLogTimeline(input: GameLogTimelineInput): GameLogTimelineResult {
  const { gameLogs, stat, movingAvgWindow = 5 } = input

  // Game logs come newest-first; reverse for timeline display
  const chronological = [...gameLogs].reverse()
  const values = chronological.map(g => g.stats[stat] ?? 0)

  const seasonAverage = values.length > 0 ? mean(values) : 0
  const movingAvg = movingAverage(values, movingAvgWindow)

  return {
    games: chronological,
    movingAverage: movingAvg,
    seasonAverage,
  }
}

/**
 * Detect game log markers for a game
 */
export function detectMarkers(
  game: GameLog,
  prevGame: GameLog | null,
  allGames: GameLog[],
): GameLogMarker[] {
  const markers: GameLogMarker[] = []

  // Back-to-back
  if (game.isBackToBack) {
    markers.push({ type: 'back_to_back', label: 'B2B' })
  }

  // Rest advantage
  if (game.restDays >= 3) {
    markers.push({ type: 'rest_advantage', label: `${game.restDays}d rest` })
  }

  // Injury return (gap > 7 days from previous game)
  if (prevGame) {
    const dayGap = daysBetween(prevGame.date, game.date)
    if (dayGap >= 7) {
      markers.push({ type: 'injury_return', label: 'Return' })
    }
  }

  // Blowout game (team won or lost by 20+)
  // This is a proxy — we don't have score data directly, but can use context
  // In a real implementation, we'd check the game score from the API

  return markers
}

/**
 * Compute enriched season stats from game logs
 */
export function computeSeasonStats(gameLogs: GameLog[], stat: string) {
  const values = gameLogs.map(g => g.stats[stat] ?? 0)

  if (values.length === 0) {
    return { average: 0, gamesPlayed: 0, total: 0, high: 0, low: 0 }
  }

  return {
    average: mean(values),
    gamesPlayed: values.length,
    total: values.reduce((sum, v) => sum + v, 0),
    high: Math.max(...values),
    low: Math.min(...values),
  }
}

/**
 * Get hit rate over a window of games
 */
export function getHitRate(gameLogs: GameLog[], stat: string, line: number, window?: number): number {
  const games = window ? gameLogs.slice(0, window) : gameLogs
  if (games.length === 0) return 0
  const hits = games.filter(g => (g.stats[stat] ?? 0) > line).length
  return hits / games.length
}

/**
 * Get average margin over a window
 */
export function getAvgMargin(gameLogs: GameLog[], stat: string, line: number, window?: number): number {
  const games = window ? gameLogs.slice(0, window) : gameLogs
  if (games.length === 0) return 0
  const margins = games.map(g => (g.stats[stat] ?? 0) - line)
  return mean(margins)
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}
