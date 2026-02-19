/* ──────────────────────────────────────────
   Pitching Data Adapter (Legacy)
   This adapter is no longer actively used.
   Pitching data now comes from /api/mlb/pitching
   which uses MLB Stats API + Baseball Savant.
   ────────────────────────────────────────── */
import "server-only"

import { getMLBPitchingLeaders } from "./mlb"
import type { PitcherStats } from "@/lib/pitching-data"

export async function getLivePitchingStats(): Promise<PitcherStats[]> {
  try {
    const espnPitchers = await getMLBPitchingLeaders()

    if (!espnPitchers.length) {
      console.log("[ESPN] No pitching data returned")
      return []
    }

    const pitcherStats: PitcherStats[] = espnPitchers.slice(0, 30).map((p) => ({
      id: Number(p.id) || 0,
      name: p.name,
      team: p.team,
      hand: p.hand,
      era: p.era,
      whip: 0,
      wins: 0,
      losses: 0,
      kPer9: p.ip > 0 ? Number(((p.so / (p.ip / 9)) * 1).toFixed(1)) : 0,
      kPct: p.ip > 0 ? Number(((p.kPer9 / 9) * 100).toFixed(1)) : 0,
      inningsPitched: p.ip,
      barrelPct: 0,
      hardHitPct: 0,
      whiffPct: 0,
      arsenal: [],
    }))

    return pitcherStats
  } catch (err) {
    console.error("[ESPN] Pitching adapter error:", err)
    return []
  }
}
