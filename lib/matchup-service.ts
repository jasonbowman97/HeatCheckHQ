// ============================================================
// lib/matchup-service.ts — Build matchup context for props
// ============================================================

import type { Player, Game, GameLog, DefenseRanking } from '@/types/shared'
import type { InjuryContext } from '@/types/check-prop'

interface MatchupInput {
  player: Player
  game: Game
  gameLogs: GameLog[]
  defenseRanking: DefenseRanking
  injuries?: InjuryContext[]
  weather?: { temp: number; windSpeed: number; windDirection: string; humidity: number }
  opposingPitcher?: { name: string; hand: string; era: number; whip: number }
}

interface MatchupResult {
  opponentDefRank: number
  opponentDefLabel: string
  opponentDefStatsAllowed: number
  isHome: boolean
  venue: string
  restDays: number
  isBackToBack: boolean
  teamSpread?: number
  gameTotal?: number
  teamImpliedTotal?: number
  injuries: InjuryContext[]
  weather?: { temp: number; windSpeed: number; windDirection: string; humidity: number }
  opposingPitcher?: { name: string; hand: string; era: number; whip: number }
  isIndoor?: boolean
  isDivisional?: boolean
}

export function buildMatchupContext(input: MatchupInput): MatchupResult {
  const { player, game, gameLogs, defenseRanking, injuries = [], weather, opposingPitcher } = input

  const isHome = game.homeTeam.id === player.team.id
  const opponent = isHome ? game.awayTeam : game.homeTeam

  // Rest days from most recent game log
  const restDays = gameLogs.length > 0 ? gameLogs[0].restDays : 1
  const isBackToBack = gameLogs.length > 0 ? gameLogs[0].isBackToBack : false

  // Defense ranking label
  const defTier = defenseRanking.rank <= 10 ? 'elite' :
    defenseRanking.rank <= 20 ? 'average' : 'weak'
  const opponentDefLabel = `${opponent.abbrev} ranks #${defenseRanking.rank} defending ${player.position}s (${defTier})`

  // Implied team total from spread + game total
  let teamImpliedTotal: number | undefined
  if (game.spread != null && game.total != null) {
    // Implied total = (game total / 2) - (spread / 2) for home team
    // Positive spread = home is underdog
    if (isHome) {
      teamImpliedTotal = (game.total / 2) - (game.spread / 2)
    } else {
      teamImpliedTotal = (game.total / 2) + (game.spread / 2)
    }
  }

  return {
    opponentDefRank: defenseRanking.rank,
    opponentDefLabel,
    opponentDefStatsAllowed: defenseRanking.statsAllowed,
    isHome,
    venue: game.venue,
    restDays,
    isBackToBack,
    teamSpread: game.spread,
    gameTotal: game.total,
    teamImpliedTotal: teamImpliedTotal ? Math.round(teamImpliedTotal * 10) / 10 : undefined,
    injuries,
    weather,
    opposingPitcher,
  }
}

/**
 * Get the defense quality label for display
 */
export function getDefenseQualityLabel(rank: number): string {
  if (rank <= 5) return 'Elite'
  if (rank <= 10) return 'Strong'
  if (rank <= 15) return 'Above Average'
  if (rank <= 20) return 'Average'
  if (rank <= 25) return 'Below Average'
  return 'Weak'
}

/**
 * Calculate implied total from Vegas lines
 */
export function calculateImpliedTotal(
  gameTotal: number,
  spread: number,
  isHome: boolean,
): number {
  if (isHome) {
    return (gameTotal / 2) - (spread / 2)
  }
  return (gameTotal / 2) + (spread / 2)
}
