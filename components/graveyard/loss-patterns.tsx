// ============================================================
// components/graveyard/loss-patterns.tsx — Aggregate analytics
// ============================================================
// Shows common loss causes, grade distribution, and patterns.

"use client"

import { BarChart3 } from "lucide-react"
import type { LossPatterns } from "@/lib/graveyard-service"

interface LossPatternsViewProps {
  patterns: LossPatterns
}

export function LossPatternsView({ patterns }: LossPatternsViewProps) {
  if (patterns.totalEntries === 0) {
    return null
  }

  const gradeColors: Record<string, string> = {
    A: 'bg-emerald-500',
    B: 'bg-blue-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    F: 'bg-red-500',
  }

  const causeLabels: Record<string, string> = {
    blowout: 'Blowout',
    injury_during_game: 'In-Game Injury',
    foul_trouble: 'Foul Trouble',
    minute_restriction: 'Low Minutes',
    lineup_change: 'Lineup Change',
    game_flow: 'Game Flow / B2B',
    regression: 'Variance / Narrow Miss',
    line_was_sharp: 'Sharp Line',
    bad_matchup_read: 'Low Convergence',
    other: 'Other',
  }

  const totalGrades = Object.values(patterns.gradeDistribution).reduce((s, v) => s + v, 0)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          Loss Patterns
          <span className="ml-auto text-muted-foreground font-normal">{patterns.totalEntries} entries</span>
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="Avg Margin" value={patterns.avgMargin.toFixed(1)} />
          <StatBox label="Avg Convergence" value={`${patterns.avgConvergence}/7`} />
          <StatBox label="Avg Unluck" value={`${patterns.avgUnluckScore}%`} />
          <StatBox label="Would Repeat" value={`${patterns.wouldBetAgainRate}%`} />
        </div>

        {/* Grade distribution bar */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Process Grade Distribution
          </p>
          <div className="flex h-4 rounded-full overflow-hidden">
            {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => {
              const count = patterns.gradeDistribution[grade]
              if (count === 0) return null
              const width = (count / totalGrades) * 100
              return (
                <div
                  key={grade}
                  className={`${gradeColors[grade]} flex items-center justify-center`}
                  style={{ width: `${width}%` }}
                  title={`${grade}: ${count}`}
                >
                  {width >= 15 && (
                    <span className="text-[9px] font-bold text-white">{grade}</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
            {(['A', 'B', 'C', 'D', 'F'] as const).map(grade => (
              <span key={grade}>{grade}: {patterns.gradeDistribution[grade]}</span>
            ))}
          </div>
        </div>

        {/* Top causes */}
        {patterns.topCauses.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Most Common Causes
            </p>
            <div className="space-y-1.5">
              {patterns.topCauses.map((cause, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${cause.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground font-medium w-24 text-right truncate">
                    {causeLabels[cause.type] ?? cause.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">
                    {cause.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2 text-center">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}
