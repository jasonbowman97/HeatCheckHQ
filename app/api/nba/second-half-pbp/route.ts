/**
 * 2nd Half PBP API — queries Q3 first basket / first team FG from the materialized view.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cacheHeader, CACHE } from "@/lib/cache"
import { getNBAScoreboard } from "@/lib/nba-api"

export const revalidate = 3600

/** Standard NBA team abbreviations — excludes All-Star / Rising Stars / special events */
const NBA_TEAMS = new Set([
  "ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GS",
  "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NO", "NY",
  "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SA", "TOR", "UTAH", "WSH",
])
function isRegularGame(homeTeam: string, awayTeam: string): boolean {
  return NBA_TEAMS.has(homeTeam) && NBA_TEAMS.has(awayTeam)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propType = searchParams.get("type") || "first-basket"
    const windowParam = searchParams.get("window") || "season"

    // For second half, always query Q3 (period = 3)
    const category =
      propType === "first-team-fg" ? "q3_first_team_fg" : "q3_first_basket"

    const supabase = await createClient()

    // Get ALL events for this category (override Supabase default 1000 limit)
    const { data: allGamesForCategory } = await supabase
      .from("mv_game_firsts")
      .select("game_id, game_date, home_team, away_team")
      .eq("category", category)
      .order("game_date", { ascending: false })
      .limit(5000)

    if (!allGamesForCategory || allGamesForCategory.length === 0) {
      const res = NextResponse.json({
        players: [],
        todayGames: [],
        updatedAt: new Date().toISOString(),
        propType,
        window: windowParam,
        half: "2",
      })
      res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
      return res
    }

    // Deduplicate + exclude All-Star games
    const uniqueGames = new Map<string, { date: string; home: string; away: string }>()
    for (const g of allGamesForCategory) {
      if (!uniqueGames.has(g.game_id) && isRegularGame(g.home_team, g.away_team)) {
        uniqueGames.set(g.game_id, { date: g.game_date, home: g.home_team, away: g.away_team })
      }
    }

    // Build team game counts from ALL games
    const teamGameCounts = new Map<string, number>()
    for (const g of uniqueGames.values()) {
      teamGameCounts.set(g.home, (teamGameCounts.get(g.home) || 0) + 1)
      teamGameCounts.set(g.away, (teamGameCounts.get(g.away) || 0) + 1)
    }

    const windowSize = windowParam === "season" ? Infinity : Number(windowParam)

    // Build per-team game lists sorted by date (most recent first)
    // This is critical: L5 = "last 5 games THIS TEAM played", not league-wide
    const teamGamesList = new Map<string, { gameId: string; date: string }[]>()
    for (const [gid, g] of uniqueGames) {
      for (const t of [g.home, g.away]) {
        if (!teamGamesList.has(t)) teamGamesList.set(t, [])
        teamGamesList.get(t)!.push({ gameId: gid, date: g.date })
      }
    }
    for (const games of teamGamesList.values()) {
      games.sort((a, b) => b.date.localeCompare(a.date))
    }

    // Per-team window: each team's last N game IDs
    const perTeamWindowIds = new Map<string, Set<string>>()
    let windowTeamGameCounts = teamGameCounts // default to full season

    if (windowSize !== Infinity) {
      const wTeamCounts = new Map<string, number>()
      for (const [team, games] of teamGamesList) {
        const slice = games.slice(0, windowSize)
        perTeamWindowIds.set(team, new Set(slice.map((g) => g.gameId)))
        wTeamCounts.set(team, slice.length)
      }
      windowTeamGameCounts = wTeamCounts
    }

    /** Check if a game is within a team's window */
    function isInTeamWindow(gameId: string, team: string): boolean {
      if (perTeamWindowIds.size === 0) return true // season mode
      return perTeamWindowIds.get(team)?.has(gameId) ?? false
    }

    // Query all first events (no date filter — per-team filtering done in JS)
    const { data: firstEvents, error } = await supabase
      .from("mv_game_firsts")
      .select("*")
      .eq("category", category)
      .order("game_date", { ascending: false })
      .limit(5000)

    if (error) {
      console.error("[2H PBP API]", error)
      return NextResponse.json({ players: [], error: error.message }, { status: 500 })
    }

    if (!firstEvents || firstEvents.length === 0) {
      const res = NextResponse.json({
        players: [],
        todayGames: [],
        updatedAt: new Date().toISOString(),
        propType,
        window: windowParam,
        half: "2",
      })
      res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
      return res
    }

    // Build per-team game dates for recent results (showing scored AND not-scored games)
    // Each team only includes games within their own window
    const teamGameDates = new Map<string, { gameId: string; date: string; opponent: string; isHome: boolean }[]>()
    for (const [gid, g] of uniqueGames) {
      // Home team: only include if this game is in home team's window
      if (isInTeamWindow(gid, g.home)) {
        if (!teamGameDates.has(g.home)) teamGameDates.set(g.home, [])
        teamGameDates.get(g.home)!.push({ gameId: gid, date: g.date, opponent: g.away, isHome: true })
      }
      // Away team: only include if this game is in away team's window
      if (isInTeamWindow(gid, g.away)) {
        if (!teamGameDates.has(g.away)) teamGameDates.set(g.away, [])
        teamGameDates.get(g.away)!.push({ gameId: gid, date: g.date, opponent: g.home, isHome: false })
      }
    }

    // Aggregate per player
    const playerMap = new Map<
      string,
      {
        athleteId: string
        athleteName: string
        team: string
        firstCount: number
        scoredGameIds: Set<string>
      }
    >()

    for (const ev of firstEvents) {
      if (!ev.athlete_id) continue
      if (!isRegularGame(ev.home_team, ev.away_team)) continue
      if (!isInTeamWindow(ev.game_id, ev.team)) continue

      let entry = playerMap.get(ev.athlete_id)
      if (!entry) {
        entry = {
          athleteId: ev.athlete_id,
          athleteName: ev.athlete_name || "Unknown",
          team: ev.team,
          firstCount: 0,
          scoredGameIds: new Set(),
        }
        playerMap.set(ev.athlete_id, entry)
      }

      entry.firstCount++
      entry.scoredGameIds.add(ev.game_id)
    }

    // Today's matchup context
    const todayGames = await getNBAScoreboard()
    const matchupMap: Record<string, { opponent: string; isHome: boolean }> = {}
    const todayGamesList: { away: string; home: string; awayLogo: string; homeLogo: string }[] = []
    for (const g of todayGames) {
      matchupMap[g.homeTeam.abbreviation] = { opponent: g.awayTeam.abbreviation, isHome: true }
      matchupMap[g.awayTeam.abbreviation] = { opponent: g.homeTeam.abbreviation, isHome: false }
      todayGamesList.push({
        away: g.awayTeam.abbreviation,
        home: g.homeTeam.abbreviation,
        awayLogo: g.awayTeam.logo,
        homeLogo: g.homeTeam.logo,
      })
    }
    const todayTeams = new Set(Object.keys(matchupMap))

    // Build player response
    const players = [...playerMap.values()]
      .map((p) => {
        const gamesInWindow = windowTeamGameCounts.get(p.team) || 1
        const rate = gamesInWindow > 0 ? (p.firstCount / gamesInWindow) * 100 : 0

        // Build recent results showing ALL games (scored or not)
        const teamGames = teamGameDates.get(p.team) || []
        const recentResults = teamGames
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, windowSize === Infinity ? 10 : windowSize)
          .map((g) => ({
            gameId: g.gameId,
            date: g.date,
            opponent: g.opponent,
            isHome: g.isHome,
            scored: p.scoredGameIds.has(g.gameId),
          }))

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
      .filter((p) => p.gamesInWindow >= 3)
      .sort((a, b) => b.rate - a.rate)

    const res = NextResponse.json({
      players,
      todayGames: todayGamesList,
      updatedAt: new Date().toISOString(),
      propType,
      window: windowParam,
      half: "2",
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
    return res
  } catch (e) {
    console.error("[2H PBP API]", e)
    return NextResponse.json({ players: [], error: String(e) }, { status: 500 })
  }
}
