// ============================================================
// lib/what-if-simulator.ts — What-If Scenario Simulator
// ============================================================
// Allows users to modify inputs (line, opponent, venue, rest)
// and see how the convergence score changes in real-time.

import type { Player, Game, GameLog, SeasonStats, DefenseRanking } from '@/types/shared'
import type { WhatIfScenario, WhatIfModification, WhatIfResult } from '@/types/innovation-playbook'
import { evaluate as evaluateConvergence } from './convergence-engine'

interface SimulationInput {
  player: Player
  game: Game
  gameLogs: GameLog[]
  seasonStats: SeasonStats
  defenseRanking: DefenseRanking
  stat: string
  originalLine: number
  modifications: WhatIfModification[]
}

export function simulate(input: SimulationInput): WhatIfResult {
  const { player, game, gameLogs, seasonStats, defenseRanking, stat, originalLine, modifications } = input

  // Run original convergence
  const original = evaluateConvergence(player, game, gameLogs, seasonStats, defenseRanking, stat, originalLine)

  // Apply modifications to create modified inputs
  let modifiedLine = originalLine
  let modifiedGame = { ...game }
  let modifiedDefRanking = { ...defenseRanking }
  let modifiedLogs = gameLogs

  for (const mod of modifications) {
    switch (mod.type) {
      case 'change_line':
        modifiedLine = mod.value as number
        break
      case 'change_opponent':
        // Would change the defense ranking
        if (typeof mod.value === 'object' && mod.value.rank) {
          modifiedDefRanking = { ...defenseRanking, rank: mod.value.rank, statsAllowed: mod.value.statsAllowed }
        }
        break
      case 'change_venue':
        modifiedGame = {
          ...game,
          homeTeam: mod.value === 'home' ? { ...game.homeTeam, id: player.team.id } : game.homeTeam,
          awayTeam: mod.value === 'away' ? { ...game.awayTeam, id: player.team.id } : game.awayTeam,
        }
        break
      case 'toggle_b2b':
        modifiedLogs = gameLogs.map((g, i) =>
          i === 0 ? { ...g, isBackToBack: mod.value as boolean, restDays: mod.value ? 0 : g.restDays } : g
        )
        break
      case 'change_rest_days':
        modifiedLogs = gameLogs.map((g, i) =>
          i === 0 ? { ...g, restDays: mod.value as number, isBackToBack: (mod.value as number) === 0 } : g
        )
        break
    }
  }

  // Run modified convergence
  const modified = evaluateConvergence(player, modifiedGame, modifiedLogs, seasonStats, modifiedDefRanking, stat, modifiedLine)

  // Determine directions
  const originalDirection = original.overCount > original.underCount ? 'over' :
    original.underCount > original.overCount ? 'under' : 'toss-up' as const
  const modifiedDirection = modified.overCount > modified.underCount ? 'over' :
    modified.underCount > modified.overCount ? 'under' : 'toss-up' as const

  // Map factor changes
  const factorChanges = original.factors.map((origFactor, i) => {
    const modFactor = modified.factors[i]
    return {
      factorKey: origFactor.key,
      factorName: origFactor.name,
      originalSignal: origFactor.signal,
      modifiedSignal: modFactor.signal,
      changed: origFactor.signal !== modFactor.signal,
    }
  })

  const changedCount = factorChanges.filter(f => f.changed).length

  // Build summary
  const summary = changedCount === 0
    ? 'No factor signals changed with these modifications.'
    : `${changedCount} factor${changedCount > 1 ? 's' : ''} changed: ${
        factorChanges.filter(f => f.changed).map(f => f.factorName).join(', ')
      }. Direction moved from ${originalDirection} (${Math.max(original.overCount, original.underCount)}/7) to ${modifiedDirection} (${Math.max(modified.overCount, modified.underCount)}/7).`

  return {
    originalConvergence: Math.max(original.overCount, original.underCount),
    modifiedConvergence: Math.max(modified.overCount, modified.underCount),
    originalDirection,
    modifiedDirection,
    factorChanges,
    summary,
  }
}
