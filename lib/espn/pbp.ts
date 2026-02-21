/* ──────────────────────────────────────────
   ESPN Play-by-Play Fetcher & Event Extractor
   Powers: First Basket, First Team FG, First 3 Min,
           2H First Basket, 2H First Team FG dashboards
   ────────────────────────────────────────── */

const CORE_BASE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba"

// ──── Types ────

/** Raw play object from ESPN PBP API */
interface ESPNPlay {
  id: string
  sequenceNumber: string
  type: { id: string; text: string }
  text: string
  awayScore: number
  homeScore: number
  period: { number: number; displayValue: string }
  clock: { value: number; displayValue: string }
  scoringPlay: boolean
  shootingPlay: boolean
  scoreValue: number
  team?: { $ref: string }
  participants?: {
    athlete?: { $ref: string }
    type: string
    order: number
  }[]
  wallclock?: string
  coordinate?: { x: number; y: number }
  pointsAttempted?: number
}

/** Paginated PBP response */
interface ESPNPBPResponse {
  count: number
  pageIndex: number
  pageSize: number
  pageCount: number
  items: ESPNPlay[]
}

/** Game metadata passed in from scoreboard */
export interface GameMetadata {
  gameId: string
  gameDate: string       // YYYY-MM-DD
  season: number         // e.g. 2025
  homeTeam: string       // abbreviation e.g. "LAL"
  awayTeam: string       // abbreviation e.g. "BOS"
  homeTeamId: string     // ESPN team ID e.g. "13"
  awayTeamId: string     // ESPN team ID e.g. "2"
}

/** Extracted event ready for Supabase insert */
export interface PBPGameEvent {
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

// ──── Fetch PBP from ESPN ────

/**
 * Fetch all play-by-play data for an NBA game.
 * Handles pagination (most games have 400-500 plays, returned in 300-play pages).
 */
export async function fetchNBAPBP(eventId: string): Promise<ESPNPlay[]> {
  const allPlays: ESPNPlay[] = []
  let page = 1

  while (true) {
    const url = `${CORE_BASE}/events/${eventId}/competitions/${eventId}/plays?limit=300&page=${page}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store", // PBP data is for ingestion, not ISR
      })

      if (!res.ok) {
        throw new Error(`ESPN PBP API ${res.status} for event ${eventId} page ${page}`)
      }

      const data: ESPNPBPResponse = await res.json()
      allPlays.push(...data.items)

      if (page >= data.pageCount) break
      page++
    } finally {
      clearTimeout(timeout)
    }
  }

  return allPlays
}

// ──── Extract Events ────

/**
 * Parse team ID from an ESPN $ref URL.
 * e.g. "http://sports.core.api.espn.com/.../teams/29?..." → "29"
 */
function parseTeamIdFromRef(ref: string): string | null {
  const match = ref.match(/\/teams\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Parse athlete ID from an ESPN $ref URL.
 * e.g. "http://sports.core.api.espn.com/.../athletes/4277961?..." → "4277961"
 */
function parseAthleteIdFromRef(ref: string): string | null {
  const match = ref.match(/\/athletes\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extract athlete name from play text.
 * ESPN play text format: "LeBron James makes 10-foot pullup jump shot"
 * We grab everything before " makes", " misses", " blocks", etc.
 */
function extractAthleteNameFromText(text: string): string | null {
  // For scoring plays: "Name makes ..."
  const makeMatch = text.match(/^(.+?)\s+makes\s+/)
  if (makeMatch) return makeMatch[1]

  // For missed shots: "Name misses ..."
  const missMatch = text.match(/^(.+?)\s+misses\s+/)
  if (missMatch) return missMatch[1]

  // For free throws: "Name makes free throw 1 of 2"
  const ftMatch = text.match(/^(.+?)\s+makes\s+free\s+throw/)
  if (ftMatch) return ftMatch[1]

  return null
}

/**
 * Normalize ESPN play type text to a simpler event type.
 */
function normalizeEventType(typeText: string): string {
  const lower = typeText.toLowerCase()
  if (lower.includes("three point") || lower.includes("3pt")) return "three_pointer"
  if (lower.includes("free throw")) return "free_throw"
  if (lower.includes("dunk")) return "dunk"
  if (lower.includes("layup")) return "layup"
  if (lower.includes("tip shot") || lower.includes("tip dunk")) return "tip_shot"
  if (lower.includes("hook")) return "hook_shot"
  if (lower.includes("jump shot") || lower.includes("jumper")) return "field_goal"
  if (lower.includes("floating")) return "floater"
  return "field_goal" // default for other shot types
}

/**
 * Extract game events from raw ESPN PBP plays.
 * Filters to scoring plays + shot attempts only (ignores rebounds, fouls, etc.)
 *
 * @param plays Raw ESPN play objects
 * @param meta Game metadata from scoreboard (provides team ID → abbreviation mapping)
 * @returns Array of events ready for Supabase insert
 */
export function extractGameEvents(
  plays: ESPNPlay[],
  meta: GameMetadata
): PBPGameEvent[] {
  // Build team ID → abbreviation map from scoreboard metadata
  const teamIdToAbbr: Record<string, string> = {
    [meta.homeTeamId]: meta.homeTeam,
    [meta.awayTeamId]: meta.awayTeam,
  }

  const events: PBPGameEvent[] = []

  for (const play of plays) {
    // Only include shot attempts (made + missed)
    if (!play.shootingPlay) continue

    // Resolve team abbreviation from $ref
    let teamAbbr = ""
    if (play.team?.$ref) {
      const teamId = parseTeamIdFromRef(play.team.$ref)
      if (teamId && teamIdToAbbr[teamId]) {
        teamAbbr = teamIdToAbbr[teamId]
      }
    }
    if (!teamAbbr) continue // Skip plays with unresolvable team

    // Resolve athlete ID from the shooter participant
    let athleteId: string | null = null
    const shooter = play.participants?.find((p) => p.type === "shooter")
    if (shooter?.athlete?.$ref) {
      athleteId = parseAthleteIdFromRef(shooter.athlete.$ref)
    }

    // Extract athlete name from play text
    const athleteName = play.text ? extractAthleteNameFromText(play.text) : null

    events.push({
      game_id: meta.gameId,
      game_date: meta.gameDate,
      season: meta.season,
      home_team: meta.homeTeam,
      away_team: meta.awayTeam,
      period: play.period.number,
      clock_seconds: play.clock.value,
      event_type: normalizeEventType(play.type.text),
      scoring_play: play.scoringPlay,
      score_value: play.scoringPlay ? play.scoreValue : null,
      athlete_id: athleteId,
      athlete_name: athleteName,
      team: teamAbbr,
      play_text: play.text || null,
      home_score: play.homeScore ?? null,
      away_score: play.awayScore ?? null,
    })
  }

  return events
}

// ──── Scoreboard Helpers ────

/** Parse the scoreboard API response to extract game metadata for completed games */
export function extractCompletedGames(
  scoreboardData: Record<string, unknown>,
  dateStr: string // YYYY-MM-DD format
): GameMetadata[] {
  const events = (scoreboardData as { events?: unknown[] }).events ?? []
  const games: GameMetadata[] = []

  for (const event of events as Record<string, unknown>[]) {
    const competitions = (event.competitions ?? []) as Record<string, unknown>[]
    if (competitions.length === 0) continue

    const comp = competitions[0]

    // Check if game is completed
    const status = comp.status as Record<string, unknown> | undefined
    const statusType = status?.type as Record<string, unknown> | undefined
    if (!statusType?.completed) continue

    const competitors = (comp.competitors ?? []) as Record<string, unknown>[]
    if (competitors.length < 2) continue

    // Identify home and away teams
    const home = competitors.find((c) => c.homeAway === "home")
    const away = competitors.find((c) => c.homeAway === "away")
    if (!home || !away) continue

    const homeTeam = home.team as Record<string, unknown> | undefined
    const awayTeam = away.team as Record<string, unknown> | undefined
    if (!homeTeam || !awayTeam) continue

    // Determine season from the scoreboard date
    // NBA season: Oct-Jun, season year = the year the season ends
    const date = new Date(dateStr)
    const month = date.getMonth() + 1 // 1-indexed
    const year = date.getFullYear()
    const season = month >= 10 ? year + 1 : year

    games.push({
      gameId: String(event.id ?? ""),
      gameDate: dateStr,
      season,
      homeTeam: String(homeTeam.abbreviation ?? ""),
      awayTeam: String(awayTeam.abbreviation ?? ""),
      homeTeamId: String(homeTeam.id ?? ""),
      awayTeamId: String(awayTeam.id ?? ""),
    })
  }

  return games
}
