// ============================================================
// app/api/daily-checkin/route.ts — Daily check-in + streak API
// ============================================================
// GET: Today's check-in + streak status
// POST: Complete a step or full check-in
// PATCH: Use streak shield

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/get-user-tier'
import {
  createTodayCheckIn,
  createInitialStreak,
  updateStreak,
  resetStreak,
  useShield,
  mapRowToCheckIn,
  mapRowToStreak,
} from '@/lib/daily-edge-service'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = todayStr()

  // Fetch today's check-in
  const { data: checkinRow } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const checkin = checkinRow
    ? mapRowToCheckIn(checkinRow)
    : createTodayCheckIn(user.id, today)

  // Fetch streak
  const { data: streakRow } = await supabase
    .from('research_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let streak = streakRow
    ? mapRowToStreak(streakRow)
    : createInitialStreak(user.id)

  // Check if streak should be reset (missed yesterday without shield)
  if (!checkinRow && streak.currentStreak > 0) {
    const { data: yesterdayRow } = await supabase
      .from('daily_checkins')
      .select('completed')
      .eq('user_id', user.id)
      .eq('date', yesterdayStr())
      .single()

    if (!yesterdayRow?.completed) {
      // Check if shield was used
      const shieldUsedYesterday = streak.shieldUsedDates.includes(yesterdayStr())
      if (!shieldUsedYesterday) {
        streak = resetStreak(streak)
        // Save reset
        await supabase
          .from('research_streaks')
          .upsert({
            user_id: user.id,
            current_streak: 0,
            longest_streak: streak.longestStreak,
            total_days_completed: streak.totalDaysCompleted,
            streak_shields: streak.streakShields,
            shield_used_dates: JSON.stringify(streak.shieldUsedDates),
            milestones_json: JSON.stringify(streak.milestones),
          })
      }
    }
  }

  return NextResponse.json({ checkin, streak })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tier = await getUserTier()
  if (tier === 'anonymous') {
    return NextResponse.json({ error: 'Sign in required' }, { status: 403 })
  }

  const body = await req.json()
  const action = body.action as 'step' | 'complete'
  const today = todayStr()

  // Get or create today's check-in
  const { data: existing } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  let checkin = existing
    ? mapRowToCheckIn(existing)
    : createTodayCheckIn(user.id, today)

  if (action === 'step') {
    const step = body.step as 'topSignal' | 'quiz' | 'scorecard'
    const data = body.data ?? {}

    if (step === 'topSignal') {
      checkin.steps.topSignal = { shown: true, action: data.action ?? null }
    } else if (step === 'quiz') {
      checkin.steps.quiz = {
        shown: true,
        answer: data.answer ?? null,
        correct: data.correct ?? null,
      }
    } else if (step === 'scorecard') {
      checkin.steps.scorecard = { shown: true, viewed: true }
    }

    // Auto-complete if all steps done
    const { topSignal, quiz, scorecard } = checkin.steps
    if (topSignal.shown && quiz.shown && scorecard.shown) {
      checkin.completed = true
    }
  } else if (action === 'complete') {
    checkin.completed = true
  }

  // Save check-in
  await supabase
    .from('daily_checkins')
    .upsert({
      id: checkin.id,
      user_id: user.id,
      date: today,
      completed: checkin.completed,
      steps_json: JSON.stringify(checkin.steps),
    })

  // Update streak if just completed
  let streak = null
  if (checkin.completed) {
    const { data: streakRow } = await supabase
      .from('research_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    streak = streakRow
      ? updateStreak(mapRowToStreak(streakRow), today, yesterdayStr())
      : updateStreak(createInitialStreak(user.id), today, yesterdayStr())

    await supabase
      .from('research_streaks')
      .upsert({
        user_id: user.id,
        current_streak: streak.currentStreak,
        longest_streak: streak.longestStreak,
        total_days_completed: streak.totalDaysCompleted,
        streak_shields: streak.streakShields,
        shield_used_dates: JSON.stringify(streak.shieldUsedDates),
        milestones_json: JSON.stringify(streak.milestones),
      })
  }

  return NextResponse.json({ checkin, streak })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (body.action === 'use_shield') {
    const { data: streakRow } = await supabase
      .from('research_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!streakRow) {
      return NextResponse.json({ error: 'No streak found' }, { status: 404 })
    }

    const streak = mapRowToStreak(streakRow)
    const updated = useShield(streak, yesterdayStr())

    if (!updated) {
      return NextResponse.json({ error: 'No shields available' }, { status: 400 })
    }

    await supabase
      .from('research_streaks')
      .update({
        streak_shields: updated.streakShields,
        shield_used_dates: JSON.stringify(updated.shieldUsedDates),
      })
      .eq('user_id', user.id)

    return NextResponse.json({ streak: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
