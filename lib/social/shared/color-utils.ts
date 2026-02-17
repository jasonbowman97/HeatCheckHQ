import { COLORS, SPORT_ACCENT } from "../social-config"
import type { Sport } from "../social-config"

/** Return green/amber/red color pair based on value relative to thresholds */
export function rankColor(rank: number): { text: string; bg: string } {
  if (rank <= 5) return { text: COLORS.green, bg: COLORS.greenBg }
  if (rank <= 10) return { text: COLORS.amber, bg: COLORS.amberBg }
  return { text: COLORS.gray, bg: COLORS.grayBg }
}

/** Color for hit-rate percentages (green if >70%, amber 60-70%, red <60%) */
export function hitRateColor(pct: number): { text: string; bg: string } {
  if (pct >= 0.7) return { text: COLORS.green, bg: COLORS.greenBg }
  if (pct >= 0.6) return { text: COLORS.amber, bg: COLORS.amberBg }
  return { text: COLORS.red, bg: COLORS.redBg }
}

/** Color for streaks (positive = green, negative = red) */
export function streakColor(streak: number): string {
  if (streak > 0) return COLORS.green
  if (streak < 0) return COLORS.red
  return COLORS.muted
}

/** Color for NRFI percentage (higher = greener) */
export function nrfiColor(pct: number): { text: string; bg: string } {
  if (pct >= 70) return { text: COLORS.green, bg: COLORS.greenBg }
  if (pct >= 55) return { text: COLORS.amber, bg: COLORS.amberBg }
  return { text: COLORS.red, bg: COLORS.redBg }
}

/** Rank label for DVP sheets */
export function rankLabel(rank: number): string {
  if (rank === 1) return "DEAD LAST"
  if (rank === 2) return "2ND WORST"
  if (rank === 3) return "3RD WORST"
  return `#${rank}`
}

/* ── New utilities (Sprint 1) ── */

/** Fire emoji level based on hit rate percentage (0-1 scale) */
export function fireLevel(hitPct: number): string {
  if (hitPct >= 0.9) return "🔥🔥🔥"
  if (hitPct >= 0.8) return "🔥🔥"
  if (hitPct >= 0.7) return "🔥"
  return ""
}

/**
 * Format hit rate in "X/LY GAMES" style.
 * Example: formatHitRate(17, 20) → "17/L20 GAMES"
 */
export function formatHitRate(hits: number, window: number): string {
  return `${hits}/L${window} GAMES`
}

/** Get sport accent color for stripe/badge */
export function sportAccent(sport: Sport): string {
  return SPORT_ACCENT[sport]
}
