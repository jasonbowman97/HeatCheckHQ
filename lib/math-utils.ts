// ============================================================
// lib/math-utils.ts — Statistical utility functions
// ============================================================

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0
  const m = mean(values)
  const squaredDiffs = values.map(v => Math.pow(v - m, 2))
  return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length)
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/**
 * Generate a Kernel Density Estimation using Gaussian kernel
 */
export function generateKDE(
  data: number[],
  bandwidth: number,
  xMin: number,
  xMax: number,
  points: number = 100
): Array<{ x: number; y: number }> {
  if (data.length === 0) return []
  const result: Array<{ x: number; y: number }> = []
  const step = (xMax - xMin) / (points - 1)

  for (let i = 0; i < points; i++) {
    const x = xMin + i * step
    let density = 0
    for (const val of data) {
      const z = (x - val) / bandwidth
      density += Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI))
    }
    result.push({ x, y: density / data.length })
  }
  return result
}

/**
 * Silverman's rule of thumb for KDE bandwidth
 */
export function silvermanBandwidth(values: number[]): number {
  const sd = stdDev(values)
  const iqr = percentile(values, 75) - percentile(values, 25)
  return 0.9 * Math.min(sd, iqr / 1.34) * Math.pow(values.length, -0.2)
}

/**
 * Calculate payout multiplier from American odds
 * e.g., -110 → 0.909, +150 → 1.5
 */
export function calculatePayoutMultiplier(americanOdds: number): number {
  if (americanOdds < 0) {
    return 100 / Math.abs(americanOdds)
  }
  return americanOdds / 100
}

/**
 * Compute a volatility score (1-10) from an array of values.
 * 1 = very consistent, 10 = extremely volatile.
 * Uses coefficient of variation (stdDev / mean) normalized to a 1-10 scale.
 */
export function computeVolatility(values: number[]): number {
  if (values.length <= 1) return 1
  const m = mean(values)
  if (m === 0) return 1
  const sd = stdDev(values)
  const cv = sd / m // coefficient of variation
  // CV ~0.1 = consistent (e.g., minutes) => 1-2
  // CV ~0.3 = moderate (e.g., points)    => 4-5
  // CV ~0.6 = volatile (e.g., steals)    => 7-8
  // CV ~1.0+ = extreme (e.g., HRs)       => 9-10
  return Math.min(10, Math.max(1, Math.round(cv * 12)))
}

/**
 * Moving average over a window
 */
export function movingAverage(values: number[], window: number): number[] {
  if (values.length === 0) return []
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const windowValues = values.slice(start, i + 1)
    result.push(mean(windowValues))
  }
  return result
}
