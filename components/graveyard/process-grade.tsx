// ============================================================
// components/graveyard/process-grade.tsx — A-F grade badge
// ============================================================
// Color-coded grade badge with optional assessment tooltip.

"use client"

import type { BetAutopsy } from "@/types/innovation-playbook"

interface ProcessGradeProps {
  grade: BetAutopsy['processGrade']
  size?: 'sm' | 'md'
}

export function ProcessGrade({ grade, size = 'sm' }: ProcessGradeProps) {
  const styles: Record<BetAutopsy['processGrade'], string> = {
    A: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    B: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
    C: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    D: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
    F: 'bg-red-500/15 text-red-400 ring-red-500/30',
  }

  const sizeClasses = size === 'md'
    ? 'text-lg font-bold px-3 py-1'
    : 'text-[10px] font-semibold px-1.5 py-0.5'

  return (
    <span className={`rounded ring-1 flex-shrink-0 ${styles[grade]} ${sizeClasses}`}>
      {grade}
    </span>
  )
}
