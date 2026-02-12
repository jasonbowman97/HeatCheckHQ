import { NextResponse } from "next/server"
import { getHotHitters } from "@/lib/hot-hitters"
import { getMLBScoreboard } from "@/lib/espn/mlb"

// Cache the response for 12 hours since scanning all players is expensive
export const revalidate = 43200

// In-memory cache to avoid re-scanning during the same server lifetime
let cachedData: { data: Awaited<ReturnType<typeof getHotHitters>>; todayTeams: TodayGame[]; timestamp: number } | null = null
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

export interface TodayGame {
  homeTeam: string
  awayTeam: string
  gameTime: string
  /** Probable pitchers: { team: pitcherName } */
  probables: Record<string, string>
}

/** Extract today's games and probable starters from scoreboard */
async function getTodayGames(): Promise<TodayGame[]> {
  try {
    const { events } = await getMLBScoreboard()
    const games: TodayGame[] = []

    for (const event of events as Array<Record<string, unknown>>) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      const comp = competitions[0]
      if (!comp) continue

      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>
      const home = competitors.find((c) => c.homeAway === "home")
      const away = competitors.find((c) => c.homeAway === "away")
      const homeTeam = (home?.team as Record<string, unknown>)?.abbreviation as string ?? ""
      const awayTeam = (away?.team as Record<string, unknown>)?.abbreviation as string ?? ""

      const probables: Record<string, string> = {}

      // Extract probable pitchers from each competitor
      for (const competitor of competitors) {
        const team = (competitor.team as Record<string, unknown>)?.abbreviation as string ?? ""
        const probs = (competitor.probables ?? []) as Array<Record<string, unknown>>
        if (probs.length > 0) {
          const pitcherName = (probs[0].displayName as string) ?? (probs[0].shortDisplayName as string) ?? ""
          if (pitcherName) probables[team] = pitcherName
        }
      }

      games.push({
        homeTeam,
        awayTeam,
        gameTime: (event.date as string) ?? "",
        probables,
      })
    }

    return games
  } catch {
    return []
  }
}

export async function GET() {
  try {
    // Return cached data if still fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({ streaks: cachedData.data, todayGames: cachedData.todayTeams, cached: true })
    }

    const [streaks, todayGames] = await Promise.all([
      getHotHitters(),
      getTodayGames(),
    ])

    cachedData = { data: streaks, todayTeams: todayGames, timestamp: Date.now() }

    return NextResponse.json({ streaks, todayGames, cached: false })
  } catch (err) {
    console.error("[API] Hot hitters error:", err)
    return NextResponse.json({ streaks: [], todayGames: [], error: "Failed to fetch hot hitters" }, { status: 500 })
  }
}
