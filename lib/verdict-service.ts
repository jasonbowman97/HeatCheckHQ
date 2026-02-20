// ============================================================
// lib/verdict-service.ts — Synthesize verdict from convergence
// ============================================================
// Updated to use weight-aware confidence when WeightedFactors
// are available, while maintaining backward compat with plain
// ConvergenceFactors.

import type { ConvergenceFactor } from '@/types/check-prop'
import type { WeightedFactor } from './convergenceEngine/types'
import { getVerdictInfo } from './design-tokens'

interface VerdictInput {
  factors: ConvergenceFactor[]
  weightedFactors?: WeightedFactor[]  // New: optional weighted factors for better confidence
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
  const { factors, weightedFactors, overCount, underCount, hitRateL10, avgMarginL10, seasonAvg } = input

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

  let confidence: number

  if (weightedFactors && weightedFactors.length > 0) {
    // ── V2: Weight-aware confidence ──────────────────────────
    // Uses the actual weights from the spec to compute confidence.
    // Confidence = |SUM(weight * direction * strength)| * 100
    const weightedScore = weightedFactors.reduce(
      (sum, f) => sum + f.weight * f.direction * f.strength,
      0,
    ) * 100

    // Blend with hit rate for additional reinforcement
    const hitRateReinforcement = Math.abs(hitRateL10 - 0.5) * 40 // 0-20 bonus

    confidence = direction === 'toss-up'
      ? 50
      : Math.round(Math.abs(weightedScore) + hitRateReinforcement)
  } else {
    // ── Legacy: count-based confidence ───────────────────────
    const alignedFactors = factors.filter(f =>
      direction === 'toss-up' ? false : f.signal === direction
    )
    const totalStrength = factors.reduce((sum, f) => sum + f.strength, 0)
    const alignedStrength = alignedFactors.reduce((sum, f) => sum + f.strength, 0)

    const countConfidence = (convergenceScore / 9) * 100
    const strengthConfidence = totalStrength > 0
      ? (alignedStrength / totalStrength) * 100
      : 50

    confidence = direction === 'toss-up'
      ? 50
      : Math.round(countConfidence * 0.6 + strengthConfidence * 0.4)
  }

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
