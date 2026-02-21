// ============================================================
// lib/narrative-detector.ts — Detect narrative flags for props
// ============================================================

import type { Player, Game, GameLog, SeasonStats } from '@/types/shared'
import type { NarrativeFlag, InjuryContext } from '@/types/check-prop'

interface NarrativeInput {
  player: Player
  game: Game
  gameLogs: GameLog[]
  seasonStats: SeasonStats
  injuries: InjuryContext[]
  isHome: boolean
  restDays: number
  isBackToBack: boolean
  stat: string
  line: number
}

export function detectNarratives(input: NarrativeInput): NarrativeFlag[] {
  const flags: NarrativeFlag[] = []
  const {
    player, game, gameLogs, seasonStats, injuries,
    isHome, restDays, isBackToBack, stat, line,
  } = input

  // 1. Revenge Game — player's former team
  detectRevengeGame(flags, player, game, gameLogs, stat, isHome)

  // 2. Milestone Watch
  detectMilestoneWatch(flags, player, seasonStats)

  // 3. Team Losing Streak
  detectTeamStreak(flags, gameLogs)

  // 4. Blowout Bounce
  detectBlowoutBounce(flags, gameLogs, stat, line)

  // 5. Return from Injury
  detectInjuryReturn(flags, gameLogs)

  // 6. Back-to-Back Road Game
  detectB2BRoad(flags, isHome, isBackToBack)

  // 7. Rest Mismatch
  detectRestMismatch(flags, restDays, game)

  // 8. Key Teammate Out
  detectKeyTeammateOut(flags, injuries, player, stat)

  // 9. Rivalry Game
  detectRivalry(flags, player, game, isHome)

  return flags
}

function detectRevengeGame(
  flags: NarrativeFlag[],
  player: Player,
  game: Game,
  gameLogs: GameLog[],
  stat: string,
  isHome: boolean,
) {
  // Check head-to-head history for elevated performance (proxy for revenge game)
  const opponent = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev
  const h2hGames = gameLogs.filter(g => g.opponent === opponent)

  if (h2hGames.length >= 2) {
    const h2hAvg = h2hGames.reduce((sum, g) => sum + (g.stats[stat] ?? 0), 0) / h2hGames.length
    const seasonAvg = gameLogs.length > 0
      ? gameLogs.reduce((sum, g) => sum + (g.stats[stat] ?? 0), 0) / gameLogs.length
      : 0

    if (h2hAvg > seasonAvg * 1.2 && h2hGames.length >= 3) {
      flags.push({
        type: 'revenge_game',
        headline: `Elevated vs ${opponent}`,
        detail: `Averages ${h2hAvg.toFixed(1)} ${stat} vs ${opponent} (${((h2hAvg / seasonAvg - 1) * 100).toFixed(0)}% above season avg)`,
        impact: 'positive',
        historicalStat: `${h2hAvg.toFixed(1)} avg in ${h2hGames.length} games vs ${opponent}`,
        severity: h2hAvg > seasonAvg * 1.3 ? 'high' : 'medium',
      })
    }
  }
}

function detectMilestoneWatch(
  flags: NarrativeFlag[],
  player: Player,
  seasonStats: SeasonStats,
) {
  // Check if player is approaching a round-number milestone
  const total = seasonStats.total
  const milestones = [1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000]

  for (const milestone of milestones) {
    const remaining = milestone - total
    if (remaining > 0 && remaining <= 100) {
      flags.push({
        type: 'milestone',
        headline: `${remaining} away from ${milestone.toLocaleString()}`,
        detail: `${player.name} has ${total.toLocaleString()} career ${seasonStats.stat} — just ${remaining} from ${milestone.toLocaleString()}`,
        impact: 'positive',
        severity: remaining <= 20 ? 'high' : 'medium',
      })
      break
    }
  }
}

function detectTeamStreak(flags: NarrativeFlag[], gameLogs: GameLog[]) {
  if (gameLogs.length < 3) return

  let streak = 0
  for (const g of gameLogs) {
    if (streak === 0) {
      streak = g.result === 'W' ? 1 : -1
    } else if (streak > 0 && g.result === 'W') {
      streak++
    } else if (streak < 0 && g.result === 'L') {
      streak--
    } else {
      break
    }
  }

  if (streak >= 4) {
    flags.push({
      type: 'winning_streak',
      headline: `${streak}-game win streak`,
      detail: `Team on a hot streak — high confidence, running rotations may tighten`,
      impact: 'neutral',
      severity: streak >= 7 ? 'high' : 'medium',
    })
  } else if (streak <= -4) {
    flags.push({
      type: 'losing_streak',
      headline: `${Math.abs(streak)}-game losing streak`,
      detail: `Team struggling — extended minutes for starters possible, or garbage time may increase`,
      impact: 'neutral',
      severity: Math.abs(streak) >= 7 ? 'high' : 'medium',
    })
  }
}

function detectBlowoutBounce(
  flags: NarrativeFlag[],
  gameLogs: GameLog[],
  stat: string,
  line: number,
) {
  if (gameLogs.length < 2) return

  const lastGame = gameLogs[0]
  const lastValue = lastGame.stats[stat] ?? 0
  const margin = lastValue - line

  // If last game was a massive miss (>40% below line), flag bounce potential
  if (line > 0 && margin < -(line * 0.4)) {
    flags.push({
      type: 'blowout_bounce',
      headline: 'Bounce-back candidate',
      detail: `Last game: ${lastValue} ${stat} (${margin > 0 ? '+' : ''}${margin.toFixed(1)} vs line). Significant underperformance often triggers regression to mean.`,
      impact: 'positive',
      severity: margin < -(line * 0.6) ? 'high' : 'medium',
    })
  }
}

function detectInjuryReturn(flags: NarrativeFlag[], gameLogs: GameLog[]) {
  if (gameLogs.length < 2) return

  // Check for gap between most recent games (indicating missed games)
  const lastDate = new Date(gameLogs[0].date)
  const prevDate = new Date(gameLogs[1].date)
  const dayGap = (lastDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

  if (dayGap >= 7) {
    flags.push({
      type: 'return_from_injury',
      headline: 'Recent return',
      detail: `${Math.round(dayGap)}-day gap between games — possible injury return. Early-return games often feature minutes limits.`,
      impact: 'negative',
      severity: dayGap >= 14 ? 'high' : 'medium',
    })
  }
}

function detectB2BRoad(flags: NarrativeFlag[], isHome: boolean, isBackToBack: boolean) {
  if (isBackToBack && !isHome) {
    flags.push({
      type: 'back_to_back_road',
      headline: 'B2B road game',
      detail: 'Back-to-back on the road is the most fatiguing scenario. Historically correlates with reduced performance.',
      impact: 'negative',
      severity: 'high',
    })
  }
}

function detectRestMismatch(flags: NarrativeFlag[], restDays: number, game: Game) {
  if (restDays >= 3) {
    flags.push({
      type: 'rest_mismatch',
      headline: `${restDays} days rest`,
      detail: `Well-rested with ${restDays} days off. Extended rest generally boosts performance, especially for older players.`,
      impact: 'positive',
      severity: restDays >= 4 ? 'high' : 'medium',
    })
  }
}

function detectKeyTeammateOut(
  flags: NarrativeFlag[],
  injuries: InjuryContext[],
  player: Player,
  stat: string,
) {
  const highImpactOut = injuries.filter(
    inj => inj.impact === 'high' && inj.status === 'Out' && inj.team === 'teammate'
  )

  for (const inj of highImpactOut) {
    flags.push({
      type: 'key_teammate_out',
      headline: `${inj.playerName} OUT`,
      detail: inj.relevance,
      impact: stat === 'points' || stat === 'assists' ? 'positive' : 'neutral',
      severity: 'high',
    })
  }
}

function detectRivalry(
  flags: NarrativeFlag[],
  player: Player,
  game: Game,
  isHome: boolean,
) {
  const team = player.team.abbrev
  const opponent = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev

  const rivalriesBySport: Record<string, Record<string, string[]>> = {
    nba: {
      LAL: ['BOS', 'LAC'], BOS: ['LAL', 'NYK', 'PHI'],
      NYK: ['BKN', 'BOS'], BKN: ['NYK'],
      LAC: ['LAL'], GSW: ['LAL', 'CLE'],
      MIA: ['BOS'], PHI: ['BOS', 'NYK'],
      CHI: ['DET', 'CLE'], DAL: ['SAS', 'HOU'],
    },
    mlb: {
      NYY: ['BOS', 'NYM'], BOS: ['NYY'],
      NYM: ['NYY', 'PHI'], PHI: ['NYM'],
      LAD: ['SFG', 'SDP'], SFG: ['LAD'],
      CHC: ['STL'], STL: ['CHC'],
    },
    nfl: {
      DAL: ['PHI', 'WSH', 'NYG'], PHI: ['DAL', 'NYG', 'WSH'],
      NYG: ['DAL', 'PHI'], WSH: ['DAL'],
      GB: ['CHI', 'MIN'], CHI: ['GB'],
      NE: ['NYJ', 'MIA'], PIT: ['BAL', 'CLE'],
      BAL: ['PIT'], SF: ['SEA', 'LAR'],
    },
  }

  const rivalries = rivalriesBySport[player.sport] ?? {}

  if (rivalries[team]?.includes(opponent)) {
    flags.push({
      type: 'rivalry',
      headline: `Rivalry: ${team} vs ${opponent}`,
      detail: 'Rivalry games tend to feature higher intensity and unpredictable performances.',
      impact: 'neutral',
      severity: 'medium',
    })
  }
}
