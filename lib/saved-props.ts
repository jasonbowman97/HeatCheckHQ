// ============================================================
// lib/saved-props.ts — Persist prop checks to Supabase
// ============================================================
// Client-side functions for saving/unsaving prop checks
// to the user_leans table.

import { createClient } from "@/lib/supabase/client"
import type { PropCheckResult } from "@/types/check-prop"

export interface SavedProp {
  id: string
  player_name: string
  sport: string
  stat: string
  line: number
  direction: string
  convergence_score: number | null
  confidence: number | null
  game_date: string
  created_at: string
}

/**
 * Save a prop check result to the user_leans table.
 * Returns the created record id, or null on failure.
 */
export async function saveProp(result: PropCheckResult): Promise<string | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const isHome = result.game.homeTeam.id === result.player.team.id
  const gameDate = result.game.date
    ? new Date(result.game.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("user_leans")
    .insert({
      user_id: user.id,
      player_id: result.player.id,
      player_name: result.player.name,
      sport: result.player.sport,
      stat: result.stat,
      line: result.line,
      direction: result.verdict.direction,
      game_id: result.game.id || null,
      game_date: gameDate,
      convergence_score: result.verdict.convergenceScore,
      confidence: result.verdict.confidence,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[SavedProps] Failed to save prop:", error)
    return null
  }

  return data?.id ?? null
}

/**
 * Remove a saved prop by its id.
 */
export async function unsaveProp(leanId: string): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from("user_leans")
    .delete()
    .eq("id", leanId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[SavedProps] Failed to unsave prop:", error)
    return false
  }

  return true
}

/**
 * Check if a prop is already saved (by player + stat + line + game_date).
 * Returns the lean id if found, null otherwise.
 */
export async function checkIfSaved(
  playerName: string,
  stat: string,
  line: number,
  gameDate: string
): Promise<string | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("user_leans")
    .select("id")
    .eq("user_id", user.id)
    .eq("player_name", playerName)
    .eq("stat", stat)
    .eq("line", line)
    .eq("game_date", gameDate)
    .maybeSingle()

  return data?.id ?? null
}
