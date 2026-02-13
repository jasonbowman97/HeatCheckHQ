import { getSchedule, getSeasonLinescores, computePitcherNrfi } from "@/lib/mlb-api"
import { NextRequest, NextResponse } from "next/server"
import { cacheHeader, CACHE } from "@/lib/cache"

export const revalidate = 43200

export interface NrfiPitcherData {
  id: number
  name: string
  hand: "L" | "R"
  nrfiWins: number
  nrfiLosses: number
  nrfiPct: number
  streak: number
}

export interface NrfiGameData {
  gamePk: number
  time: string
  venue: string
  away: {
    team: string
    pitcher: NrfiPitcherData | null
  }
  home: {
    team: string
    pitcher: NrfiPitcherData | null
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? undefined

  // Derive season from the requested date (defaults to current year)
  const season = date ? parseInt(date.slice(0, 4), 10) : new Date().getFullYear()

  try {
    // Fetch today's schedule + season linescore data in parallel
    const [schedule, linescores] = await Promise.all([
      getSchedule(date),
      getSeasonLinescores(season),
    ])

    const games: NrfiGameData[] = schedule.games.map((g) => {
      const time = new Date(g.gameDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York",
      })

      let awayPitcher: NrfiPitcherData | null = null
      if (g.away.probablePitcher) {
        const nrfi = computePitcherNrfi(g.away.probablePitcher.id, linescores)
        awayPitcher = {
          id: g.away.probablePitcher.id,
          name: g.away.probablePitcher.fullName,
          hand: g.away.probablePitcher.hand ?? "R",
          ...nrfi,
        }
      }

      let homePitcher: NrfiPitcherData | null = null
      if (g.home.probablePitcher) {
        const nrfi = computePitcherNrfi(g.home.probablePitcher.id, linescores)
        homePitcher = {
          id: g.home.probablePitcher.id,
          name: g.home.probablePitcher.fullName,
          hand: g.home.probablePitcher.hand ?? "R",
          ...nrfi,
        }
      }

      return {
        gamePk: g.gamePk,
        time,
        venue: g.venue,
        away: { team: g.away.abbreviation, pitcher: awayPitcher },
        home: { team: g.home.abbreviation, pitcher: homePitcher },
      }
    })

    const res = NextResponse.json({ games, date: schedule.date })
    res.headers.set("Cache-Control", cacheHeader(CACHE.DAILY))
    return res
  } catch (e) {
    console.error("[MLB NRFI API]", e)
    return NextResponse.json({ games: [], date: date ?? new Date().toISOString().slice(0, 10) }, { status: 500 })
  }
}
