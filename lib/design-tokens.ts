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
  7: { label: 'FULL CONVERGENCE', sublabel: 'All signals aligned', color: colors.verdict.strongOver, icon: '🔥' },
  6: { label: 'STRONG', sublabel: '6 of 7 factors aligned', color: colors.verdict.strongOver, icon: '🟢' },
  5: { label: 'LEAN', sublabel: '5 of 7 factors aligned', color: colors.verdict.leanOver, icon: '🟢' },
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
  if (score >= 7) return { label: `FULL CONVERGENCE ${dir}`, sublabel: 'All signals aligned', icon: '🔥', color: direction === 'over' ? colors.verdict.strongOver : colors.verdict.strongUnder }
  if (score >= 6) return { label: `STRONG ${dir}`, sublabel: `${score}/7 factors favor ${direction}`, icon: direction === 'over' ? '🟢' : '🔴', color: direction === 'over' ? colors.verdict.strongOver : colors.verdict.strongUnder }
  if (score >= 5) return { label: `LEAN ${dir}`, sublabel: `${score}/7 factors favor ${direction}`, icon: direction === 'over' ? '🟢' : '🔴', color: direction === 'over' ? colors.verdict.leanOver : colors.verdict.leanUnder }
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
