/**
 * Backfill NBA play-by-play data from ESPN.
 *
 * Usage:
 *   npx tsx scripts/backfill-pbp.ts --from 2025-10-28 --to 2026-02-21
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The script is idempotent — already-ingested games are skipped via ON CONFLICT DO NOTHING.
 */

import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

// Load .env.local so the script can read Supabase credentials
config({ path: ".env.local" })

// ── ESPN PBP functions (inline to avoid Next.js import issues) ──

const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports"
const CORE_BASE =
  "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba"

interface ESPNPlay {
  id: string
  type: { id: string; text: string }
  text: string
  awayScore: number
  homeScore: number
  period: { number: number }
  clock: { value: number }
  scoringPlay: boolean
  shootingPlay: boolean
  scoreValue: number
  team?: { $ref: string }
  participants?: {
    athlete?: { $ref: string }
    type: string
  }[]
}

interface GameMeta {
  gameId: string
  gameDate: string
  season: number
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
}

interface GameEvent {
  game_id: string
  game_date: string
  season: number
  home_team: string
  away_team: string
  period: number
  clock_seconds: number
  event_type: string
  scoring_play: boolean
  score_value: number | null
  athlete_id: string | null
  athlete_name: string | null
  team: string
  play_text: string | null
  home_score: number | null
  away_score: number | null
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchPBP(eventId: string): Promise<ESPNPlay[]> {
  const allPlays: ESPNPlay[] = []
  let page = 1
  while (true) {
    const data = await fetchJSON<{
      pageCount: number
      items: ESPNPlay[]
    }>(
      `${CORE_BASE}/events/${eventId}/competitions/${eventId}/plays?limit=300&page=${page}`
    )
    allPlays.push(...data.items)
    if (page >= data.pageCount) break
    page++
  }
  return allPlays
}

function parseIdFromRef(ref: string, segment: string): string | null {
  const re = new RegExp(`/${segment}/(\\d+)`)
  const m = ref.match(re)
  return m ? m[1] : null
}

function extractName(text: string): string | null {
  const m = text.match(/^(.+?)\s+(?:makes|misses)\s+/)
  return m ? m[1] : null
}

function normalizeType(t: string): string {
  const l = t.toLowerCase()
  if (l.includes("three point") || l.includes("3pt")) return "three_pointer"
  if (l.includes("free throw")) return "free_throw"
  if (l.includes("dunk")) return "dunk"
  if (l.includes("layup")) return "layup"
  if (l.includes("tip shot") || l.includes("tip dunk")) return "tip_shot"
  if (l.includes("hook")) return "hook_shot"
  if (l.includes("floating")) return "floater"
  return "field_goal"
}

function extractEvents(plays: ESPNPlay[], meta: GameMeta): GameEvent[] {
  const teamMap: Record<string, string> = {
    [meta.homeTeamId]: meta.homeTeam,
    [meta.awayTeamId]: meta.awayTeam,
  }
  const events: GameEvent[] = []

  for (const p of plays) {
    if (!p.shootingPlay) continue
    let teamAbbr = ""
    if (p.team?.$ref) {
      const tid = parseIdFromRef(p.team.$ref, "teams")
      if (tid && teamMap[tid]) teamAbbr = teamMap[tid]
    }
    if (!teamAbbr) continue

    let athleteId: string | null = null
    const shooter = p.participants?.find((x) => x.type === "shooter")
    if (shooter?.athlete?.$ref) {
      athleteId = parseIdFromRef(shooter.athlete.$ref, "athletes")
    }

    events.push({
      game_id: meta.gameId,
      game_date: meta.gameDate,
      season: meta.season,
      home_team: meta.homeTeam,
      away_team: meta.awayTeam,
      period: p.period.number,
      clock_seconds: p.clock.value,
      event_type: normalizeType(p.type.text),
      scoring_play: p.scoringPlay,
      score_value: p.scoringPlay ? p.scoreValue : null,
      athlete_id: athleteId,
      athlete_name: p.text ? extractName(p.text) : null,
      team: teamAbbr,
      play_text: p.text || null,
      home_score: p.homeScore ?? null,
      away_score: p.awayScore ?? null,
    })
  }
  return events
}

function getCompletedGames(
  scoreboardData: Record<string, unknown>,
  dateStr: string
): GameMeta[] {
  const events = (scoreboardData as { events?: unknown[] }).events ?? []
  const games: GameMeta[] = []

  for (const event of events as Record<string, unknown>[]) {
    const comps = (event.competitions ?? []) as Record<string, unknown>[]
    if (!comps.length) continue
    const comp = comps[0]
    const status = comp.status as Record<string, unknown> | undefined
    const st = status?.type as Record<string, unknown> | undefined
    if (!st?.completed) continue

    const competitors = (comp.competitors ?? []) as Record<string, unknown>[]
    const home = competitors.find((c) => c.homeAway === "home")
    const away = competitors.find((c) => c.homeAway === "away")
    if (!home || !away) continue

    const ht = home.team as Record<string, unknown>
    const at = away.team as Record<string, unknown>

    const d = new Date(dateStr)
    const mo = d.getMonth() + 1
    const yr = d.getFullYear()
    const season = mo >= 10 ? yr + 1 : yr

    games.push({
      gameId: String(event.id ?? ""),
      gameDate: dateStr,
      season,
      homeTeam: String(ht.abbreviation ?? ""),
      awayTeam: String(at.abbreviation ?? ""),
      homeTeamId: String(ht.id ?? ""),
      awayTeamId: String(at.id ?? ""),
    })
  }
  return games
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2)
  const fromIdx = args.indexOf("--from")
  const toIdx = args.indexOf("--to")

  if (fromIdx === -1 || toIdx === -1) {
    console.error("Usage: npx tsx scripts/backfill-pbp.ts --from YYYY-MM-DD --to YYYY-MM-DD")
    process.exit(1)
  }

  const fromDate = args[fromIdx + 1]
  const toDate = args[toIdx + 1]

  if (!fromDate || !toDate) {
    console.error("Missing date values")
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  })

  console.log(`\nBackfilling PBP data from ${fromDate} to ${toDate}\n`)

  let totalIngested = 0
  let totalSkipped = 0
  let totalErrors = 0

  const current = new Date(fromDate)
  const end = new Date(toDate)

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0]
    const espnDate = dateStr.replace(/-/g, "")

    process.stdout.write(`${dateStr}: `)

    try {
      const scoreboard = await fetchJSON<Record<string, unknown>>(
        `${SITE_BASE}/basketball/nba/scoreboard?dates=${espnDate}`
      )
      const games = getCompletedGames(scoreboard, dateStr)

      if (games.length === 0) {
        console.log("no games")
        current.setDate(current.getDate() + 1)
        continue
      }

      // Check existing
      const { data: existing } = await supabase
        .from("pbp_game_events")
        .select("game_id")
        .in("game_id", games.map((g) => g.gameId))
        .limit(1000)

      const existingIds = new Set(
        (existing ?? []).map((g: { game_id: string }) => g.game_id)
      )

      const newGames = games.filter((g) => !existingIds.has(g.gameId))
      totalSkipped += existingIds.size

      if (newGames.length === 0) {
        console.log(`${games.length} games (all skipped)`)
        current.setDate(current.getDate() + 1)
        continue
      }

      let dayIngested = 0
      for (const game of newGames) {
        try {
          const plays = await fetchPBP(game.gameId)
          const events = extractEvents(plays, game)

          if (events.length === 0) {
            console.log(`  [!] No events for ${game.awayTeam}@${game.homeTeam}`)
            continue
          }

          // Batch upsert
          const BATCH = 100
          for (let i = 0; i < events.length; i += BATCH) {
            const batch = events.slice(i, i + BATCH)
            const { error } = await supabase
              .from("pbp_game_events")
              .upsert(batch, {
                onConflict:
                  "game_id,period,clock_seconds,athlete_id,event_type",
                ignoreDuplicates: true,
              })
            if (error) {
              console.error(`  [ERR] ${game.gameId}: ${error.message}`)
              totalErrors++
            }
          }

          dayIngested++
          totalIngested++

          // Rate limit: 500ms between games
          await new Promise((r) => setTimeout(r, 500))
        } catch (err) {
          console.error(
            `  [ERR] ${game.gameId}: ${err instanceof Error ? err.message : err}`
          )
          totalErrors++
        }
      }

      console.log(
        `${games.length} games (${dayIngested} ingested, ${existingIds.size} skipped)`
      )
    } catch (err) {
      console.error(`FAILED: ${err instanceof Error ? err.message : err}`)
      totalErrors++
    }

    current.setDate(current.getDate() + 1)

    // Small delay between days
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\n--- Done ---`)
  console.log(`Ingested: ${totalIngested} games`)
  console.log(`Skipped: ${totalSkipped} games`)
  console.log(`Errors: ${totalErrors}`)

  // Refresh materialized view
  if (totalIngested > 0) {
    console.log("\nRefreshing materialized view...")
    const { error } = await supabase.rpc("refresh_mv_game_firsts")
    if (error) {
      console.error("Failed to refresh MV:", error.message)
    } else {
      console.log("Materialized view refreshed.")
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
