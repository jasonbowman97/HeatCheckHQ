// ============================================================
// lib/design-tokens.ts — HeatCheck HQ Design System Tokens
// ============================================================

export const colors = {
  heatScale: {
    hot5: '#22C55E',  // deep green — strong over
    hot4: '#4ADE80',
    hot3: '#86EFAC',  // light green — marginal over
    neutral: '#9CA3AF', // gray
    cold3: '#FCA5A5',  // light red — marginal under
    cold4: '#F87171',
    cold5: '#EF4444',  // deep red — strong under
  },
  brand: {
    primary: '#E85D2C',     // HeatCheck orange
    accent: '#2E75B6',      // blue accent
    dark: '#1A1A2E',        // dark navy background
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    border: '#E2E8F0',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
  },
  verdict: {
    strongOver: '#16A34A',
    leanOver: '#4ADE80',
    tossUp: '#FACC15',
    leanUnder: '#FB923C',
    strongUnder: '#EF4444',
  },
} as const

// Verdict label lookup by convergence score
export const verdictLabels = {
  9: { label: 'FULL CONVERGENCE', sublabel: 'All signals aligned', color: colors.verdict.strongOver, icon: '🔥' },
  8: { label: 'NEAR-FULL', sublabel: '8 of 9 factors aligned', color: colors.verdict.strongOver, icon: '🔥' },
  7: { label: 'STRONG', sublabel: '7 of 9 factors aligned', color: colors.verdict.strongOver, icon: '🟢' },
  6: { label: 'STRONG', sublabel: '6 of 9 factors aligned', color: colors.verdict.strongOver, icon: '🟢' },
  5: { label: 'LEAN', sublabel: '5 of 9 factors aligned', color: colors.verdict.leanOver, icon: '🟢' },
  4: { label: 'SLIGHT LEAN', sublabel: 'Marginal edge detected', color: colors.verdict.tossUp, icon: '🟡' },
  3: { label: 'MIXED SIGNALS', sublabel: 'Data is split', color: colors.verdict.tossUp, icon: '🟡' },
  2: { label: 'LEAN AGAINST', sublabel: 'Factors favor the other side', color: colors.verdict.leanUnder, icon: '🟠' },
  1: { label: 'STRONG AGAINST', sublabel: 'Strong case against', color: colors.verdict.strongUnder, icon: '🔴' },
  0: { label: 'FADE', sublabel: 'All signals oppose', color: colors.verdict.strongUnder, icon: '🔴' },
} as const

// Heat Ring segment color by margin
export function getHeatRingSegmentColor(margin: number): string {
  if (margin > 5) return colors.heatScale.hot5
  if (margin > 2) return colors.heatScale.hot4
  if (margin > 0) return colors.heatScale.hot3
  if (margin > -2) return colors.heatScale.cold3
  if (margin > -5) return colors.heatScale.cold4
  return colors.heatScale.cold5
}

// Opponent defense ring color by rank
export function getDefenseRingColor(rank: number): string {
  if (rank <= 10) return '#334155' // dark gray/navy (tough)
  if (rank <= 20) return '#94A3B8' // medium gray
  return '#E2E8F0' // light (easy)
}

// Verdict info helper
export function getVerdictInfo(score: number, direction: 'over' | 'under' | 'toss-up') {
  if (direction === 'toss-up') {
    return { label: 'TOSS-UP', sublabel: 'Data is split — no clear edge', icon: '🟡', color: colors.verdict.tossUp }
  }
  const dir = direction.toUpperCase()
  if (score >= 8) return { label: `FULL CONVERGENCE ${dir}`, sublabel: `${score}/9 signals aligned`, icon: '🔥', color: direction === 'over' ? colors.verdict.strongOver : colors.verdict.strongUnder }
  if (score >= 6) return { label: `STRONG ${dir}`, sublabel: `${score}/9 factors favor ${direction}`, icon: direction === 'over' ? '🟢' : '🔴', color: direction === 'over' ? colors.verdict.strongOver : colors.verdict.strongUnder }
  if (score >= 5) return { label: `LEAN ${dir}`, sublabel: `${score}/9 factors favor ${direction}`, icon: direction === 'over' ? '🟢' : '🔴', color: direction === 'over' ? colors.verdict.leanOver : colors.verdict.leanUnder }
  return { label: 'SLIGHT LEAN', sublabel: 'Marginal edge detected', icon: '🟡', color: colors.verdict.tossUp }
}

// Stat label mapping per sport
export const statLabels: Record<string, Record<string, string>> = {
  nba: {
    points: 'Points', rebounds: 'Rebounds', assists: 'Assists',
    threes: '3-Pointers', steals: 'Steals', blocks: 'Blocks',
    turnovers: 'Turnovers', pts_reb_ast: 'PRA', pts_reb: 'Pts+Reb',
    pts_ast: 'Pts+Ast', reb_ast: 'Reb+Ast', minutes: 'Minutes',
    double_double: 'Double-Double',
  },
  mlb: {
    hits: 'Hits', home_runs: 'Home Runs', rbis: 'RBIs',
    runs: 'Runs', stolen_bases: 'Stolen Bases', total_bases: 'Total Bases',
    strikeouts_pitcher: 'Strikeouts (K)', walks_pitcher: 'Walks (BB)',
    earned_runs: 'Earned Runs', hits_allowed: 'Hits Allowed',
    innings_pitched: 'Innings Pitched', outs_recorded: 'Outs Recorded',
  },
  nfl: {
    passing_yards: 'Passing Yards', passing_tds: 'Passing TDs',
    rushing_yards: 'Rushing Yards', rushing_tds: 'Rushing TDs',
    receiving_yards: 'Receiving Yards', receptions: 'Receptions',
    receiving_tds: 'Receiving TDs', completions: 'Completions',
    interceptions: 'Interceptions', fantasy_points: 'Fantasy Points',
  },
}

export function getStatLabel(stat: string, sport: string): string {
  return statLabels[sport]?.[stat] ?? stat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ──── HEAT COLOR UTILITIES ────
// Centralizes scattered red/green/yellow ternary logic across analyzer components.

/** Map a hit rate (0-1) to Tailwind text class */
export function getHitRateColor(rate: number): string {
  if (rate >= 0.7) return 'text-emerald-400'
  if (rate >= 0.5) return 'text-yellow-400'
  return 'text-red-400'
}

/** Map a confidence score (0-100) to a Tailwind text class */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-emerald-400'
  if (confidence >= 60) return 'text-yellow-400'
  return 'text-muted-foreground'
}

/** Map verdict direction to accent bar bg class */
export function getVerdictAccentClass(verdict: 'over' | 'under' | 'neutral'): string {
  if (verdict === 'over') return 'bg-emerald-500'
  if (verdict === 'under') return 'bg-red-500'
  return 'bg-yellow-500'
}

/** Map a signal direction to dot/bar bg class */
export function getSignalColor(signal: 'over' | 'under' | 'neutral'): string {
  if (signal === 'over') return 'bg-emerald-500'
  if (signal === 'under') return 'bg-red-500'
  return 'bg-muted-foreground/40'
}

/** Map a signal direction to text class */
export function getSignalTextColor(signal: 'over' | 'under' | 'neutral'): string {
  if (signal === 'over') return 'text-emerald-400'
  if (signal === 'under') return 'text-red-400'
  return 'text-muted-foreground'
}

/** Map a defense rank (1-30) to text/bg classes for matchup context */
export function getDefenseMatchupColor(rank: number): { text: string; bg: string } {
  if (rank >= 21) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15' }
  if (rank <= 10) return { text: 'text-red-400', bg: 'bg-red-500/15' }
  return { text: 'text-yellow-400', bg: 'bg-yellow-500/10' }
}

/** Map the gap between season avg and line to an edge color */
export function getEdgeColor(gap: number): string {
  const abs = Math.abs(gap)
  if (abs >= 3) return gap > 0 ? 'text-emerald-400' : 'text-red-400'
  if (abs >= 1) return gap > 0 ? 'text-emerald-400/70' : 'text-red-400/70'
  return 'text-muted-foreground'
}

// ──── NARRATIVE TAG GENERATION ────

import type { PropSummary } from '@/types/analyzer'

export interface NarrativeTag {
  label: string
  variant: 'positive' | 'negative' | 'neutral' | 'info'
}

export interface MatchupContextLight {
  defRank?: number
  isHome?: boolean
  restDays?: number
  isB2B?: boolean
}

/**
 * Generate 1-2 short narrative tags for display on a prop card.
 * Priority-ordered: picks the top 2 most impactful tags.
 */
export function generateNarrativeTags(
  prop: PropSummary,
  matchupContext?: MatchupContextLight
): NarrativeTag[] {
  const tags: Array<NarrativeTag & { priority: number }> = []

  // Full convergence
  const dominant = Math.max(prop.convergenceOver, prop.convergenceUnder)
  if (dominant === 7) {
    tags.push({ label: 'All 7 aligned', variant: 'positive', priority: 10 })
  } else if (dominant >= 6) {
    tags.push({ label: `${dominant}/9 signals`, variant: 'positive', priority: 8 })
  }

  // Streak detection from last10Values
  if (prop.last10Values.length >= 3) {
    let streak = 0
    for (const val of prop.last10Values) {
      if (streak === 0) { streak = val > prop.line ? 1 : -1 }
      else if (streak > 0 && val > prop.line) { streak++ }
      else if (streak < 0 && val <= prop.line) { streak-- }
      else { break }
    }
    if (Math.abs(streak) >= 5) {
      tags.push({
        label: `${Math.abs(streak)}-game ${streak > 0 ? 'over' : 'under'} streak`,
        variant: streak > 0 ? 'positive' : 'negative',
        priority: 9,
      })
    } else if (Math.abs(streak) >= 3) {
      tags.push({
        label: `${Math.abs(streak)}-game ${streak > 0 ? 'over' : 'under'} streak`,
        variant: streak > 0 ? 'positive' : 'negative',
        priority: 6,
      })
    }
  }

  // Large edge between season avg and line
  const gap = prop.seasonAvg - prop.line
  if (Math.abs(gap) >= 3) {
    tags.push({
      label: gap > 0 ? `Avg +${gap.toFixed(1)} above line` : `Avg ${gap.toFixed(1)} below line`,
      variant: gap > 0 ? 'positive' : 'negative',
      priority: 5,
    })
  }

  // Matchup context tags
  if (matchupContext?.defRank !== undefined) {
    if (matchupContext.defRank >= 25) {
      tags.push({ label: `Facing #${matchupContext.defRank} DEF`, variant: 'positive', priority: 7 })
    } else if (matchupContext.defRank <= 5) {
      tags.push({ label: `vs #${matchupContext.defRank} DEF`, variant: 'negative', priority: 7 })
    }
  }

  if (matchupContext?.isB2B) {
    tags.push({ label: 'B2B fatigue', variant: 'negative', priority: 6 })
  }

  // Sort by priority descending, take top 2
  tags.sort((a, b) => b.priority - a.priority)
  return tags.slice(0, 2).map(({ label, variant }) => ({ label, variant }))
}
