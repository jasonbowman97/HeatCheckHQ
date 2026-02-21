import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cacheHeader, CACHE } from "@/lib/cache"
import { getNBAScoreboard } from "@/lib/nba-api"
import type { GameWindow } from "@/components/nba/pbp/game-window-filter"

export const revalidate = 3600 // 1hr ISR

/**
 * PBP-powered First Basket / First Team FG API.
 *
 * Query params:
 * - type: "first-basket" | "first-team-fg" (default: "first-basket")
 * - window: 5 | 10 | 20 | "season" (default: "season")
 * - half: "1" | "2" (default: "1") — which half to query (1=Q1, 2=Q3)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propType = searchParams.get("type") || "first-basket"
    const windowParam = searchParams.get("window") || "season"
    const half = searchParams.get("half") || "1"

    // Determine MV category to query
    const period = half === "2" ? 3 : 1
    const category =
      propType === "first-team-fg"
        ? period === 1
          ? "q1_first_team_fg"
          : "q3_first_team_fg"
        : period === 1
          ? "q1_first_basket"
          : "q3_first_basket"

    const windowSize: GameWindow =
      windowParam === "season"
        ? "season"
        : (Number(windowParam) as 5 | 10 | 20)

    const supabase = await createClient()

    // Query the materialized view for first events
    let query = supabase
      .from("mv_game_firsts")
      .select("*")
      .eq("category", category)
      .order("game_date", { ascending: false })

    if (windowSize !== "season") {
      const { data: recentDates } = await supabase
        .from("mv_game_firsts")
        .select("game_date")
        .eq("category", category)
        .order("game_date", { ascending: false })

      if (recentDates) {
        const uniqueDates = [...new Set(recentDates.map((d: { game_date: string }) => d.game_date))]
        const cutoffDate = uniqueDates[Math.min(windowSize * 3, uniqueDates.length) - 1]
        if (cutoffDate) {
          query = query.gte("game_date", cutoffDate)
        }
      }
    }

    const { data: firstEvents, error } = await query

    if (error) {
      console.error("[PBP First Basket API]", error)
      return NextResponse.json(
        { players: [], error: error.message },
        { status: 500 }
      )
    }

    if (!firstEvents || firstEvents.length === 0) {
      const res = NextResponse.json({
        players: [],
        todayGames: [],
        updatedAt: new Date().toISOString(),
        propType,
        window: windowParam,
        half,
      })
      res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
      return res
    }

    // Aggregate per player
    const playerMap = new Map<
      string,
      {
        athleteId: string
        athleteName: string
        team: string
        firstCount: number
        gameIds: Set<string>
        gameResults: { gameId: string; date: string; opponent: string; isHome: boolean; scored: boolean }[]
        teams: Set<string>
      }
    >()

    for (const ev of firstEvents) {
      if (!ev.athlete_id) continue

      let entry = playerMap.get(ev.athlete_id)
      if (!entry) {
        entry = {
          athleteId: ev.athlete_id,
          athleteName: ev.athlete_name || "Unknown",
          team: ev.team,
          firstCount: 0,
          gameIds: new Set(),
          gameResults: [],
          teams: new Set(),
        }
        playerMap.set(ev.athlete_id, entry)
      }

      entry.firstCount++
      entry.gameIds.add(ev.game_id)
      entry.teams.add(ev.team)

      const isHome = ev.team === ev.home_team
      const opponent = isHome ? ev.away_team : ev.home_team
      entry.gameResults.push({
        gameId: ev.game_id,
        date: ev.game_date,
        opponent,
        isHome,
        scored: true,
      })
    }

    // Team game counts
    const teamGamesSet = new Map<string, Set<string>>()
    for (const ev of firstEvents) {
      for (const team of [ev.home_team, ev.away_team]) {
        if (!teamGamesSet.has(team)) teamGamesSet.set(team, new Set())
        teamGamesSet.get(team)!.add(ev.game_id)
      }
    }
    const teamGameCounts = new Map<string, number>()
    for (const [team, games] of teamGamesSet) {
      teamGameCounts.set(team, games.size)
    }

    // Today's games for matchup context
    const todayGames = await getNBAScoreboard()
    const matchupMap: Record<string, { opponent: string; isHome: boolean }> = {}
    const todayGamesList: { away: string; home: string }[] = []
    for (const g of todayGames) {
      matchupMap[g.homeTeam.abbreviation] = { opponent: g.awayTeam.abbreviation, isHome: true }
      matchupMap[g.awayTeam.abbreviation] = { opponent: g.homeTeam.abbreviation, isHome: false }
      todayGamesList.push({ away: g.awayTeam.abbreviation, home: g.homeTeam.abbreviation })
    }
    const todayTeams = new Set(Object.keys(matchupMap))

    const allGameDates = [...new Set(firstEvents.map((e: { game_date: string }) => e.game_date))]

    // Build player response — show ALL players
    const players = [...playerMap.values()]
      .map((p) => {
        const totalTeamGames = teamGameCounts.get(p.team) || 1
        let gamesInWindow = totalTeamGames
        if (windowSize !== "season") {
          gamesInWindow = Math.min(windowSize, totalTeamGames)
        }

        const rate = gamesInWindow > 0 ? (p.firstCount / gamesInWindow) * 100 : 0

        const recentResults = p.gameResults
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, typeof windowSize === "number" ? windowSize : 10)

        const matchup = matchupMap[p.team]
        const playsToday = todayTeams.has(p.team)

        const headshotUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${p.athleteId}.png&w=96&h=70&cb=1`

        return {
          athleteId: p.athleteId,
          athleteName: p.athleteName,
          team: p.team,
          headshotUrl,
          firstCount: p.firstCount,
          gamesInWindow,
          rate: Math.round(rate * 10) / 10,
          recentResults,
          opponent: matchup?.opponent || null,
          isHome: matchup?.isHome ?? false,
          playsToday,
        }
      })
      .sort((a, b) => b.rate - a.rate)

    const res = NextResponse.json({
      players,
      todayGames: todayGamesList,
      totalGameDates: allGameDates.length,
      updatedAt: new Date().toISOString(),
      propType,
      window: windowParam,
      half,
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
    return res
  } catch (e) {
    console.error("[PBP First Basket API]", e)
    return NextResponse.json({ players: [], error: String(e) }, { status: 500 })
  }
}
