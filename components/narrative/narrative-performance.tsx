// ============================================================
// components/narrative/narrative-performance.tsx — Hit rate by narrative type
// ============================================================
// Bar chart showing how each narrative type performs historically.

"use client"

import { narrativeColor } from "@/lib/narrative-timeline-service"
import type { NarrativePerformance } from "@/lib/narrative-timeline-service"

interface NarrativePerformanceViewProps {
  data: NarrativePerformance[]
}

export function NarrativePerformanceView({ data }: NarrativePerformanceViewProps) {
  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground">Narrative Performance</p>
        <p className="text-[10px] text-muted-foreground">Hit rate by narrative type</p>
      </div>

      <div className="divide-y divide-border">
        {data.map(perf => {
          const colors = narrativeColor(perf.type)
          const hitRatePct = Math.round(perf.hitRate * 100)
          const hasResults = perf.withResults > 0

          return (
            <div key={perf.type} className="px-4 py-2.5 flex items-center gap-3">
              {/* Label */}
              <div className="min-w-0 flex-1">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                  {perf.label}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {perf.totalOccurrences} occurrence{perf.totalOccurrences !== 1 ? 's' : ''}
                  {hasResults && ` · ${perf.hits}W ${perf.misses}L`}
                </p>
              </div>

              {/* Hit rate bar */}
              {hasResults ? (
                <div className="flex items-center gap-2 flex-shrink-0 w-32">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${hitRatePct >= 55 ? 'bg-emerald-400' : hitRatePct >= 45 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${hitRatePct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${
                    hitRatePct >= 55 ? 'text-emerald-400' : hitRatePct >= 45 ? 'text-foreground' : 'text-red-400'
                  }`}>
                    {hitRatePct}%
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">No results yet</span>
              )}

              {/* Impact indicator */}
              <span className={`text-[9px] flex-shrink-0 ${
                perf.avgImpact === 'positive' ? 'text-emerald-400' :
                perf.avgImpact === 'negative' ? 'text-red-400' :
                'text-muted-foreground/60'
              }`}>
                {perf.avgImpact === 'positive' ? '+' : perf.avgImpact === 'negative' ? '-' : '~'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
