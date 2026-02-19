/**
 * Centralized cache duration constants (in seconds).
 * Used for both Next.js `revalidate` and HTTP `Cache-Control` headers.
 */
export const CACHE = {
  /** Real-time data: schedules, live scores (60 seconds) */
  LIVE: 60,
  /** Semi-live data: DVP matchups, H2H, NFL matchup (5 minutes) */
  SEMI_LIVE: 300,
  /** Trends data: streaks, trends (1 hour) */
  TRENDS: 3600,
  /** Weather data (30 minutes) */
  WEATHER: 1800,
  /** Static daily data: leaders, batting, pitching, NRFI, first basket (12 hours) */
  DAILY: 43200,
} as const

/**
 * Build standard Cache-Control header value.
 * Uses `s-maxage` for CDN caching and `stale-while-revalidate` for instant
 * responses while the CDN re-fetches in the background.
 */
export function cacheHeader(seconds: number): string {
  // Allow CDN to serve stale for up to 5 minutes while revalidating
  const swr = Math.min(seconds, 300)
  return `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`
}
