/**
 * Access tiers for HeatCheck HQ dashboards:
 *
 * "public"  — No account needed (NRFI, Weather, First Basket)
 * "free"    — Free account required (NBA Def vs Position, all Trends pages)
 * "pro"     — Paid $12/mo subscription (Hitting Stats, Pitching Stats, Hot Hitters, H2H, NFL Matchup)
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
  { pattern: "/nba/defense-vs-position", tier: "free", label: "Defense vs Position" },
  { pattern: "/mlb/trends", tier: "free", label: "MLB Trends" },
  { pattern: "/nba/trends", tier: "free", label: "NBA Trends" },
  { pattern: "/nfl/trends", tier: "free", label: "NFL Trends" },

  // Pro subscription required
  { pattern: "/mlb/hitting-stats", tier: "pro", label: "Hitting Stats" },
  { pattern: "/mlb/pitching-stats", tier: "pro", label: "Pitching Stats" },
  { pattern: "/mlb/hot-hitters", tier: "pro", label: "Hot Hitters" },
  { pattern: "/nba/head-to-head", tier: "pro", label: "Head-to-Head" },
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
