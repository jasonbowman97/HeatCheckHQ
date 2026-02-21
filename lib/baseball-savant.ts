/**
 * Baseball Savant (Statcast) Data
 * Fetches advanced metrics from the public Baseball Savant CSV endpoints.
 * No API key required. Data is cached via Next.js ISR.
 *
 * Provides: exit velocity, barrel%, hard-hit%, xBA, xSLG, xwOBA, whiff%
 */
import "server-only"

export interface StatcastBatter {
  playerId: number
  playerName: string
  team: string
  exitVelocity: number
  barrelPct: number
  hardHitPct: number
  xBA: number
  xSLG: number
  xwOBA: number
  whiffPct: number
  kPct: number
  bbPct: number
  batSpeed: number
  paCount: number
}

export interface StatcastPitcher {
  playerId: number
  playerName: string
  team: string
  exitVelocityAgainst: number
  barrelPctAgainst: number
  hardHitPctAgainst: number
  xBA: number
  xSLG: number
  xwOBA: number
  whiffPct: number
  kPct: number
  bbPct: number
  avgFastball: number
  paCount: number
}

/** Parse a CSV string into an array of objects */
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ""
    })
    rows.push(row)
  }

  return rows
}

function num(val: string | undefined): number {
  if (!val || val === "" || val === "null") return 0
  return Number(val) || 0
}

/**
 * Fetch Statcast batter leaderboard.
 * Returns all qualified batters with advanced metrics.
 */
export async function getStatcastBatters(minPA = 50): Promise<StatcastBatter[]> {
  try {
    const year = new Date().getFullYear()
    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?type=batter&year=${year}&position=&team=&min=${minPA}&csv=true`
    const res = await fetch(url, {
      next: { revalidate: 43200 },
      headers: { "User-Agent": "HeatCheckHQ/1.0" },
    })
    if (!res.ok) {
      console.error(`[Savant] Batter leaderboard ${res.status}`)
      return []
    }

    const csv = await res.text()
    const rows = parseCSV(csv)

    return rows.map((r) => ({
      playerId: num(r.player_id),
      playerName: r.player_name ?? r.last_name ?? "",
      team: r.team ?? r.team_name ?? "",
      exitVelocity: num(r.avg_hit_speed ?? r.exit_velocity_avg),
      barrelPct: num(r.barrel_batted_rate ?? r.brl_percent),
      hardHitPct: num(r.ev95percent ?? r.hard_hit_percent),
      xBA: num(r.est_ba ?? r.xba),
      xSLG: num(r.est_slg ?? r.xslg),
      xwOBA: num(r.est_woba ?? r.xwoba),
      whiffPct: num(r.whiff_percent ?? r.swing_miss_percent),
      kPct: num(r.k_percent),
      bbPct: num(r.bb_percent),
      batSpeed: num(r.bat_speed),
      paCount: num(r.pa ?? r.pa_count),
    })).filter((b) => b.playerId > 0)
  } catch (err) {
    console.error("[Savant] Failed to fetch batter leaderboard:", err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Pitch Arsenal by Batter Handedness (Statcast Search)               */
/* ------------------------------------------------------------------ */

export interface SavantPitchMix {
  pitchCode: string   // e.g., "FF", "SL", "CH"
  pitchName: string   // e.g., "4-Seam Fastball", "Slider"
  pitchCount: number
  usagePct: number    // 0-100
  avgVelocity: number
}

/**
 * Fetch a pitcher's pitch arsenal filtered by batter handedness.
 * Uses the Statcast Search CSV endpoint grouped by pitch type.
 * Optionally accepts a date range (e.g., "7d", "14d", "30d") to filter recent data.
 */
export async function getSavantPitchArsenalByHand(
  pitcherId: number,
  batterHand: "L" | "R",
  season?: number,
  dateRange?: string
): Promise<SavantPitchMix[]> {
  try {
    const yr = season ?? new Date().getFullYear()
    const params = new URLSearchParams({
      all: "true",
      player_type: "pitcher",
      player_id: String(pitcherId),
      hfSea: `${yr}|`,
      batter_stands: batterHand,
      hfGT: "R|", // regular season only
      group_by: "name-pitch_type",
      sort_col: "pitches",
      sort_order: "desc",
      min_pitches: "1",
      min_results: "0",
      min_pas: "0",
      chk_stats_pitches: "on",
      chk_stats_pitch_percent: "on",
      chk_stats_velocity: "on",
      type: "details",
    })

    // Add date range filtering if specified
    if (dateRange && dateRange !== "season") {
      const days = parseInt(dateRange.replace("d", ""), 10)
      if (!isNaN(days) && days > 0) {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.set("game_date_gt", startDate.toISOString().slice(0, 10))
        params.set("game_date_lt", endDate.toISOString().slice(0, 10))
      }
    }

    const url = `https://baseballsavant.mlb.com/statcast_search/csv?${params.toString()}`
    const res = await fetch(url, {
      next: { revalidate: 14400 }, // 4 hours
      headers: { "User-Agent": "HeatCheckHQ/1.0" },
    })

    if (!res.ok) {
      console.error(`[Savant] Pitch arsenal by hand ${res.status}`)
      return []
    }

    const csv = await res.text()
    if (!csv || csv.trim().length < 20) return []

    const rows = parseCSV(csv)

    // Aggregate: the CSV returns individual pitches grouped by pitch_type
    // Each row IS a pitch-type group when group_by=name-pitch_type
    const totalPitches = rows.reduce((sum, r) => sum + num(r.pitches), 0)

    return rows
      .map((r) => ({
        pitchCode: r.pitch_type ?? "",
        pitchName: r.pitch_name ?? r.pitch_type ?? "",
        pitchCount: num(r.pitches),
        usagePct: totalPitches > 0
          ? (num(r.pitches) / totalPitches) * 100
          : num(r.pitch_percent),
        avgVelocity: num(r.release_speed),
      }))
      .filter((p) => p.pitchCode && p.pitchCount > 0)
      .sort((a, b) => b.usagePct - a.usagePct)
  } catch (err) {
    console.error("[Savant] Failed to fetch pitch arsenal by hand:", err)
    return []
  }
}

/**
 * Fetch pitch arsenal splits for both batter hands in parallel.
 * Optionally accepts a date range (e.g., "7d", "14d", "30d") for recent data.
 */
export async function getSavantPitchArsenalSplits(
  pitcherId: number,
  season?: number,
  dateRange?: string
): Promise<{ vsLHB: SavantPitchMix[]; vsRHB: SavantPitchMix[] }> {
  const [vsLHB, vsRHB] = await Promise.all([
    getSavantPitchArsenalByHand(pitcherId, "L", season, dateRange),
    getSavantPitchArsenalByHand(pitcherId, "R", season, dateRange),
  ])
  return { vsLHB, vsRHB }
}

/**
 * Fetch Statcast pitcher leaderboard.
 */
export async function getStatcastPitchers(minPA = 50): Promise<StatcastPitcher[]> {
  try {
    const year = new Date().getFullYear()
    const url = `https://baseballsavant.mlb.com/leaderboard/statcast?type=pitcher&year=${year}&position=&team=&min=${minPA}&csv=true`
    const res = await fetch(url, {
      next: { revalidate: 43200 },
      headers: { "User-Agent": "HeatCheckHQ/1.0" },
    })
    if (!res.ok) {
      console.error(`[Savant] Pitcher leaderboard ${res.status}`)
      return []
    }

    const csv = await res.text()
    const rows = parseCSV(csv)

    return rows.map((r) => ({
      playerId: num(r.player_id),
      playerName: r.player_name ?? r.last_name ?? "",
      team: r.team ?? r.team_name ?? "",
      exitVelocityAgainst: num(r.avg_hit_speed ?? r.exit_velocity_avg),
      barrelPctAgainst: num(r.barrel_batted_rate ?? r.brl_percent),
      hardHitPctAgainst: num(r.ev95percent ?? r.hard_hit_percent),
      xBA: num(r.est_ba ?? r.xba),
      xSLG: num(r.est_slg ?? r.xslg),
      xwOBA: num(r.est_woba ?? r.xwoba),
      whiffPct: num(r.whiff_percent ?? r.swing_miss_percent),
      kPct: num(r.k_percent),
      bbPct: num(r.bb_percent),
      avgFastball: num(r.fastball_avg_speed ?? r.avg_speed),
      paCount: num(r.pa ?? r.pa_count),
    })).filter((p) => p.playerId > 0)
  } catch (err) {
    console.error("[Savant] Failed to fetch pitcher leaderboard:", err)
    return []
  }
}
