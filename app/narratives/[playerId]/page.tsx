// ============================================================
// app/narratives/[playerId]/page.tsx — Player narrative history
// ============================================================
// Shows chronological narrative events and performance by type.

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { TimelineView } from "@/components/narrative/timeline-view"
import { NarrativePerformanceView } from "@/components/narrative/narrative-performance"
import { DashboardShell } from "@/components/dashboard-shell"
import { ArrowLeft, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"
import type { NarrativeTimelineEntry } from "@/types/innovation-playbook"
import type { NarrativePerformance } from "@/lib/narrative-timeline-service"

export default function NarrativeTimelinePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params)
  const [timeline, setTimeline] = useState<NarrativeTimelineEntry[]>([])
  const [performance, setPerformance] = useState<NarrativePerformance[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/narratives/${playerId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTimeline(data.timeline ?? [])
      setPerformance(data.performance ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => { loadData() }, [loadData])

  return (
    <ProtectedPage pathname="/check">
      <DashboardShell subtitle="Narrative timeline">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {/* Back */}
        <Link
          href="/check"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Check
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Narrative Timeline
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical narrative events and their impact on performance
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Timeline */}
            <TimelineView entries={timeline} />

            {/* Performance sidebar */}
            <div className="space-y-4">
              <NarrativePerformanceView data={performance} />

              {/* Summary stats */}
              {timeline.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground mb-3">Summary</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Events</span>
                      <span className="font-medium text-foreground">{timeline.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">With Results</span>
                      <span className="font-medium text-foreground">
                        {timeline.filter(e => e.actualPerformance).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unique Types</span>
                      <span className="font-medium text-foreground">{performance.length}</span>
                    </div>
                    {(() => {
                      const withResults = timeline.filter(e => e.actualPerformance)
                      const hits = withResults.filter(e => e.actualPerformance?.result === 'hit').length
                      const rate = withResults.length > 0 ? Math.round((hits / withResults.length) * 100) : 0
                      return (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Overall Hit Rate</span>
                          <span className={`font-bold ${rate >= 55 ? 'text-emerald-400' : rate >= 45 ? 'text-foreground' : 'text-red-400'}`}>
                            {withResults.length > 0 ? `${rate}%` : '—'}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </DashboardShell>
    </ProtectedPage>
  )
}
