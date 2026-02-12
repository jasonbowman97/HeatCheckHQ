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

export async function fetchTodayLineups(): Promise<NBALineupGame[]> {
  const dateStr = todayDateStr()

  // Return cache if same day
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
