/**
 * Social content generation pipeline.
 *
 * POST /api/social/generate?secret=SOCIAL_SECRET
 *
 * Orchestrates: data fetching → insight selection → Claude copy → sheet URLs.
 * Returns JSON with all sheet data, image URLs, and tweet copy.
 *
 * Triggered by:
 *  - GitHub Actions cron (3x/day)
 *  - Admin UI "Generate Now" button
 *  - Manual workflow_dispatch
 */

import { NextRequest, NextResponse } from "next/server"
import { getTodayMatchupInsights } from "@/lib/nba-defense-vs-position"
import { getNBAStreakTrends } from "@/lib/nba-streaks"
import { getNBATeams } from "@/lib/nba-api"
import { getSchedule } from "@/lib/mlb-api"
import { generateTweetCopy, buildDataSummary } from "@/lib/social/claude-copywriter"
import type { SheetType } from "@/lib/social/card-types"
import type { Trend } from "@/lib/trends-types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const SOCIAL_SECRET = process.env.SOCIAL_SECRET

interface GeneratedSheet {
  type: SheetType
  imageUrl: string
  tweet: string
  reply: string
  altText: string
  hashtags: string[]
  dataAvailable: boolean
}

export async function POST(req: NextRequest) {
  // Auth check
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")
  if (SOCIAL_SECRET && secret !== SOCIAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const origin = req.headers.get("host")
    ? `https://${req.headers.get("host")}`
    : "https://heatcheckhq.io"

  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase()

  try {
    // Fetch all data sources in parallel (resilient — each can fail independently)
    const [dvpResult, trendsResult, teamsResult, mlbResult] = await Promise.allSettled([
      getTodayMatchupInsights(),
      getNBAStreakTrends(),
      getNBATeams(),
      getSchedule(),
    ])

    const dvpMatchups = dvpResult.status === "fulfilled" ? dvpResult.value : []
    const trends = trendsResult.status === "fulfilled" ? trendsResult.value : []
    const teams = teamsResult.status === "fulfilled" ? teamsResult.value : []
    const mlbGames = mlbResult.status === "fulfilled" ? mlbResult.value.games : []

    // Extract elite consecutive streaks by stat for streak sheets
    const elitePtsStreaks = trends.filter(
      (t: Trend) => t.eliteStreak && t.type === "hot" && t.statLabel === "20+ PTS Games"
    )
    const eliteRebStreaks = trends.filter(
      (t: Trend) => t.eliteStreak && t.type === "hot" && t.statLabel === "8+ REB Games"
    )
    const eliteAstStreaks = trends.filter(
      (t: Trend) => t.eliteStreak && t.type === "hot" && t.statLabel === "6+ AST Games"
    )

    // Determine which sheets have data
    const hasDvp = dvpMatchups.length > 0 && dvpMatchups.some((m) => m.insights.length > 0)
    const hasParlay = trends.filter((t: Trend) => t.threshold && t.playingToday && t.type === "hot").length > 0
    const hasNrfi = mlbGames.length > 0
    const hasStrikeout = mlbGames.some((g) => g.away.probablePitcher || g.home.probablePitcher)
    const hasRecap = hasDvp || hasParlay

    // Build sheet metadata
    const sheetConfigs: { type: SheetType; available: boolean; data: Record<string, unknown> }[] = [
      {
        type: "nba_dvp",
        available: hasDvp,
        data: {
          rows: dvpMatchups
            .flatMap((m) =>
              m.insights.map((ins) => ({
                teamAbbr: ins.teamAbbr,
                position: ins.position,
                statCategory: ins.statCategory,
                avgAllowed: ins.avgAllowed,
                rank: ins.rank,
                playerName: ins.playerName,
              }))
            )
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 20),
        },
      },
      {
        type: "nba_parlay",
        available: hasParlay,
        data: {
          rows: trends
            .filter((t: Trend) => t.threshold && t.playingToday && t.type === "hot")
            .sort((a: Trend, b: Trend) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0))
            .slice(0, 20)
            .map((t: Trend) => ({
              playerName: t.playerName,
              prop: `${t.threshold!.stat} O${t.threshold!.line}`,
              line: t.threshold!.line,
              hitRate: t.threshold!.hitRate,
              hitPct: t.threshold!.hitPct,
            })),
        },
      },
      {
        type: "mlb_nrfi",
        available: hasNrfi,
        data: {
          rows: mlbGames
            .filter((g) => g.away.probablePitcher && g.home.probablePitcher)
            .slice(0, 15)
            .map((g) => ({
              awayTeam: g.away.abbreviation,
              homeTeam: g.home.abbreviation,
              awayPitcher: g.away.probablePitcher?.fullName || "TBD",
              homePitcher: g.home.probablePitcher?.fullName || "TBD",
              combinedPct: 0, // Computed at render time
            })),
        },
      },
      {
        type: "mlb_strikeout",
        available: hasStrikeout,
        data: {
          rows: mlbGames
            .flatMap((g) => {
              const entries = []
              if (g.away.probablePitcher) {
                entries.push({
                  pitcher: g.away.probablePitcher.fullName,
                  team: g.away.abbreviation,
                  opponent: g.home.abbreviation,
                  kPerGame: 0,
                  kLine: 0,
                  trend: "push",
                })
              }
              if (g.home.probablePitcher) {
                entries.push({
                  pitcher: g.home.probablePitcher.fullName,
                  team: g.home.abbreviation,
                  opponent: g.away.abbreviation,
                  kPerGame: 0,
                  kLine: 0,
                  trend: "push",
                })
              }
              return entries
            })
            .slice(0, 15),
        },
      },
      {
        type: "daily_recap",
        available: hasRecap,
        data: {
          sections: [
            ...(hasDvp
              ? [
                  (() => {
                    const top = dvpMatchups
                      .flatMap((m) => m.insights)
                      .sort((a, b) => a.rank - b.rank)[0]
                    return top
                      ? {
                          title: "DVP MISMATCH",
                          playerName: top.playerName || top.teamAbbr,
                          stat: `#${top.rank} vs ${top.position}`,
                          detail: `Allows ${top.avgAllowed.toFixed(1)} ${top.statCategory}`,
                        }
                      : null
                  })(),
                ].filter(Boolean)
              : []),
            ...(hasParlay
              ? [
                  (() => {
                    const top = trends
                      .filter((t: Trend) => t.threshold && t.playingToday && t.type === "hot")
                      .sort(
                        (a: Trend, b: Trend) =>
                          (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0)
                      )[0]
                    return top
                      ? {
                          title: "PARLAY PIECE",
                          playerName: top.playerName,
                          stat: top.threshold!.hitRate,
                          detail: `${top.threshold!.stat} O${top.threshold!.line}`,
                        }
                      : null
                  })(),
                ].filter(Boolean)
              : []),
          ],
        },
      },
      // Streak sheets — the sheet renderer fetches gamelogs internally,
      // but we pass summary data for Claude copywriter context.
      {
        type: "nba_pts_streaks",
        available: elitePtsStreaks.length > 0,
        data: {
          rows: elitePtsStreaks.map((t) => ({
            playerName: t.playerName,
            team: t.team || "",
            hitCount: t.streakLength,
            windowSize: 10,
            windowAvg: t.threshold?.hitPct ? t.threshold.hitPct * 10 : t.streakLength,
            seasonAvg: 0,
          })),
        },
      },
      {
        type: "nba_reb_streaks",
        available: eliteRebStreaks.length > 0,
        data: {
          rows: eliteRebStreaks.map((t) => ({
            playerName: t.playerName,
            team: t.team || "",
            hitCount: t.streakLength,
            windowSize: 10,
            windowAvg: t.threshold?.hitPct ? t.threshold.hitPct * 10 : t.streakLength,
            seasonAvg: 0,
          })),
        },
      },
      {
        type: "nba_ast_streaks",
        available: eliteAstStreaks.length > 0,
        data: {
          rows: eliteAstStreaks.map((t) => ({
            playerName: t.playerName,
            team: t.team || "",
            hitCount: t.streakLength,
            windowSize: 10,
            windowAvg: t.threshold?.hitPct ? t.threshold.hitPct * 10 : t.streakLength,
            seasonAvg: 0,
          })),
        },
      },
    ]

    // Generate Claude copy for each available sheet in parallel
    const sheets: GeneratedSheet[] = await Promise.all(
      sheetConfigs.map(async (config) => {
        const imageUrl = `${origin}/api/social/sheets/${config.type}`
        const dataSummary = buildDataSummary(config.type, config.data)

        const copy = config.available
          ? await generateTweetCopy({
              type: config.type,
              date,
              dataSummary,
            })
          : {
              mainTweet: "",
              replyTweet: "",
              altText: "",
              hashtags: [],
            }

        return {
          type: config.type,
          imageUrl,
          tweet: copy.mainTweet,
          reply: copy.replyTweet,
          altText: copy.altText,
          hashtags: copy.hashtags,
          dataAvailable: config.available,
        }
      })
    )

    return NextResponse.json({
      date,
      generatedAt: new Date().toISOString(),
      sheets: sheets.filter((s) => s.dataAvailable),
      unavailable: sheets.filter((s) => !s.dataAvailable).map((s) => s.type),
      teams: teams.length,
      mlbGames: mlbGames.length,
    })
  } catch (error) {
    console.error("[social/generate] Error:", error)
    return NextResponse.json(
      { error: String(error), stack: (error as Error)?.stack },
      { status: 500 }
    )
  }
}

// Also support GET for easy browser testing
export async function GET(req: NextRequest) {
  return POST(req)
}
