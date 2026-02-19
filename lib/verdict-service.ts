// ============================================================
// lib/verdict-service.ts — Synthesize verdict from convergence
// ============================================================

import type { ConvergenceFactor } from '@/types/check-prop'
import { getVerdictInfo } from './design-tokens'

interface VerdictInput {
  factors: ConvergenceFactor[]
  overCount: number
  underCount: number
  neutralCount: number
  hitRateL10: number
  avgMarginL10: number
  seasonAvg: number
}

interface VerdictOutput {
  direction: 'over' | 'under' | 'toss-up'
  convergenceScore: number
  confidence: number
  label: string
  sublabel: string
  icon: string
  color: string
  hitRateL10: number
  avgMarginL10: number
  seasonAvg: number
}

export function synthesizeVerdict(input: VerdictInput): VerdictOutput {
  const { factors, overCount, underCount, neutralCount, hitRateL10, avgMarginL10, seasonAvg } = input

  // Determine direction
  let direction: 'over' | 'under' | 'toss-up'
  let convergenceScore: number

  if (overCount > underCount) {
    direction = 'over'
    convergenceScore = overCount
  } else if (underCount > overCount) {
    direction = 'under'
    convergenceScore = underCount
  } else {
    direction = 'toss-up'
    convergenceScore = Math.max(overCount, underCount)
  }

  // Calculate weighted confidence (0-100)
  // Strength-weighted approach: factors with higher strength contribute more
  const alignedFactors = factors.filter(f =>
    direction === 'toss-up' ? false : f.signal === direction
  )

  const totalStrength = factors.reduce((sum, f) => sum + f.strength, 0)
  const alignedStrength = alignedFactors.reduce((sum, f) => sum + f.strength, 0)

  // Base confidence from factor count
  const countConfidence = (convergenceScore / 7) * 100

  // Strength-weighted confidence
  const strengthConfidence = totalStrength > 0
    ? (alignedStrength / totalStrength) * 100
    : 50

  // Blended: 60% count-based + 40% strength-based
  const confidence = direction === 'toss-up'
    ? 50
    : Math.round(countConfidence * 0.6 + strengthConfidence * 0.4)

  // Get display info
  const verdictInfo = getVerdictInfo(convergenceScore, direction)

  return {
    direction,
    convergenceScore,
    confidence: Math.min(99, Math.max(1, confidence)),
    label: verdictInfo.label,
    sublabel: verdictInfo.sublabel,
    icon: verdictInfo.icon,
    color: verdictInfo.color,
    hitRateL10,
    avgMarginL10,
    seasonAvg,
  }
}
