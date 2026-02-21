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

    // Calculate date cutoff for game window
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
      // Get last N game dates (not N rows — multiple players can score "first" per game for team FG)
      const { data: recentDates } = await supabase
        .from("mv_game_firsts")
        .select("game_date")
        .eq("category", category)
        .order("game_date", { ascending: false })

      if (recentDates) {
        const uniqueDates = [...new Set(recentDates.map((d: { game_date: string }) => d.game_date))]
        // For "first-team-fg" each game has ~2 entries; for "first-basket" each has 1
        // We want the last N game-days worth of games
        // But since we're player-centric, we actually want "last N games per player"
        // For simplicity, limit to the last N * 3 calendar dates (covers most scenarios)
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
        updatedAt: new Date().toISOString(),
        propType,
        window: windowParam,
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

      // Determine opponent and home/away
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

    // Now we need to know the total games each player could have played
    // For first-team-fg: every game the player's team played, they had a chance
    // For first-basket: every game period

    // Get all unique game dates for the window to calculate total possible games
    const allGameDates = [...new Set(firstEvents.map((e: { game_date: string }) => e.game_date))]

    // For each team, count how many games they played in this window
    const teamGameCounts = new Map<string, number>()
    const teamGamesSet = new Map<string, Set<string>>()

    for (const ev of firstEvents) {
      for (const team of [ev.home_team, ev.away_team]) {
        if (!teamGamesSet.has(team)) {
          teamGamesSet.set(team, new Set())
        }
        teamGamesSet.get(team)!.add(ev.game_id)
      }
    }
    for (const [team, games] of teamGamesSet) {
      teamGameCounts.set(team, games.size)
    }

    // Get today's games for matchup context
    const todayGames = await getNBAScoreboard()

    // Build matchup map
    const matchupMap: Record<string, { opponent: string; isHome: boolean }> = {}
    for (const g of todayGames) {
      matchupMap[g.homeTeam.abbreviation] = {
        opponent: g.awayTeam.abbreviation,
        isHome: true,
      }
      matchupMap[g.awayTeam.abbreviation] = {
        opponent: g.homeTeam.abbreviation,
        isHome: false,
      }
    }
    const todayTeams = new Set(Object.keys(matchupMap))

    // Build player response
    const players = [...playerMap.values()]
      .filter((p) => todayTeams.has(p.team)) // Only players with games today
      .map((p) => {
        const totalTeamGames = teamGameCounts.get(p.team) || 1

        // For windowed data, limit to the requested window
        let gamesInWindow = totalTeamGames
        if (windowSize !== "season") {
          gamesInWindow = Math.min(windowSize, totalTeamGames)
        }

        const rate = gamesInWindow > 0 ? (p.firstCount / gamesInWindow) * 100 : 0

        // Get last N game results for dots display
        const recentResults = p.gameResults
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, typeof windowSize === "number" ? windowSize : 10)

        const matchup = matchupMap[p.team]

        return {
          athleteId: p.athleteId,
          athleteName: p.athleteName,
          team: p.team,
          firstCount: p.firstCount,
          gamesInWindow,
          rate: Math.round(rate * 10) / 10,
          recentResults,
          opponent: matchup?.opponent || null,
          isHome: matchup?.isHome ?? false,
        }
      })
      .sort((a, b) => b.rate - a.rate)

    const res = NextResponse.json({
      players,
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
