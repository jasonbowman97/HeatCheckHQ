import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cacheHeader, CACHE } from "@/lib/cache"
import { getNBAScoreboard } from "@/lib/nba-api"

export const revalidate = 3600

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
    const query = supabase
      .from("pbp_game_events")
      .select("game_id, game_date, athlete_id, athlete_name, team, home_team, away_team, score_value, clock_seconds")
      .eq("period", 1)
      .eq("scoring_play", true)
      .gte("clock_seconds", 540) // First 3 minutes of Q1
      .order("game_date", { ascending: false })

    const { data: scoringPlays, error } = await query

    if (error) {
      console.error("[First 3 Min API]", error)
      return NextResponse.json({ players: [], error: error.message }, { status: 500 })
    }

    if (!scoringPlays || scoringPlays.length === 0) {
      const res = NextResponse.json({ players: [], updatedAt: new Date().toISOString() })
      res.headers.set("Cache-Control", cacheHeader(CACHE.TRENDS))
      return res
    }

    // Aggregate per player per game
    const playerGameMap = new Map<string, Map<string, { points: number; date: string; team: string; name: string; homeTeam: string; awayTeam: string }>>()

    for (const play of scoringPlays) {
      if (!play.athlete_id) continue

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

    // Count total games each team played
    const teamGames = new Map<string, Set<string>>()
    for (const play of scoringPlays) {
      for (const team of [play.home_team, play.away_team]) {
        if (!teamGames.has(team)) teamGames.set(team, new Set())
        teamGames.get(team)!.add(play.game_id)
      }
    }

    // Get today's games for matchup context
    const todayGames = await getNBAScoreboard()
    const matchupMap: Record<string, { opponent: string; isHome: boolean }> = {}
    const todayGamesList: { away: string; home: string }[] = []
    for (const g of todayGames) {
      matchupMap[g.homeTeam.abbreviation] = { opponent: g.awayTeam.abbreviation, isHome: true }
      matchupMap[g.awayTeam.abbreviation] = { opponent: g.homeTeam.abbreviation, isHome: false }
      todayGamesList.push({ away: g.awayTeam.abbreviation, home: g.homeTeam.abbreviation })
    }
    const todayTeams = new Set(Object.keys(matchupMap))

    // Build player response — show ALL players, not just today's teams
    const players = [...playerGameMap.entries()]
      .map(([athleteId, games]) => {
        const gameArr = [...games.values()].sort((a, b) => b.date.localeCompare(a.date))

        // Apply window filter
        const windowSize = windowParam === "season" ? gameArr.length : Math.min(Number(windowParam), gameArr.length)
        const windowGames = gameArr.slice(0, windowSize)

        if (windowGames.length === 0) return null

        const team = windowGames[0]?.team || ""
        const name = windowGames[0]?.name || "Unknown"

        // Need at least 3 games to show meaningful data
        if (windowGames.length < 3) return null

        const totalPoints = windowGames.reduce((sum, g) => sum + g.points, 0)
        const avg = windowGames.length > 0 ? totalPoints / windowGames.length : 0
        const hitCount = windowGames.filter((g) => g.points >= threshold).length
        const hitRate = windowGames.length > 0 ? (hitCount / windowGames.length) * 100 : 0

        // Recent game results for display
        const recentResults = windowGames.slice(0, 10).map((g) => ({
          date: g.date,
          points: g.points,
          hit: g.points >= threshold,
          opponent: g.team === g.homeTeam ? g.awayTeam : g.homeTeam,
          isHome: g.team === g.homeTeam,
        }))

        const matchup = matchupMap[team]
        const playsToday = todayTeams.has(team)

        // ESPN headshot URL
        const headshotUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${athleteId}.png&w=96&h=70&cb=1`

        return {
          athleteId,
          athleteName: name,
          team,
          headshotUrl,
          avgPoints: Math.round(avg * 10) / 10,
          hitCount,
          gamesInWindow: windowGames.length,
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
