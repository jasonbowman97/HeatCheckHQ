/**
 * Access tiers for HeatCheck HQ dashboards:
 *
 * "public"  — No account needed (NRFI, Weather, First Basket)
 * "free"    — Free account required (All NBA dashboards, Prop Analyzer, MLB Due for HR, NFL DVP)
 * "pro"     — Paid subscription (Alerts, MLB Streaks/Hot Hitters/Hitting/Pitching, NFL Matchup/Streaks)
 */

export type AccessTier = "public" | "free" | "pro"

export interface RouteAccess {
  pattern: string
  tier: AccessTier
  label: string
}

export const ROUTE_ACCESS: RouteAccess[] = [
  // Public - no account needed
  { pattern: "/mlb/nrfi", tier: "public", label: "NRFI" },
  { pattern: "/mlb/weather", tier: "public", label: "Weather" },
  { pattern: "/nba/first-basket", tier: "public", label: "First Basket" },

  // Free account required
  { pattern: "/check", tier: "free", label: "Prop Analyzer" },
  { pattern: "/mlb/due-for-hr", tier: "free", label: "Due for HR" },
  { pattern: "/nba/defense-vs-position", tier: "free", label: "Defense vs Position" },
  { pattern: "/nfl/defense-vs-position", tier: "free", label: "NFL Defense vs Position" },
  { pattern: "/nba/head-to-head", tier: "free", label: "Head-to-Head" },
  { pattern: "/nba/streaks", tier: "free", label: "NBA Streak Tracker" },

  // Pro subscription required — core features
  { pattern: "/alerts", tier: "pro", label: "Alerts" },
  { pattern: "/criteria", tier: "pro", label: "Alerts" },
  { pattern: "/heatcheck", tier: "pro", label: "The HeatCheck" },

  // Pro subscription required — existing dashboards
  { pattern: "/mlb/streaks", tier: "pro", label: "MLB Streak Tracker" },
  { pattern: "/nfl/streaks", tier: "pro", label: "NFL Streak Tracker" },
  { pattern: "/mlb/hitting-stats", tier: "pro", label: "Hitter vs Pitcher" },
  { pattern: "/mlb/pitching-stats", tier: "pro", label: "Pitching Stats" },
  { pattern: "/mlb/hot-hitters", tier: "pro", label: "Hot Hitters" },
  { pattern: "/nfl/matchup", tier: "pro", label: "NFL Matchup" },
]

export function getRouteAccess(pathname: string): RouteAccess | null {
  return ROUTE_ACCESS.find((r) => pathname.startsWith(r.pattern)) ?? null
}

export function canAccess(
  routeTier: AccessTier,
  userTier: "anonymous" | "free" | "pro"
): boolean {
  if (routeTier === "public") return true
  if (routeTier === "free") return userTier === "free" || userTier === "pro"
  if (routeTier === "pro") return userTier === "pro"
  return false
}
