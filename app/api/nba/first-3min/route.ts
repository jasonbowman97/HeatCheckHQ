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

/**
 * First 3 Minutes Scoring API.
 * Returns players ranked by points scored in the first 3 minutes of Q1.
 *
 * Query params:
 * - window: 5 | 10 | 20 | "season" (default: "season")
 * - threshold: number (default: 1.5) — points threshold for hit rate
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const windowParam = searchParams.get("window") || "season"
    const threshold = Number(searchParams.get("threshold") || "1.5")

    const supabase = await createClient()

    // Query scoring plays in Q1 first 3 minutes
    // clock_seconds >= 540 means within the first 3 minutes (720 - 180 = 540)
    // IMPORTANT: Override Supabase default 1000-row limit
    const { data: scoringPlays, error } = await supabase
      .from("pbp_game_events")
      .select("game_id, game_date, athlete_id, athlete_name, team, home_team, away_team, score_value, clock_seconds")
      .eq("period", 1)
      .eq("scoring_play", true)
      .gte("clock_seconds", 540)
      .order("game_date", { ascending: false })
      .limit(10000)

    if (error) {
      console.error("[First 3 Min API]", error)
      return NextResponse.json({ players: [], error: error.message }, { status: 500 })
    }

    if (!scoringPlays || scoringPlays.length === 0) {
      const res = NextResponse.json({ players: [], todayGames: [], updatedAt: new Date().toISOString() })
      res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
      return res
    }

    // Also need to know ALL games per team (not just games with scoring plays)
    // so game counts are accurate. Query all unique game_ids from Q1 events.
    const { data: allQ1Games } = await supabase
      .from("pbp_game_events")
      .select("game_id, game_date, home_team, away_team")
      .eq("period", 1)
      .order("game_date", { ascending: false })
      .limit(20000)

    // Build complete team game counts from ALL Q1 games
    const uniqueGames = new Map<string, { date: string; home: string; away: string }>()
    if (allQ1Games) {
      for (const g of allQ1Games) {
        if (!uniqueGames.has(g.game_id) && isRegularGame(g.home_team, g.away_team)) {
          uniqueGames.set(g.game_id, { date: g.game_date, home: g.home_team, away: g.away_team })
        }
      }
    }

    const teamGameCounts = new Map<string, number>()
    for (const g of uniqueGames.values()) {
      teamGameCounts.set(g.home, (teamGameCounts.get(g.home) || 0) + 1)
      teamGameCounts.set(g.away, (teamGameCounts.get(g.away) || 0) + 1)
    }

    const allDates = [...new Set([...uniqueGames.values()].map((g) => g.date))].sort().reverse()
    const windowSize = windowParam === "season" ? Infinity : Number(windowParam)

    // For windowed queries, determine the date cutoff
    let windowGameIds: Set<string> | null = null
    let windowTeamGameCounts = teamGameCounts

    if (windowSize !== Infinity) {
      const cutoffDate = allDates[Math.min(windowSize - 1, allDates.length - 1)]
      windowGameIds = new Set<string>()
      const wTeamCounts = new Map<string, number>()
      for (const [gid, g] of uniqueGames) {
        if (g.date >= cutoffDate) {
          windowGameIds.add(gid)
          wTeamCounts.set(g.home, (wTeamCounts.get(g.home) || 0) + 1)
          wTeamCounts.set(g.away, (wTeamCounts.get(g.away) || 0) + 1)
        }
      }
      windowTeamGameCounts = wTeamCounts
    }

    // Build team game dates for recent results (to show games where player scored 0 in first 3 min)
    const teamGameDates = new Map<string, { gameId: string; date: string; opponent: string; isHome: boolean }[]>()
    for (const [gid, g] of uniqueGames) {
      if (windowGameIds && !windowGameIds.has(gid)) continue
      if (!teamGameDates.has(g.home)) teamGameDates.set(g.home, [])
      teamGameDates.get(g.home)!.push({ gameId: gid, date: g.date, opponent: g.away, isHome: true })
      if (!teamGameDates.has(g.away)) teamGameDates.set(g.away, [])
      teamGameDates.get(g.away)!.push({ gameId: gid, date: g.date, opponent: g.home, isHome: false })
    }

    // Aggregate per player per game
    const playerGameMap = new Map<string, Map<string, { points: number; date: string; team: string; name: string; homeTeam: string; awayTeam: string }>>()

    for (const play of scoringPlays) {
      if (!play.athlete_id) continue
      if (!isRegularGame(play.home_team, play.away_team)) continue
      if (windowGameIds && !windowGameIds.has(play.game_id)) continue

      let playerGames = playerGameMap.get(play.athlete_id)
      if (!playerGames) {
        playerGames = new Map()
        playerGameMap.set(play.athlete_id, playerGames)
      }

      let gameEntry = playerGames.get(play.game_id)
      if (!gameEntry) {
        gameEntry = {
          points: 0,
          date: play.game_date,
          team: play.team,
          name: play.athlete_name || "Unknown",
          homeTeam: play.home_team,
          awayTeam: play.away_team,
        }
        playerGames.set(play.game_id, gameEntry)
      }

      gameEntry.points += play.score_value || 0
    }

    // Get today's games for matchup context
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
    const players = [...playerGameMap.entries()]
      .map(([athleteId, scoredGames]) => {
        const gameArr = [...scoredGames.values()].sort((a, b) => b.date.localeCompare(a.date))
        if (gameArr.length === 0) return null

        const team = gameArr[0]?.team || ""
        const name = gameArr[0]?.name || "Unknown"

        // Use total team games in window (not just games where they scored)
        const totalTeamGames = windowTeamGameCounts.get(team) || 0
        if (totalTeamGames < 3) return null

        // Points per game is avg across games where they scored in first 3 min
        // But game count should be total team games for hit rate calculation
        const scoredGameIds = new Set(scoredGames.keys())
        const totalPoints = gameArr.reduce((sum, g) => sum + g.points, 0)

        // Avg points in the first 3 min (only counting games where they scored)
        // This is used for ranking; hitRate uses total team games
        const avgPointsScored = gameArr.length > 0 ? totalPoints / gameArr.length : 0

        // Hit count = games where they scored >= threshold in first 3 min
        const hitCount = gameArr.filter((g) => g.points >= threshold).length
        const hitRate = totalTeamGames > 0 ? (hitCount / totalTeamGames) * 100 : 0

        // Recent game results — show ALL team games, not just ones where they scored
        const teamGames = teamGameDates.get(team) || []
        const recentResults = teamGames
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, windowSize === Infinity ? 10 : windowSize)
          .map((g) => {
            const scoredEntry = scoredGames.get(g.gameId)
            return {
              date: g.date,
              points: scoredEntry ? scoredEntry.points : 0,
              hit: (scoredEntry ? scoredEntry.points : 0) >= threshold,
              opponent: g.opponent,
              isHome: g.isHome,
            }
          })

        const matchup = matchupMap[team]
        const playsToday = todayTeams.has(team)
        const headshotUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${athleteId}.png&w=96&h=70&cb=1`

        return {
          athleteId,
          athleteName: name,
          team,
          headshotUrl,
          avgPoints: Math.round(avgPointsScored * 10) / 10,
          hitCount,
          gamesInWindow: totalTeamGames,
          hitRate: Math.round(hitRate * 10) / 10,
          recentResults,
          opponent: matchup?.opponent || null,
          isHome: matchup?.isHome ?? false,
          playsToday,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.avgPoints - a!.avgPoints)

    const res = NextResponse.json({
      players,
      todayGames: todayGamesList,
      updatedAt: new Date().toISOString(),
      window: windowParam,
      threshold,
    })
    res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
    return res
  } catch (e) {
    console.error("[First 3 Min API]", e)
    return NextResponse.json({ players: [], error: String(e) }, { status: 500 })
  }
}
