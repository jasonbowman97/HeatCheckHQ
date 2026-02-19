/**
 * Fetches today's NBA starting lineups from stats.nba.com.
 * Provides PG/SG/SF/PF/C position data for each starter.
 * Endpoint: https://stats.nba.com/js/data/leaders/00_daily_lineups_{YYYYMMDD}.json
 * No auth required for server-side fetches.
 */

export interface NBALineupPlayer {
  personId: number
  firstName: string
  lastName: string
  playerName: string
  position: "PG" | "SG" | "SF" | "PF" | "C" | ""
  teamAbbreviation: string
}

export interface NBALineupGame {
  gameId: string
  homeTeamAbbr: string
  awayTeamAbbr: string
  homeStarters: NBALineupPlayer[]
  awayStarters: NBALineupPlayer[]
}

/* ── Cache ── */

let cachedLineups: { data: NBALineupGame[]; date: string } | null = null

function todayDateStr(): string {
  // NBA uses Eastern Time for daily lineups
  const now = new Date()
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const yyyy = et.getFullYear()
  const mm = String(et.getMonth() + 1).padStart(2, "0")
  const dd = String(et.getDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

export async function fetchTodayLineups(date?: string): Promise<NBALineupGame[]> {
  const dateStr = date ?? todayDateStr()

  // Return cache if same date
  if (cachedLineups && cachedLineups.date === dateStr) {
    return cachedLineups.data
  }

  try {
    const url = `https://stats.nba.com/js/data/leaders/00_daily_lineups_${dateStr}.json`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.warn(`[NBA Lineups] ${res.status} for date ${dateStr}`)
      return []
    }

    const json = await res.json()
    const games: NBALineupGame[] = []

    for (const game of json.games ?? []) {
      const homeTeam = game.homeTeam
      const awayTeam = game.awayTeam
      if (!homeTeam || !awayTeam) continue

      const homeStarters: NBALineupPlayer[] = []
      const awayStarters: NBALineupPlayer[] = []

      for (const p of homeTeam.players ?? []) {
        if (p.position && p.position !== "") {
          homeStarters.push({
            personId: p.personId,
            firstName: p.firstName,
            lastName: p.lastName,
            playerName: p.playerName,
            position: p.position,
            teamAbbreviation: homeTeam.teamAbbreviation,
          })
        }
      }

      for (const p of awayTeam.players ?? []) {
        if (p.position && p.position !== "") {
          awayStarters.push({
            personId: p.personId,
            firstName: p.firstName,
            lastName: p.lastName,
            playerName: p.playerName,
            position: p.position,
            teamAbbreviation: awayTeam.teamAbbreviation,
          })
        }
      }

      games.push({
        gameId: game.gameId,
        homeTeamAbbr: homeTeam.teamAbbreviation,
        awayTeamAbbr: awayTeam.teamAbbreviation,
        homeStarters,
        awayStarters,
      })
    }

    cachedLineups = { data: games, date: dateStr }
    return games
  } catch (err) {
    console.error("[NBA Lineups] Failed to fetch:", err)
    return []
  }
}

/**
 * Get the starter at a specific position for a team in today's games.
 * Returns null if lineups aren't available or no player at that position.
 */
export function getStarterAtPosition(
  games: NBALineupGame[],
  teamAbbr: string,
  position: "PG" | "SG" | "SF" | "PF" | "C"
): NBALineupPlayer | null {
  for (const game of games) {
    if (game.homeTeamAbbr === teamAbbr) {
      return game.homeStarters.find((p) => p.position === position) ?? null
    }
    if (game.awayTeamAbbr === teamAbbr) {
      return game.awayStarters.find((p) => p.position === position) ?? null
    }
  }
  return null
}

/* ── Recent lineup position map ── */

/**
 * Maps team abbreviation → position → player name.
 * Built by scanning recent game days so every team is covered
 * even when today's lineups aren't posted yet.
 */
export type PositionMap = Map<string, Map<string, NBALineupPlayer>>

let cachedPositionMap: { data: PositionMap; timestamp: number } | null = null
const POSITION_MAP_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

function dateStrDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const et = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const yyyy = et.getFullYear()
  const mm = String(et.getMonth() + 1).padStart(2, "0")
  const dd = String(et.getDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

/**
 * Fetches lineups from the last several days to build a complete
 * team → position → player map. Most recent lineup takes priority.
 * Covers all 30 teams even during All-Star break, off days, etc.
 */
export async function fetchRecentPositionMap(): Promise<PositionMap> {
  if (cachedPositionMap && Date.now() - cachedPositionMap.timestamp < POSITION_MAP_TTL_MS) {
    return cachedPositionMap.data
  }

  const map: PositionMap = new Map()
  const DAYS_TO_CHECK = 14  // extended to cover All-Star break gap

  // Fetch most recent day first → oldest last. Most recent data wins (set first).
  for (let daysAgo = 0; daysAgo < DAYS_TO_CHECK; daysAgo++) {
    const dateStr = dateStrDaysAgo(daysAgo)

    try {
      const games = await fetchTodayLineups(dateStr)

      for (const game of games) {
        const allStarters = [
          ...game.homeStarters.map((p) => ({ ...p, teamAbbreviation: game.homeTeamAbbr })),
          ...game.awayStarters.map((p) => ({ ...p, teamAbbreviation: game.awayTeamAbbr })),
        ]

        for (const player of allStarters) {
          if (!player.position) continue
          const teamAbbr = player.teamAbbreviation

          if (!map.has(teamAbbr)) {
            map.set(teamAbbr, new Map())
          }

          const teamPositions = map.get(teamAbbr)!
          // Only set if not already populated (most recent day wins)
          if (!teamPositions.has(player.position)) {
            teamPositions.set(player.position, player)
          }
        }
      }

      // Stop early if we've covered all 30 teams with 5 positions each
      let totalCovered = 0
      for (const [, positions] of map) {
        if (positions.size >= 5) totalCovered++
      }
      if (totalCovered >= 30) break
    } catch {
      // Skip failed dates
      continue
    }
  }

  cachedPositionMap = { data: map, timestamp: Date.now() }
  console.log(`[NBA Lineups] Position map: ${map.size} teams covered`)
  return map
}

/**
 * Get the starter at a specific position for a team from the recent position map.
 * Falls back gracefully if no data is available.
 */
export function getPlayerAtPosition(
  positionMap: PositionMap,
  teamAbbr: string,
  position: "PG" | "SG" | "SF" | "PF" | "C"
): NBALineupPlayer | null {
  return positionMap.get(teamAbbr)?.get(position) ?? null
}
