// ============================================================
// lib/daily-edge-service.ts — Daily Check-In Flow Orchestration
// ============================================================
// Manages the daily 4-step check-in experience:
// Step 1: Today's Top Signal — show highest-convergence prop
// Step 2: Quick Quiz — over/under decision
// Step 3: Yesterday's Scorecard — results from prior day
// Step 4: Complete — streak update + research grade

import type {
  DailyCheckIn,
  ResearchStreak,
  StreakMilestone,
} from '@/types/daily-checkin'
import { getStreakTier, STREAK_MILESTONES } from '@/types/daily-checkin'

/** Build a fresh check-in for today */
export function createTodayCheckIn(userId: string, date: string): DailyCheckIn {
  return {
    id: `${userId}_${date}`,
    userId,
    date,
    completed: false,
    steps: {
      topSignal: { shown: false, action: null },
      quiz: { shown: false, answer: null, correct: null },
      scorecard: { shown: false, viewed: false },
    },
  }
}

/** Update streak after completing a check-in */
export function updateStreak(
  streak: ResearchStreak,
  today: string,
  yesterday: string
): ResearchStreak {
  const updated = { ...streak }

  // Check if yesterday was completed (streak continues)
  // This is called when today's check-in is completed
  updated.totalDaysCompleted += 1

  // Simple streak logic: if last check-in was yesterday, continue; else reset
  // The caller should determine if the previous day was completed
  updated.currentStreak += 1

  if (updated.currentStreak > updated.longestStreak) {
    updated.longestStreak = updated.currentStreak
  }

  // Award shields every 7-day streak
  if (updated.currentStreak % 7 === 0 && updated.streakShields < 2) {
    updated.streakShields = Math.min(updated.streakShields + 1, 2)
  }

  // Update tier
  updated.tier = getStreakTier(updated.currentStreak)

  // Check milestones
  updated.milestones = STREAK_MILESTONES.map(m => {
    const existing = updated.milestones.find(em => em.days === m.days)
    if (existing?.achieved) return existing
    return {
      ...m,
      achieved: updated.currentStreak >= m.days,
      achievedDate: updated.currentStreak >= m.days ? today : undefined,
    }
  })

  return updated
}

/** Reset streak (missed a day without shield) */
export function resetStreak(streak: ResearchStreak): ResearchStreak {
  return {
    ...streak,
    currentStreak: 0,
    tier: 'starter',
  }
}

/** Use a shield to preserve streak */
export function useShield(streak: ResearchStreak, date: string): ResearchStreak | null {
  if (streak.streakShields <= 0) return null
  return {
    ...streak,
    streakShields: streak.streakShields - 1,
    shieldUsedDates: [...streak.shieldUsedDates, date],
  }
}

/** Create initial streak for new users */
export function createInitialStreak(userId: string): ResearchStreak {
  return {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    totalDaysCompleted: 0,
    streakShields: 0,
    shieldUsedDates: [],
    tier: 'starter',
    milestones: STREAK_MILESTONES.map(m => ({
      ...m,
      achieved: false,
    })),
    researchGradeByStreakLength: [],
  }
}

/** Generate today's top signal (mock — in production wired to situation room) */
export interface TopSignal {
  playerName: string
  team: string
  stat: string
  line: number
  convergenceScore: number
  direction: 'over' | 'under'
  keyFactors: string[]
}

/** Generate quiz question from a prop */
export interface QuizQuestion {
  playerName: string
  team: string
  opponent: string
  stat: string
  line: number
  hint: string
  correctAnswer: 'over' | 'under'
  explanation: string
}

// ---- DB Row Mappers ----

export function mapRowToCheckIn(row: Record<string, unknown>): DailyCheckIn {
  const steps = typeof row.steps_json === 'string'
    ? JSON.parse(row.steps_json)
    : (row.steps_json ?? {
        topSignal: { shown: false, action: null },
        quiz: { shown: false, answer: null, correct: null },
        scorecard: { shown: false, viewed: false },
      })

  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? '',
    date: (row.date as string) ?? '',
    completed: (row.completed as boolean) ?? false,
    steps,
  }
}

export function mapRowToStreak(row: Record<string, unknown>): ResearchStreak {
  const milestones = typeof row.milestones_json === 'string'
    ? JSON.parse(row.milestones_json)
    : (row.milestones_json ?? [])

  const shieldDates = typeof row.shield_used_dates === 'string'
    ? JSON.parse(row.shield_used_dates)
    : (row.shield_used_dates ?? [])

  const gradeByStreak = typeof row.grade_by_streak_json === 'string'
    ? JSON.parse(row.grade_by_streak_json)
    : (row.grade_by_streak_json ?? [])

  return {
    userId: (row.user_id as string) ?? '',
    currentStreak: (row.current_streak as number) ?? 0,
    longestStreak: (row.longest_streak as number) ?? 0,
    totalDaysCompleted: (row.total_days_completed as number) ?? 0,
    streakShields: (row.streak_shields as number) ?? 0,
    shieldUsedDates: shieldDates,
    tier: getStreakTier((row.current_streak as number) ?? 0),
    milestones,
    researchGradeByStreakLength: gradeByStreak,
  }
}
