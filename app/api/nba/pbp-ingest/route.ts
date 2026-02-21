import { NextResponse } from "next/server"
import { fetchNBAScoreboard } from "@/lib/espn/client"
import { fetchNBAPBP, extractGameEvents, extractCompletedGames } from "@/lib/espn/pbp"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"
export const maxDuration = 120 // Vercel Pro — enough to process all games

/**
 * Ingest NBA play-by-play data for yesterday's games.
 * Called by Vercel cron at 7 AM ET (11:00 UTC) daily.
 *
 * Supports manual invocation with ?date=YYYY-MM-DD for specific dates.
 */
export async function GET(request: Request) {
  // ── Auth ──
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const cronSecret = request.headers
    .get("authorization")
    ?.replace("Bearer ", "")

  const isAuthorized =
    (process.env.REFRESH_SECRET && secret === process.env.REFRESH_SECRET) ||
    (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET)

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // ── Determine target date ──
    // Default to yesterday (games finish late, cron runs morning after)
    const dateParam = searchParams.get("date")
    let targetDate: string

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      targetDate = dateParam
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      targetDate = yesterday.toISOString().split("T")[0]
    }

    // ESPN scoreboard uses YYYYMMDD format
    const espnDate = targetDate.replace(/-/g, "")

    console.log(`[PBP Ingest] Starting for date: ${targetDate}`)

    // ── Fetch scoreboard for the target date ──
    const scoreboardData = await fetchNBAScoreboard(espnDate)
    const completedGames = extractCompletedGames(scoreboardData, targetDate)

    if (completedGames.length === 0) {
      console.log(`[PBP Ingest] No completed games on ${targetDate}`)
      return NextResponse.json({
        success: true,
        date: targetDate,
        ingested: 0,
        skipped: 0,
        message: "No completed games",
      })
    }

    console.log(
      `[PBP Ingest] Found ${completedGames.length} completed games on ${targetDate}`
    )

    // ── Check which games are already ingested ──
    const supabase = createServiceClient()

    const { data: existingGames } = await supabase
      .from("pbp_game_events")
      .select("game_id")
      .in(
        "game_id",
        completedGames.map((g) => g.gameId)
      )
      .limit(1000)

    const existingIds = new Set(
      (existingGames ?? []).map((g: { game_id: string }) => g.game_id)
    )

    const gamesToIngest = completedGames.filter(
      (g) => !existingIds.has(g.gameId)
    )

    if (gamesToIngest.length === 0) {
      console.log(`[PBP Ingest] All ${completedGames.length} games already ingested`)
      return NextResponse.json({
        success: true,
        date: targetDate,
        ingested: 0,
        skipped: completedGames.length,
        message: "All games already ingested",
      })
    }

    console.log(
      `[PBP Ingest] ${gamesToIngest.length} new games to ingest, ${existingIds.size} already done`
    )

    // ── Fetch PBP and ingest for each new game ──
    let ingested = 0
    const errors: string[] = []

    for (const game of gamesToIngest) {
      try {
        console.log(
          `[PBP Ingest] Fetching PBP for ${game.awayTeam} @ ${game.homeTeam} (${game.gameId})`
        )

        const plays = await fetchNBAPBP(game.gameId)
        const events = extractGameEvents(plays, game)

        if (events.length === 0) {
          console.warn(
            `[PBP Ingest] No events extracted for game ${game.gameId}`
          )
          continue
        }

        // Batch upsert (ON CONFLICT DO NOTHING for idempotency)
        const BATCH_SIZE = 100
        for (let i = 0; i < events.length; i += BATCH_SIZE) {
          const batch = events.slice(i, i + BATCH_SIZE)
          const { error } = await supabase
            .from("pbp_game_events")
            .upsert(batch, {
              onConflict: "game_id,period,clock_seconds,athlete_id,event_type",
              ignoreDuplicates: true,
            })

          if (error) {
            console.error(
              `[PBP Ingest] Upsert error for game ${game.gameId} batch ${i}:`,
              error.message
            )
            errors.push(`${game.gameId}: ${error.message}`)
          }
        }

        console.log(
          `[PBP Ingest] Ingested ${events.length} events for ${game.awayTeam} @ ${game.homeTeam}`
        )
        ingested++

        // Small delay between games to be polite to ESPN
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(
          `[PBP Ingest] Failed for game ${game.gameId}:`,
          msg
        )
        errors.push(`${game.gameId}: ${msg}`)
      }
    }

    // ── Refresh materialized view ──
    if (ingested > 0) {
      console.log("[PBP Ingest] Refreshing materialized view mv_game_firsts...")
      const { error: mvError } = await supabase.rpc("refresh_mv_game_firsts")
      if (mvError) {
        console.error(
          "[PBP Ingest] Failed to refresh materialized view:",
          mvError.message
        )
        // Non-fatal — data is still in the base table
      }
    }

    return NextResponse.json({
      success: true,
      date: targetDate,
      ingested,
      skipped: existingIds.size,
      totalGames: completedGames.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error("[PBP Ingest] Fatal error:", err)
    return NextResponse.json(
      { error: "PBP ingestion failed", message: String(err) },
      { status: 500 }
    )
  }
}
