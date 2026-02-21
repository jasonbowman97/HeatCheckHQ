/**
 * Matchup data types and helpers for the Hitter vs Pitcher dashboard.
 *
 * All data is now fetched from the MLB Stats API via /api/mlb/matchup.
 * This file provides shared types and client-side aggregation utilities.
 */

import type {
  PitchArsenalEntry,
  PitcherPlatoonSplit,
  PlatoonSplit,
  H2HStats,
  PitcherSeasonStats,
  BatterSeasonStats,
} from "@/lib/mlb-api"

/* ------------------------------------------------------------------ */
/*  Re-export API types for convenience                                */
/* ------------------------------------------------------------------ */

export type { PitchArsenalEntry, PitcherPlatoonSplit, PlatoonSplit, H2HStats, PitcherSeasonStats, BatterSeasonStats }

/* ------------------------------------------------------------------ */
/*  Matchup panel types                                                */
/* ------------------------------------------------------------------ */

export interface PitchArsenal {
  pitchType: string
  usagePct: number
  avgVelocity: number
}

export interface Pitcher {
  id: number
  name: string
  team: string
  hand: "R" | "L"
  arsenal: PitchArsenal[]
  seasonStats?: PitcherSeasonStats | null
  vsLHB?: PitcherPlatoonSplit | null
  vsRHB?: PitcherPlatoonSplit | null
}

/* ------------------------------------------------------------------ */
/*  Aggregated batter stats (consumed by PlayersTable)                 */
/* ------------------------------------------------------------------ */

export interface AggregatedBatterStats {
  playerId: string
  name: string
  position: string
  team: string
  batSide: "L" | "R" | "S"
  abs: number
  avg: number
  obp: number
  slg: number
  ops: number
  hr: number
  doubles: number
  triples: number
  rbi: number
  strikeOuts: number
  baseOnBalls: number
  // H2H vs this specific pitcher (career)
  h2hABs: number
  h2hAvg: number
  h2hHR: number
  h2hOPS: number
  // Season stats for context
  seasonABs: number
  seasonAvg: number
  seasonOPS: number
}

/* ------------------------------------------------------------------ */
/*  API response types (mirrors the /api/mlb/matchup response)         */
/* ------------------------------------------------------------------ */

export interface MatchupPitcher {
  id: number
  name: string
  team: string
  hand: "L" | "R"
  seasonStats: PitcherSeasonStats | null
  arsenal: PitchArsenalEntry[]
  vsLHB: PitcherPlatoonSplit | null
  vsRHB: PitcherPlatoonSplit | null
}

export interface MatchupBatter {
  id: number
  name: string
  position: string
  batSide: "L" | "R" | "S"
  team: string
  vsLHP: PlatoonSplit | null
  vsRHP: PlatoonSplit | null
  vsThisPitcher: H2HStats | null
  seasonStats: BatterSeasonStats | null
}

export interface MatchupResponse {
  pitcher: MatchupPitcher
  batters: MatchupBatter[]
  season: number
}

/* ------------------------------------------------------------------ */
/*  Build aggregated rows for the PlayersTable                         */
/* ------------------------------------------------------------------ */

/**
 * Convert the API matchup response into the AggregatedBatterStats[]
 * format that PlayersTable expects.
 *
 * For each batter, picks the relevant platoon split based on pitcher hand:
 *  - Pitcher is RHP → use batter's "vs RHP" split
 *  - Pitcher is LHP → use batter's "vs LHP" split
 *  - Switch hitters use the appropriate side
 */
export function buildMatchupRows(
  batters: MatchupBatter[],
  pitcherHand: "L" | "R"
): AggregatedBatterStats[] {
  return batters
    .map((b) => {
      // Select the relevant platoon split
      const split = pitcherHand === "L" ? b.vsLHP : b.vsRHP
      const h2h = b.vsThisPitcher
      const season = b.seasonStats

      return {
        playerId: String(b.id),
        name: b.name,
        position: b.position,
        team: b.team,
        batSide: b.batSide,
        // Platoon split stats (primary display)
        abs: split?.atBats ?? 0,
        avg: split?.avg ?? 0,
        obp: split?.obp ?? 0,
        slg: split?.slg ?? 0,
        ops: split?.ops ?? 0,
        hr: split?.homeRuns ?? 0,
        doubles: split?.doubles ?? 0,
        triples: split?.triples ?? 0,
        rbi: split?.rbi ?? 0,
        strikeOuts: split?.strikeOuts ?? 0,
        baseOnBalls: split?.baseOnBalls ?? 0,
        // H2H context
        h2hABs: h2h?.atBats ?? 0,
        h2hAvg: h2h?.avg ?? 0,
        h2hHR: h2h?.homeRuns ?? 0,
        h2hOPS: h2h?.ops ?? 0,
        // Season context
        seasonABs: season?.atBats ?? 0,
        seasonAvg: season?.avg ?? 0,
        seasonOPS: season?.ops ?? 0,
      }
    })
    .sort((a, b) => b.ops - a.ops) // Sort by OPS descending
}

/**
 * Convert PitchArsenalEntry[] from the API to the PitchArsenal[] format
 * used by the MatchupPanel component.
 */
export function toPanelArsenal(entries: PitchArsenalEntry[]): PitchArsenal[] {
  return entries.map((e) => ({
    pitchType: e.pitchName,
    usagePct: e.usagePct,
    avgVelocity: e.avgVelocity,
  }))
}
