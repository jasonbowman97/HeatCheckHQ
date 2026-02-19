// ============================================================
// lib/research-grade.ts — Research Grade Calculation
// ============================================================
// Calculates user's research grade based on process quality
// (data-aligned picks) and accuracy of data-aligned picks.

import type { ResearchGrade } from '@/types/daily-checkin'
import { calculateResearchGrade } from '@/types/daily-checkin'

export interface GradeInput {
  lean: 'over' | 'under' | null
  convergenceScore: number
  result: 'hit' | 'miss' | null
}

/** Compute full research grade from check-in history */
export function computeResearchGrade(
  userId: string,
  checks: GradeInput[]
): ResearchGrade {
  const grade = calculateResearchGrade(checks)

  const graded = checks.filter(c => c.lean !== null && c.result !== null)
  const dataAligned = graded.filter(c => c.convergenceScore >= 5)
  const dataOpposed = graded.filter(c => c.convergenceScore <= 2)

  const alignedHits = dataAligned.filter(c => c.result === 'hit').length
  const processAccuracy = dataAligned.length > 0 ? alignedHits / dataAligned.length : 0

  const opposedHits = dataOpposed.filter(c => c.result === 'hit').length
  const luckRate = dataOpposed.length > 0 ? opposedHits / dataOpposed.length : 0

  return {
    userId,
    currentGrade: grade,
    gradeHistory: [], // populated from DB
    totalChecks: graded.length,
    dataAlignedPicks: dataAligned.length,
    dataOpposedPicks: dataOpposed.length,
    processAccuracy,
    luckRate,
  }
}

/** Get grade color for display */
export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400'
  if (grade.startsWith('B')) return 'text-blue-400'
  if (grade.startsWith('C')) return 'text-amber-400'
  if (grade.startsWith('D')) return 'text-orange-400'
  return 'text-muted-foreground'
}

/** Get grade background for display */
export function gradeBg(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/15'
  if (grade.startsWith('B')) return 'bg-blue-500/15'
  if (grade.startsWith('C')) return 'bg-amber-500/15'
  if (grade.startsWith('D')) return 'bg-orange-500/15'
  return 'bg-muted'
}
