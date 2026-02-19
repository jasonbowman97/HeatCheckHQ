import { NextRequest, NextResponse } from "next/server"
import {
  getPitchArsenal,
  getBatterPlatoonSplits,
  getBatterVsPitcherH2H,
  getTeamRoster,
  getPitcherSeasonStats,
  getBatterSeasonStats,
  type PitchArsenalEntry,
  type PlatoonSplit,
  type H2HStats,
  type PitcherSeasonStats,
  type BatterSeasonStats,
} from "@/lib/mlb-api"
import { cacheHeader, CACHE } from "@/lib/cache"

// Cache for 12 hours
export const revalidate = 43200

/* ------------------------------------------------------------------ */
/*  In-memory cache                                                    */
/* ------------------------------------------------------------------ */

interface CachedResult {
  data: MatchupResponse
  timestamp: number
}

const cache = new Map<string, CachedResult>()
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

/* ------------------------------------------------------------------ */
/*  Response types                                                     */
/* ------------------------------------------------------------------ */

export interface MatchupPitcher {
  id: number
  name: string
  team: string
  hand: "L" | "R"
  seasonStats: PitcherSeasonStats | null
  arsenal: PitchArsenalEntry[]
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
/*  Batch helper                                                       */
/* ------------------------------------------------------------------ */

async function batchProcess<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 8
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(batch.map(fn))
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value)
      }
    }
  }
  return results
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pitcherId = Number(searchParams.get("pitcherId"))
    const teamId = Number(searchParams.get("teamId"))
    const pitcherHand = (searchParams.get("hand") ?? "R") as "L" | "R"
    const pitcherName = searchParams.get("pitcherName") ?? "Unknown"
    const pitcherTeam = searchParams.get("pitcherTeam") ?? "???"
    const season = Number(searchParams.get("season")) || new Date().getFullYear()

    if (!pitcherId || !teamId) {
      return NextResponse.json(
        { error: "pitcherId and teamId are required" },
        { status: 400 }
      )
    }

    // Check in-memory cache
    const cacheKey = `${pitcherId}-${teamId}-${season}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const res = NextResponse.json(cached.data)
      res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
      return res
    }

    // Phase 1: Fetch pitcher data + roster in parallel
    const [arsenal, roster, pitcherStats] = await Promise.all([
      getPitchArsenal(pitcherId, season),
      getTeamRoster(teamId, season),
      getPitcherSeasonStats(pitcherId, season),
    ])

    // Phase 2: Batch-fetch batter data
    const batterData = await batchProcess(roster, async (player) => {
      const [splits, h2h, seasonStats] = await Promise.all([
        getBatterPlatoonSplits(player.id, season),
        getBatterVsPitcherH2H(player.id, pitcherId, season),
        getBatterSeasonStats(player.id, season),
      ])

      const vsLHP = splits.find((s) => s.split === "vs LHP") ?? null
      const vsRHP = splits.find((s) => s.split === "vs RHP") ?? null

      return {
        id: player.id,
        name: player.fullName,
        position: player.position,
        batSide: player.batSide,
        team: pitcherTeam === "???" ? "" : "", // The batter's team is the teamId's team
        vsLHP,
        vsRHP,
        vsThisPitcher: h2h.career,
        seasonStats,
      } satisfies MatchupBatter
    })

    // Build the batting team abbreviation from the first roster player's data
    // or we can pass it through — for now use a placeholder that the client fills
    const battingTeamAbbr = searchParams.get("battingTeam") ?? ""

    const response: MatchupResponse = {
      pitcher: {
        id: pitcherId,
        name: pitcherName,
        team: pitcherTeam,
        hand: pitcherHand,
        seasonStats: pitcherStats,
        arsenal,
      },
      batters: batterData.map((b) => ({ ...b, team: battingTeamAbbr })),
      season,
    }

    // Store in cache
    cache.set(cacheKey, { data: response, timestamp: Date.now() })

    const res = NextResponse.json(response)
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (err) {
    console.error("[API] Matchup error:", err)
    return NextResponse.json(
      { error: "Failed to fetch matchup data", detail: String(err) },
      { status: 500 }
    )
  }
}
