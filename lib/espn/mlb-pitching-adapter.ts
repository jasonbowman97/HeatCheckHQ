/* ──────────────────────────────────────────
   Pitching Data Adapter
   Fetches from ESPN, falls back to static data.
   Maps ESPN response to PitcherStats shape.
   ────────────────────────────────────────── */
import "server-only"

import { getMLBPitchingLeaders } from "./mlb"
import { pitchers as staticPitchers } from "@/lib/pitching-data"
import type { PitcherStats } from "@/lib/pitching-data"

export async function getLivePitchingStats(): Promise<PitcherStats[]> {
  try {
    const espnPitchers = await getMLBPitchingLeaders()

    if (!espnPitchers.length) {
      console.log("[ESPN] No pitching data returned, using static fallback")
      return staticPitchers
    }

    // Convert ESPN data to PitcherStats shape
    const pitcherStats: PitcherStats[] = espnPitchers.slice(0, 30).map((p) => {
      // Try to find matching static pitcher for arsenal data
      const staticMatch = staticPitchers.find(
        (sp) => sp.name.toLowerCase() === p.name.toLowerCase() || sp.team === p.team
      )

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        hand: p.hand,
        era: p.era,
        kPerGame: p.ip > 0 ? Number(((p.so / (p.ip / 9)) * 1).toFixed(1)) : 0,
        kPct: p.ip > 0 ? Number(((p.kPer9 / 9) * 100).toFixed(1)) : 0,
        cswPct: 0, // ESPN doesn't provide CSW%
        inningsPitched: p.ip,
        oppKPctL30: 0, // not available from ESPN
        hr9: p.ip > 0 ? Number(((p.hr / p.ip) * 9).toFixed(2)) : 0,
        barrelPct: 0, // not available from ESPN
        hardHitPct: 0, // not available from ESPN
        hrFbPct: 0,
        flyBallPct: 0,
        pulledAirPct: 0,
        arsenal: staticMatch?.arsenal ?? [],
      }
    })

    return pitcherStats.length > 0 ? pitcherStats : staticPitchers
  } catch (err) {
    console.error("[ESPN] Pitching adapter error, using static fallback:", err)
    return staticPitchers
  }
}
