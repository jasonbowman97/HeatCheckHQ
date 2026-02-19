// ============================================================
// components/what-if/diff-view.tsx — Before/after convergence comparison
// ============================================================
// Shows the original vs modified convergence scores with
// factor-by-factor changes highlighted.

"use client"

import { ArrowRight, ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { WhatIfResult } from "@/types/innovation-playbook"

interface DiffViewProps {
  result: WhatIfResult | null
  loading?: boolean
}

export function DiffView({ result, loading }: DiffViewProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Adjust the controls and click &quot;Simulate Changes&quot; to see the impact
        </p>
      </div>
    )
  }

  const scoreChange = result.modifiedConvergence - result.originalConvergence
  const changedFactors = result.factorChanges.filter(f => f.changed)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Convergence comparison header */}
      <div className="px-4 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Original</p>
            <p className="text-2xl font-bold text-foreground">{result.originalConvergence}/7</p>
            <DirectionBadge direction={result.originalDirection} />
          </div>

          <div className="flex items-center gap-1">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            {scoreChange !== 0 && (
              <span className={`text-sm font-bold ${scoreChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {scoreChange > 0 ? '+' : ''}{scoreChange}
              </span>
            )}
          </div>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Modified</p>
            <p className={`text-2xl font-bold ${
              result.modifiedConvergence > result.originalConvergence ? 'text-emerald-400' :
              result.modifiedConvergence < result.originalConvergence ? 'text-red-400' :
              'text-foreground'
            }`}>
              {result.modifiedConvergence}/7
            </p>
            <DirectionBadge direction={result.modifiedDirection} />
          </div>
        </div>
      </div>

      {/* Factor changes */}
      <div className="divide-y divide-border">
        {result.factorChanges.map((factor) => (
          <div
            key={factor.factorKey}
            className={`px-4 py-2.5 flex items-center justify-between text-xs ${
              factor.changed ? 'bg-primary/[0.03]' : ''
            }`}
          >
            <span className={`font-medium ${factor.changed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {factor.factorName}
            </span>

            <div className="flex items-center gap-2">
              <SignalBadge signal={factor.originalSignal} />
              {factor.changed ? (
                <>
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <SignalBadge signal={factor.modifiedSignal} />
                </>
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground/30" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-muted/20 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {result.summary}
        </p>
      </div>
    </div>
  )
}

function DirectionBadge({ direction }: { direction: 'over' | 'under' | 'toss-up' }) {
  const styles = {
    over: 'bg-emerald-500/10 text-emerald-400',
    under: 'bg-red-500/10 text-red-400',
    'toss-up': 'bg-muted text-muted-foreground',
  }

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[direction]}`}>
      {direction.toUpperCase()}
    </span>
  )
}

function SignalBadge({ signal }: { signal: 'over' | 'under' | 'neutral' }) {
  switch (signal) {
    case 'over':
      return (
        <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
          <ArrowUp className="h-3 w-3" />
          Over
        </span>
      )
    case 'under':
      return (
        <span className="flex items-center gap-0.5 text-red-400 font-semibold">
          <ArrowDown className="h-3 w-3" />
          Under
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-0.5 text-muted-foreground">
          <Minus className="h-3 w-3" />
          Neutral
        </span>
      )
  }
}
