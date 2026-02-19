// ============================================================
// lib/graveyard-service.ts — Bad Beat Autopsy Engine
// ============================================================
// Analyzes missed bets to determine root causes, assigns
// process grades, and identifies learning opportunities.

import type {
  GraveyardEntry,
  BetAutopsy,
  AutopsyCause,
} from '@/types/innovation-playbook'
import type { GameLog } from '@/types/shared'

interface AutopsyInput {
  playerName: string
  stat: string
  line: number
  direction: 'over' | 'under'
  actualValue: number
  convergenceAtTimeOfBet: number
  gameLog?: GameLog
  minutesPlayed?: number
  teamResult?: 'W' | 'L'
  finalMargin?: number // point differential in the game
  wasBlowout?: boolean
  hadInjuryDuringGame?: boolean
  hadLineupChange?: boolean
  isBackToBack?: boolean
}

export function generateAutopsy(input: AutopsyInput): BetAutopsy {
  const margin = input.direction === 'over'
    ? input.actualValue - input.line
    : input.line - input.actualValue

  const rootCauses = identifyRootCauses(input, margin)
  const wasUnlucky = assessLuck(input, margin, rootCauses)
  const unluckScore = calculateUnluckScore(input, margin, rootCauses)
  const processGrade = gradeProcess(input.convergenceAtTimeOfBet, rootCauses)
  const processAssessment = buildProcessAssessment(processGrade, input.convergenceAtTimeOfBet, rootCauses)
  const wouldBetAgain = processGrade <= 'B' && (wasUnlucky || unluckScore >= 60)
  const lessonsLearned = extractLessons(rootCauses, input)

  return {
    rootCauses,
    processGrade,
    processAssessment,
    wasUnlucky,
    unluckScore,
    wouldBetAgain,
    lessonsLearned,
  }
}

function identifyRootCauses(input: AutopsyInput, margin: number): AutopsyCause[] {
  const causes: AutopsyCause[] = []

  // Blowout check
  if (input.wasBlowout || (input.finalMargin != null && Math.abs(input.finalMargin) >= 25)) {
    causes.push({
      type: 'blowout',
      label: 'Game was a blowout',
      detail: `Final margin of ${input.finalMargin ?? 'unknown'} points likely reduced playing time for starters.`,
      wasKnowable: false,
      severity: 'primary',
    })
  }

  // Injury during game
  if (input.hadInjuryDuringGame) {
    causes.push({
      type: 'injury_during_game',
      label: 'Player was injured during the game',
      detail: 'An in-game injury cut into playing time and performance.',
      wasKnowable: false,
      severity: 'primary',
    })
  }

  // Minute restriction / foul trouble
  if (input.minutesPlayed != null && input.minutesPlayed < 25) {
    causes.push({
      type: 'minute_restriction',
      label: 'Limited minutes played',
      detail: `Only ${input.minutesPlayed} minutes — could indicate foul trouble, blowout, or restriction.`,
      wasKnowable: false,
      severity: causes.length === 0 ? 'primary' : 'contributing',
    })
  }

  // Foul trouble (if minutes were low without blowout)
  if (input.minutesPlayed != null && input.minutesPlayed < 25 && !input.wasBlowout) {
    causes.push({
      type: 'foul_trouble',
      label: 'Possible foul trouble',
      detail: 'Low minutes without a blowout game suggests foul trouble or in-game rest.',
      wasKnowable: false,
      severity: 'contributing',
    })
  }

  // Lineup change
  if (input.hadLineupChange) {
    causes.push({
      type: 'lineup_change',
      label: 'Lineup change affected role',
      detail: 'A teammate entering or exiting the lineup may have shifted usage.',
      wasKnowable: true,
      severity: 'contributing',
    })
  }

  // B2B fatigue
  if (input.isBackToBack) {
    causes.push({
      type: 'game_flow',
      label: 'Back-to-back fatigue',
      detail: 'Playing on a back-to-back may have reduced energy and performance.',
      wasKnowable: true,
      severity: 'contributing',
    })
  }

  // Close miss — regression
  if (Math.abs(margin) <= 1.5 && causes.length === 0) {
    causes.push({
      type: 'regression',
      label: 'Narrow miss — variance',
      detail: `Missed by only ${Math.abs(margin).toFixed(1)}. This is within normal variance.`,
      wasKnowable: false,
      severity: 'primary',
    })
  }

  // Line was sharp (high convergence but still missed)
  if (input.convergenceAtTimeOfBet >= 5 && causes.length === 0) {
    causes.push({
      type: 'line_was_sharp',
      label: 'Sharp line / market-efficient',
      detail: `Despite ${input.convergenceAtTimeOfBet}/7 convergence, the line held. Market may have been efficient.`,
      wasKnowable: false,
      severity: 'primary',
    })
  }

  // Bad matchup read (low convergence)
  if (input.convergenceAtTimeOfBet <= 3 && causes.length === 0) {
    causes.push({
      type: 'bad_matchup_read',
      label: 'Low convergence signal',
      detail: `Convergence was only ${input.convergenceAtTimeOfBet}/7 — a weak signal to begin with.`,
      wasKnowable: true,
      severity: 'primary',
    })
  }

  // Catch-all
  if (causes.length === 0) {
    causes.push({
      type: 'other',
      label: 'No clear root cause',
      detail: `Missed by ${Math.abs(margin).toFixed(1)}. No obvious external factor detected.`,
      wasKnowable: false,
      severity: 'primary',
    })
  }

  return causes
}

function assessLuck(input: AutopsyInput, margin: number, causes: AutopsyCause[]): boolean {
  // Narrow miss with high convergence is unlucky
  if (Math.abs(margin) <= 2 && input.convergenceAtTimeOfBet >= 5) return true
  // In-game injuries or blowouts are unlucky
  if (causes.some(c => c.type === 'injury_during_game' || c.type === 'blowout')) return true
  return false
}

function calculateUnluckScore(input: AutopsyInput, margin: number, causes: AutopsyCause[]): number {
  let score = 50 // Start at neutral

  // Closer margin = more unlucky
  if (Math.abs(margin) <= 0.5) score += 30
  else if (Math.abs(margin) <= 1.5) score += 20
  else if (Math.abs(margin) <= 3) score += 10
  else score -= 10

  // Higher convergence = more unlucky (good process should win)
  if (input.convergenceAtTimeOfBet >= 6) score += 15
  else if (input.convergenceAtTimeOfBet >= 5) score += 10
  else if (input.convergenceAtTimeOfBet <= 3) score -= 15

  // Unforeseeable causes increase luck factor
  const unknowableCauses = causes.filter(c => !c.wasKnowable)
  score += unknowableCauses.length * 5

  return Math.max(0, Math.min(100, score))
}

function gradeProcess(convergence: number, causes: AutopsyCause[]): BetAutopsy['processGrade'] {
  // High convergence with unknowable causes = good process
  const knowableCauses = causes.filter(c => c.wasKnowable)

  if (convergence >= 6 && knowableCauses.length === 0) return 'A'
  if (convergence >= 5 && knowableCauses.length === 0) return 'B'
  if (convergence >= 4) return 'C'
  if (convergence >= 3) return 'D'
  return 'F'
}

function buildProcessAssessment(
  grade: BetAutopsy['processGrade'],
  convergence: number,
  causes: AutopsyCause[],
): string {
  const knowable = causes.filter(c => c.wasKnowable)

  switch (grade) {
    case 'A':
      return `Strong process (${convergence}/7 convergence). The miss was driven by factors outside your control. Keep this approach.`
    case 'B':
      return `Good process (${convergence}/7 convergence). Minor refinements possible but the analysis was solid.`
    case 'C':
      return `Average process (${convergence}/7 convergence). ${knowable.length > 0 ? `Consider: ${knowable.map(c => c.label).join(', ')}.` : 'The signal was mixed.'}`
    case 'D':
      return `Below-average process (${convergence}/7 convergence). The data wasn't strongly supporting this pick.`
    case 'F':
      return `Poor process (${convergence}/7 convergence). Convergence was low — this was more of a gut call than a data-driven play.`
  }
}

function extractLessons(causes: AutopsyCause[], input: AutopsyInput): string[] {
  const lessons: string[] = []

  if (causes.some(c => c.type === 'blowout')) {
    lessons.push('Consider checking implied game script before betting player props in lopsided matchups.')
  }

  if (causes.some(c => c.type === 'foul_trouble' || c.type === 'minute_restriction')) {
    lessons.push('Minute projections should be cross-referenced with foul rate history.')
  }

  if (causes.some(c => c.type === 'bad_matchup_read')) {
    lessons.push('Low convergence picks have a low base rate — save these for small exposure plays.')
  }

  if (causes.some(c => c.type === 'lineup_change')) {
    lessons.push('Monitor lineup news closer to tip-off for late-breaking changes.')
  }

  if (input.isBackToBack) {
    lessons.push('Back-to-back games carry inherent variance — factor in fatigue when sizing bets.')
  }

  if (causes.some(c => c.type === 'regression') || causes.some(c => c.type === 'line_was_sharp')) {
    lessons.push('Narrow misses on strong signals are part of the game. Process over results.')
  }

  if (lessons.length === 0) {
    lessons.push('No clear process improvements identified. Continue trusting the convergence model.')
  }

  return lessons
}

// ── Aggregate analytics ──

export interface LossPatterns {
  totalEntries: number
  avgMargin: number
  avgConvergence: number
  avgUnluckScore: number
  topCauses: Array<{ type: AutopsyCause['type']; count: number; percentage: number }>
  gradeDistribution: Record<BetAutopsy['processGrade'], number>
  wouldBetAgainRate: number
}

export function analyzeLossPatterns(entries: GraveyardEntry[]): LossPatterns {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      avgMargin: 0,
      avgConvergence: 0,
      avgUnluckScore: 0,
      topCauses: [],
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      wouldBetAgainRate: 0,
    }
  }

  const totalEntries = entries.length
  const avgMargin = entries.reduce((s, e) => s + Math.abs(e.margin), 0) / totalEntries
  const avgConvergence = entries.reduce((s, e) => s + e.convergenceAtTimeOfBet, 0) / totalEntries
  const avgUnluckScore = entries.reduce((s, e) => s + e.autopsy.unluckScore, 0) / totalEntries

  // Count causes
  const causeCounts = new Map<AutopsyCause['type'], number>()
  for (const entry of entries) {
    for (const cause of entry.autopsy.rootCauses) {
      causeCounts.set(cause.type, (causeCounts.get(cause.type) ?? 0) + 1)
    }
  }
  const topCauses = [...causeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count, percentage: (count / totalEntries) * 100 }))

  // Grade distribution
  const gradeDistribution: Record<BetAutopsy['processGrade'], number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const entry of entries) {
    gradeDistribution[entry.autopsy.processGrade]++
  }

  const wouldBetAgainRate = entries.filter(e => e.autopsy.wouldBetAgain).length / totalEntries

  return {
    totalEntries,
    avgMargin: Math.round(avgMargin * 10) / 10,
    avgConvergence: Math.round(avgConvergence * 10) / 10,
    avgUnluckScore: Math.round(avgUnluckScore),
    topCauses,
    gradeDistribution,
    wouldBetAgainRate: Math.round(wouldBetAgainRate * 100),
  }
}
