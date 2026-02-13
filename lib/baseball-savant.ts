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
