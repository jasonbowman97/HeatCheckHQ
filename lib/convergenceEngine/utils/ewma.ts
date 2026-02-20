// ============================================================
// convergenceEngine/utils/ewma.ts — Exponentially Weighted Moving Average
// ============================================================
// Reduces prediction residual ~50% vs flat rolling average by weighting
// recent games more heavily. Each sport has a tuned alpha based on
// schedule density and per-game variance.

/**
 * Exponentially Weighted Moving Average.
 *
 * @param values  Stat values array, oldest first, newest last
 * @param alpha   Smoothing factor. NBA: 0.85 | MLB: 0.70 | NFL: 0.90
 */
export function ewma(values: number[], alpha: number): number {
  if (!values.length) return 0
  return values.reduce((acc, val, i) => (i === 0 ? val : alpha * val + (1 - alpha) * acc))
}

export const ALPHA = {
  nba: 0.85, // High variance, role shifts fast, B2B decays in ~3 games
  mlb: 0.70, // Daily play, smaller per-game variance
  nfl: 0.90, // 17 games only — each game is high-information
} as const

/**
 * Returns deviation of EWMA from prop line as a percentage.
 * Positive = trending OVER, Negative = trending UNDER.
 */
export function ewmaVsLine(values: number[], alpha: number, line: number): number {
  if (line === 0) return 0
  return ((ewma(values, alpha) - line) / line) * 100
}
