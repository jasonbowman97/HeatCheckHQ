/**
 * Access tiers for HeatCheck HQ dashboards:
 *
 * "public"  — No account needed (NRFI, Weather, First Basket)
 * "free"    — Free account required (NBA DVP, NFL DVP, H2H)
 * "pro"     — Paid subscription (Streak Trackers, Hot Hitters, Hitter vs Pitcher, Pitching Stats, NFL Matchup)
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
  { pattern: "/check", tier: "free", label: "Check My Prop" },
  { pattern: "/mlb/due-for-hr", tier: "free", label: "Due for HR" },
  { pattern: "/nba/defense-vs-position", tier: "free", label: "Defense vs Position" },
  { pattern: "/nfl/defense-vs-position", tier: "free", label: "NFL Defense vs Position" },
  { pattern: "/nba/head-to-head", tier: "free", label: "Head-to-Head" },

  // Pro subscription required — core features
  { pattern: "/edge-lab", tier: "pro", label: "Edge Lab" },
  { pattern: "/situation-room", tier: "pro", label: "Situation Room" },
  { pattern: "/bet-builder", tier: "pro", label: "60-Second Bet Builder" },
  { pattern: "/what-if", tier: "pro", label: "What-If Simulator" },
  { pattern: "/matchup-xray", tier: "pro", label: "Matchup X-Ray" },
  { pattern: "/graveyard", tier: "pro", label: "The Graveyard" },
  { pattern: "/correlations", tier: "pro", label: "Correlation Matrix" },
  { pattern: "/bet-board", tier: "pro", label: "Bet Board" },

  // Pro subscription required — existing dashboards
  { pattern: "/nba/streaks", tier: "pro", label: "Streak Tracker" },
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
