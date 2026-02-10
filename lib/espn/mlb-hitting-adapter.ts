/* ──────────────────────────────────────────
   Hitting Data Adapter
   Fetches from ESPN, falls back to static data.
   Maps ESPN response to Player shape.
   ────────────────────────────────────────── */
import "server-only"

import { getMLBBattingLeaders } from "./mlb"
import { players as staticPlayers } from "@/lib/players-data"
import type { Player } from "@/lib/players-data"

export async function getLiveHittingStats(): Promise<Player[]> {
  try {
    const espnBatters = await getMLBBattingLeaders()

    if (!espnBatters.length) {
      console.log("[ESPN] No batting data returned, using static fallback")
      return staticPlayers
    }

    // Convert ESPN data to Player shape
    const players: Player[] = espnBatters.slice(0, 50).map((b) => ({
      id: b.id,
      name: b.name,
      position: b.position || "UT",
      team: b.team,
      abs: b.ab || 0,
      avg: b.avg,
      slg: b.slg,
      xbh: b.doubles + b.triples + b.hr,
      hr: b.hr,
      ballsLaunched: 0, // not from ESPN
      exitVelo: 0,       // not from ESPN
      barrelPct: 0,      // not from ESPN
      hardHitPct: 0,     // not from ESPN
      flyBallPct: 0,     // not from ESPN
      pulledAirPct: 0,   // not from ESPN
    }))

    return players.length > 0 ? players : staticPlayers
  } catch (err) {
    console.error("[ESPN] Hitting adapter error, using static fallback:", err)
    return staticPlayers
  }
}
