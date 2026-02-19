// ============================================================
// types/daily-checkin.ts — Daily Check-In, Streaks & Research Grade
// ============================================================

export interface ResearchStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  totalDaysCompleted: number
  streakShields: number       // max 2, earned per 7-day streak
  shieldUsedDates: string[]
  tier: StreakTier
  milestones: StreakMilestone[]
  researchGradeByStreakLength: Array<{
    streakRange: string
    avgResearchGrade: string
    avgHitRate: number
  }>
}

export type StreakTier = 'starter' | 'committed' | 'serious' | 'sharp' | 'legend'

export function getStreakTier(streak: number): StreakTier {
  if (streak >= 365) return 'legend'
  if (streak >= 90) return 'sharp'
  if (streak >= 30) return 'serious'
  if (streak >= 7) return 'committed'
  return 'starter'
}

export interface StreakMilestone {
  days: number
  name: string
  reward: string
  achieved: boolean
  achievedDate?: string
}

export const STREAK_MILESTONES: Omit<StreakMilestone, 'achieved' | 'achievedDate'>[] = [
  { days: 3, name: 'Getting Started', reward: 'Personal hit rate dashboard' },
  { days: 7, name: 'Weekly Regular', reward: '1 Streak Shield' },
  { days: 14, name: 'Committed', reward: 'Backtest 1 criteria' },
  { days: 30, name: 'Serious Bettor', reward: 'Badge + Research Grade history' },
  { days: 60, name: 'Sharp in Training', reward: 'Correlation insights' },
  { days: 90, name: 'Sharp', reward: 'Badge + leaderboard (opt-in)' },
  { days: 180, name: 'Half-Season', reward: 'Full season backtest' },
  { days: 365, name: 'Legend', reward: 'Permanent badge + discount lock' },
]

export interface DailyCheckIn {
  id: string
  userId: string
  date: string
  completed: boolean
  steps: {
    topSignal: { shown: boolean; action: 'lean' | 'pass' | null }
    quiz: { shown: boolean; answer: 'over' | 'under' | null; correct: boolean | null }
    scorecard: { shown: boolean; viewed: boolean }
  }
}

export interface ResearchGrade {
  userId: string
  currentGrade: string       // "B+", "A-", etc.
  gradeHistory: Array<{ month: string; grade: string }>
  totalChecks: number
  dataAlignedPicks: number   // convergence >= 5
  dataOpposedPicks: number   // convergence <= 2
  processAccuracy: number    // % of data-aligned picks that hit
  luckRate: number           // % of data-opposed picks that hit
}

export interface ResearchCriteria {
  id: string
  userId: string
  name: string
  sport: string
  stat: string
  direction: 'over' | 'under'
  conditions: CriteriaCondition[]
  isActive: boolean
  createdAt: string
  performance: {
    totalMatches: number
    hits: number
    misses: number
    hitRate: number
    avgMargin: number
    lastMatchDate: string
  }
}

export interface CriteriaCondition {
  field: CriteriaField
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in'
  value: any
}

export type CriteriaField =
  | 'home_away'
  | 'opponent_def_rank'
  | 'rest_days'
  | 'is_back_to_back'
  | 'team_spread'
  | 'convergence_score'
  | 'hit_rate_l10'
  | 'season_avg_vs_line'
  | 'streak_direction'
  | 'game_total'
  // MLB specific
  | 'pitcher_hand'
  | 'wind_speed'
  | 'temperature'
  // NFL specific
  | 'is_indoor'
  | 'is_primetime'
  | 'is_divisional'

// Research Grade calculation
export function calculateResearchGrade(
  checks: Array<{ lean: 'over' | 'under' | null; convergenceScore: number; result: 'hit' | 'miss' | null }>
): string {
  const graded = checks.filter(c => c.lean !== null && c.result !== null)
  if (graded.length < 10) return 'N/A'

  const dataAligned = graded.filter(c => c.convergenceScore >= 5)
  const processScore = dataAligned.length / graded.length
  const alignedHitRate = dataAligned.length > 0
    ? dataAligned.filter(c => c.result === 'hit').length / dataAligned.length
    : 0
  const grade = (processScore * 0.6) + (alignedHitRate * 0.4)

  if (grade >= 0.9) return 'A+'
  if (grade >= 0.85) return 'A'
  if (grade >= 0.8) return 'A-'
  if (grade >= 0.75) return 'B+'
  if (grade >= 0.7) return 'B'
  if (grade >= 0.65) return 'B-'
  if (grade >= 0.6) return 'C+'
  if (grade >= 0.55) return 'C'
  return 'C-'
}
