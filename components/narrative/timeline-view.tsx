// ============================================================
// components/narrative/timeline-view.tsx — Chronological narrative entries
// ============================================================
// Vertical timeline showing narrative events for a player
// with date markers, type badges, and performance results.

"use client"

import { narrativeColor, narrativeLabel } from "@/lib/narrative-timeline-service"
import type { NarrativeTimelineEntry } from "@/types/innovation-playbook"

interface TimelineViewProps {
  entries: NarrativeTimelineEntry[]
}

export function TimelineView({ entries }: TimelineViewProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No narrative events found for this player.</p>
      </div>
    )
  }

  // Group by month
  const grouped = new Map<string, NarrativeTimelineEntry[]>()
  for (const entry of entries) {
    const month = entry.date.slice(0, 7) // YYYY-MM
    const arr = grouped.get(month) ?? []
    arr.push(entry)
    grouped.set(month, arr)
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped).map(([month, monthEntries]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
            {formatMonth(month)}
          </p>
          <div className="space-y-2">
            {monthEntries.map(entry => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineEntry({ entry }: { entry: NarrativeTimelineEntry }) {
  const colors = narrativeColor(entry.narrativeType)
  const label = narrativeLabel(entry.narrativeType)

  return (
    <div className="flex gap-3 relative">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
        <div className={`w-2 h-2 rounded-full ${colors.bg} ring-2 ring-background`} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="rounded-lg border border-border bg-card p-3 flex-1 mb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {label}
            </span>
            <p className="text-sm font-medium text-foreground mt-1">{entry.headline}</p>
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDate(entry.date)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1">{entry.detail}</p>

        {/* Performance result */}
        {entry.actualPerformance && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              entry.actualPerformance.result === 'hit'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}>
              {entry.actualPerformance.result.toUpperCase()}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {entry.actualPerformance.stat}: {entry.actualPerformance.value}
              (line {entry.actualPerformance.line})
            </span>
          </div>
        )}

        {/* Impact indicator */}
        <div className="mt-1.5">
          <span className={`text-[9px] ${
            entry.impact === 'positive' ? 'text-emerald-400' :
            entry.impact === 'negative' ? 'text-red-400' :
            'text-muted-foreground/60'
          }`}>
            {entry.impact === 'positive' ? '+ Positive impact' :
             entry.impact === 'negative' ? '- Negative impact' :
             '~ Neutral impact'}
          </span>
        </div>
      </div>
    </div>
  )
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(m) - 1]} ${y}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
