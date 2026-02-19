/**
 * Baseball Savant (Statcast) data fetcher.
 *
 * Fetches the Custom Leaderboard CSV for qualified batters and parses it
 * into a typed array. In-memory cache with 12-hour TTL keeps the
 * server-side cost near zero on repeat requests.
 */

export interface SavantBatter {
  playerId: number
  name: string
  age: number
  pa: number
  hr: number
  barrelPct: number
  hardHitPct: number
  avgEV: number
  maxEV: number
  sweetSpotPct: number
  xSLG: number
  slg: number
  xSLGDiff: number
  xBA: number
  ba: number
  xwOBA: number
  wOBA: number
  image: string
}

/* ─── In-memory cache ─── */

const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

let cache: { data: SavantBatter[]; year: number; ts: number } | null = null

/* ─── CSV helpers ─── */

/**
 * Parse a single CSV line, handling quoted fields that may contain commas.
 * Baseball Savant wraps "Last, First" name fields in double quotes.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

/** Safe number parser — returns 0 for empty / non-numeric values */
function num(val: string): number {
  const n = parseFloat(val)
  return Number.isFinite(n) ? n : 0
}

/**
 * "Last, First" → "First Last"
 * If name doesn't contain a comma, return as-is.
 */
function flipName(raw: string): string {
  if (!raw.includes(",")) return raw.trim()
  const [last, first] = raw.split(",").map((s) => s.trim())
  return `${first} ${last}`
}

/* ─── Public API ─── */

export async function fetchSavantBatters(year?: number): Promise<{ players: SavantBatter[]; year: number }> {
  const yr = year ?? new Date().getFullYear()

  // Return cached data if fresh
  if (cache && cache.year === yr && Date.now() - cache.ts < CACHE_TTL_MS) {
    return { players: cache.data, year: yr }
  }

  const url =
    `https://baseballsavant.mlb.com/leaderboard/custom?year=${yr}&type=batter&filter=&min=q` +
    `&selections=player_age,pa,home_run,barrel_batted_rate,hard_hit_percent,avg_best_speed,avg_hyper_speed,sweet_spot_percent,xslg,slg_percent,xba,batting_avg,xwoba,woba` +
    `&sort=barrel_batted_rate&sortDir=desc&csv=true`

  const res = await fetch(url, {
    next: { revalidate: 43200 },
    headers: { "User-Agent": "HeatCheckHQ/1.0" },
  })

  if (!res.ok) {
    throw new Error(`Savant CSV fetch failed: ${res.status}`)
  }

  let text = await res.text()

  // Strip BOM character that Baseball Savant prepends
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  const lines = text.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    throw new Error("Savant CSV: no data rows")
  }

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/"/g, "").trim())

  const col = (name: string): number => {
    const idx = header.indexOf(name)
    if (idx === -1) throw new Error(`Savant CSV: missing column "${name}"`)
    return idx
  }

  // Map header names to indices
  const colName = header.findIndex((h) => h.includes("last_name") || h.includes("first_name") || h === "last_name, first_name")
  const colId = col("player_id")
  const colAge = col("player_age")
  const colPA = col("pa")
  const colHR = col("home_run")
  const colBarrel = col("barrel_batted_rate")
  const colHardHit = col("hard_hit_percent")
  const colAvgEV = col("avg_best_speed")
  const colMaxEV = col("avg_hyper_speed")
  const colSweetSpot = col("sweet_spot_percent")
  const colXSLG = col("xslg")
  const colSLG = col("slg_percent")
  const colXBA = col("xba")
  const colBA = col("batting_avg")
  const colXwOBA = col("xwoba")
  const colWOBA = col("woba")

  const players: SavantBatter[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.length < header.length) continue

    const playerId = parseInt(fields[colId], 10)
    const rawName = colName >= 0 ? fields[colName] : ""
    const xSLG = num(fields[colXSLG])
    const slg = num(fields[colSLG])

    players.push({
      playerId,
      name: flipName(rawName),
      age: num(fields[colAge]),
      pa: num(fields[colPA]),
      hr: num(fields[colHR]),
      barrelPct: num(fields[colBarrel]),
      hardHitPct: num(fields[colHardHit]),
      avgEV: num(fields[colAvgEV]),
      maxEV: num(fields[colMaxEV]),
      sweetSpotPct: num(fields[colSweetSpot]),
      xSLG,
      slg,
      xSLGDiff: Math.round((xSLG - slg) * 1000) / 1000,
      xBA: num(fields[colXBA]),
      ba: num(fields[colBA]),
      xwOBA: num(fields[colXwOBA]),
      wOBA: num(fields[colWOBA]),
      image: `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`,
    })
  }

  cache = { data: players, year: yr, ts: Date.now() }
  return { players, year: yr }
}
