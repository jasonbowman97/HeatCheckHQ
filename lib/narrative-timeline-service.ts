// ============================================================
// lib/narrative-timeline-service.ts — Narrative Timeline Service
// ============================================================
// Aggregates historical narratives for a player and computes
// performance tracking by narrative type.

import type { NarrativeTimelineEntry } from '@/types/innovation-playbook'
import type { NarrativeFlag } from '@/types/check-prop'

// ---- Performance by Narrative Type ----

export interface NarrativePerformance {
  type: NarrativeFlag['type']
  label: string
  totalOccurrences: number
  withResults: number
  hits: number
  misses: number
  hitRate: number
  avgImpact: string // positive/negative/neutral
}

const NARRATIVE_LABELS: Record<NarrativeFlag['type'], string> = {
  revenge_game: 'Revenge Game',
  milestone: 'Milestone Watch',
  losing_streak: 'Losing Streak',
  winning_streak: 'Winning Streak',
  blowout_bounce: 'Blowout Bounce',
  return_from_injury: 'Return from Injury',
  contract_year: 'Contract Year',
  back_to_back_road: 'Back-to-Back Road',
  rest_mismatch: 'Rest Mismatch',
  weather_extreme: 'Weather Extreme',
  rivalry: 'Rivalry',
  key_teammate_out: 'Key Teammate Out',
}

/** Compute performance stats grouped by narrative type */
export function computeNarrativePerformance(entries: NarrativeTimelineEntry[]): NarrativePerformance[] {
  const grouped = new Map<NarrativeFlag['type'], NarrativeTimelineEntry[]>()

  for (const entry of entries) {
    const arr = grouped.get(entry.narrativeType) ?? []
    arr.push(entry)
    grouped.set(entry.narrativeType, arr)
  }

  const results: NarrativePerformance[] = []

  for (const [type, typeEntries] of grouped) {
    const withResults = typeEntries.filter(e => e.actualPerformance)
    const hits = withResults.filter(e => e.actualPerformance?.result === 'hit').length
    const misses = withResults.filter(e => e.actualPerformance?.result === 'miss').length

    const impacts = typeEntries.map(e => e.impact)
    const positiveCount = impacts.filter(i => i === 'positive').length
    const negativeCount = impacts.filter(i => i === 'negative').length
    const avgImpact = positiveCount > negativeCount ? 'positive' :
                      negativeCount > positiveCount ? 'negative' : 'neutral'

    results.push({
      type,
      label: NARRATIVE_LABELS[type] ?? type,
      totalOccurrences: typeEntries.length,
      withResults: withResults.length,
      hits,
      misses,
      hitRate: withResults.length > 0 ? hits / withResults.length : 0,
      avgImpact,
    })
  }

  return results.sort((a, b) => b.totalOccurrences - a.totalOccurrences)
}

/** Build a narrative timeline sorted by date (newest first) */
export function sortTimeline(entries: NarrativeTimelineEntry[]): NarrativeTimelineEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ---- DB Row Mapper ----

export function mapRowToTimelineEntry(row: Record<string, unknown>): NarrativeTimelineEntry {
  const perf = typeof row.actual_performance_json === 'string'
    ? JSON.parse(row.actual_performance_json)
    : row.actual_performance_json

  return {
    id: row.id as string,
    playerId: (row.player_id as string) ?? '',
    date: (row.date as string) ?? '',
    gameId: (row.game_id as string) ?? '',
    narrativeType: (row.narrative_type as NarrativeFlag['type']) ?? 'revenge_game',
    headline: (row.headline as string) ?? '',
    detail: (row.detail as string) ?? '',
    impact: (row.impact as 'positive' | 'negative' | 'neutral') ?? 'neutral',
    actualPerformance: perf ?? undefined,
  }
}

/** Get narrative type icon/color for UI */
export function narrativeColor(type: NarrativeFlag['type']): { text: string; bg: string } {
  switch (type) {
    case 'revenge_game': return { text: 'text-red-400', bg: 'bg-red-500/15' }
    case 'milestone': return { text: 'text-amber-400', bg: 'bg-amber-500/15' }
    case 'losing_streak': return { text: 'text-red-400', bg: 'bg-red-500/15' }
    case 'winning_streak': return { text: 'text-emerald-400', bg: 'bg-emerald-500/15' }
    case 'blowout_bounce': return { text: 'text-blue-400', bg: 'bg-blue-500/15' }
    case 'return_from_injury': return { text: 'text-amber-400', bg: 'bg-amber-500/15' }
    case 'contract_year': return { text: 'text-primary', bg: 'bg-primary/15' }
    case 'back_to_back_road': return { text: 'text-orange-400', bg: 'bg-orange-500/15' }
    case 'rest_mismatch': return { text: 'text-blue-400', bg: 'bg-blue-500/15' }
    case 'weather_extreme': return { text: 'text-cyan-400', bg: 'bg-cyan-500/15' }
    case 'rivalry': return { text: 'text-red-400', bg: 'bg-red-500/15' }
    case 'key_teammate_out': return { text: 'text-amber-400', bg: 'bg-amber-500/15' }
    default: return { text: 'text-muted-foreground', bg: 'bg-muted' }
  }
}

export function narrativeLabel(type: NarrativeFlag['type']): string {
  return NARRATIVE_LABELS[type] ?? type
}
