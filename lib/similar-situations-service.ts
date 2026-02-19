// ============================================================
// lib/similar-situations-service.ts — Find comparable historical games
// ============================================================
// Identifies games from the player's log where conditions were similar
// to tonight's matchup: defense quality, home/away, rest, B2B status.
// Pro-only feature.

import type { GameLog, Game, Player, DefenseRanking } from '@/types/shared'
import { mean } from './math-utils'

interface SimilarSituationsInput {
  player: Player
  game: Game
  gameLogs: GameLog[]
  defenseRanking: DefenseRanking | null
  stat: string
  line: number
  isHome: boolean
}

interface SimilarSituationsResult {
  description: string
  matchingGames: number
  avgValue: number
  hitRate: number
  avgMargin: number
}

/**
 * Finds games from the player's history that match the current
 * situation as closely as possible. Uses tiered matching:
 * 1. Exact match (home/away + defense tier + rest tier)
 * 2. Relaxed match (home/away + defense tier OR rest tier)
 * 3. Broad match (home/away only)
 * Requires at least 5 matching games to be meaningful.
 */
export function findSimilarSituations(input: SimilarSituationsInput): SimilarSituationsResult | null {
  const { player, game, gameLogs, defenseRanking, stat, line, isHome } = input

  if (gameLogs.length < 10) return null

  const defTier = defenseRanking ? getDefenseTier(defenseRanking.rank) : null
  const restTier = getRestTier(gameLogs)

  // Tier 1: Exact match — home/away + defense tier + rest tier
  let matches = gameLogs.filter(g =>
    g.isHome === isHome &&
    matchesDefenseTier(g.opponentDefRank, defTier) &&
    matchesRestTier(g, restTier)
  )

  let description = buildDescription(player, isHome, defTier, restTier)

  // Tier 2: Relax to home/away + defense tier (drop rest)
  if (matches.length < 5 && defTier) {
    matches = gameLogs.filter(g =>
      g.isHome === isHome &&
      matchesDefenseTier(g.opponentDefRank, defTier)
    )
    description = buildDescription(player, isHome, defTier, null)
  }

  // Tier 3: Just home/away
  if (matches.length < 5) {
    matches = gameLogs.filter(g => g.isHome === isHome)
    description = buildDescription(player, isHome, null, null)
  }

  if (matches.length < 5) return null

  const values = matches.map(g => g.stats[stat] ?? 0)
  const avgValue = mean(values)
  const margins = values.map(v => v - line)
  const hits = values.filter(v => v > line).length

  return {
    description,
    matchingGames: matches.length,
    avgValue,
    hitRate: hits / matches.length,
    avgMargin: mean(margins),
  }
}

// ── Helpers ──

type DefTier = 'top' | 'mid' | 'bottom'
type RestTier = 'b2b' | 'normal' | 'rested'

function getDefenseTier(rank: number): DefTier {
  if (rank <= 10) return 'top'
  if (rank <= 20) return 'mid'
  return 'bottom'
}

function getRestTier(gameLogs: GameLog[]): RestTier {
  // Use the most recent game's rest days to determine tonight's context
  if (gameLogs.length === 0) return 'normal'
  const recent = gameLogs[0]
  if (recent.isBackToBack) return 'b2b'
  if (recent.restDays >= 3) return 'rested'
  return 'normal'
}

function matchesDefenseTier(oppDefRank: number, tier: DefTier | null): boolean {
  if (!tier) return true
  return getDefenseTier(oppDefRank) === tier
}

function matchesRestTier(game: GameLog, tier: RestTier | null): boolean {
  if (!tier) return true
  if (tier === 'b2b') return game.isBackToBack
  if (tier === 'rested') return game.restDays >= 3
  return !game.isBackToBack && game.restDays < 3
}

function buildDescription(
  player: Player,
  isHome: boolean,
  defTier: DefTier | null,
  restTier: RestTier | null,
): string {
  const parts: string[] = [
    player.name,
    isHome ? 'at home' : 'on the road',
  ]

  if (defTier) {
    const label = defTier === 'top' ? 'top-10 defense' :
      defTier === 'bottom' ? 'bottom-10 defense' : 'mid-tier defense'
    parts.push(`vs ${label}`)
  }

  if (restTier === 'b2b') parts.push('on back-to-back')
  else if (restTier === 'rested') parts.push('on 3+ days rest')

  return parts.join(' ')
}
