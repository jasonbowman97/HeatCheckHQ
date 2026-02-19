// ============================================================
// app/convergence-dashboard/page.tsx — Cross-sport convergence overview
// ============================================================
// Shows top convergence props across all sports with filtering.

"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { PropGrid } from "@/components/convergence-dashboard/prop-grid"
import { SportTabs } from "@/components/convergence-dashboard/sport-tabs"
import { DashboardShell } from "@/components/dashboard-shell"
import { Loader2, Gauge } from "lucide-react"
import type { ConvergenceHighlight } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

export default function ConvergenceDashboardPage() {
  const [allProps, setAllProps] = useState<(ConvergenceHighlight & { sport: Sport })[]>([])
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ minConvergence: '4', limit: '100' })
      if (selectedSport !== 'all') params.set('sport', selectedSport)

      const res = await fetch(`/api/convergence-dashboard?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAllProps(data.props ?? [])
      setSportCounts(data.sportCounts ?? {})
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedSport])

  useEffect(() => { loadData() }, [loadData])

  // Summary stats
  const avg = allProps.length > 0
    ? (allProps.reduce((sum, p) => sum + p.convergenceScore, 0) / allProps.length).toFixed(1)
    : '—'
  const topCount = allProps.filter(p => p.convergenceScore >= 6).length

  return (
    <ProtectedPage pathname="/check">
      <DashboardShell subtitle="Cross-sport signal overview">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Gauge className="h-6 w-6 text-primary" />
              Convergence Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Today&apos;s highest convergence props across all sports.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Total Props</p>
            <p className="text-xl font-bold text-foreground">{allProps.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Avg Convergence</p>
            <p className="text-xl font-bold text-primary">{avg}/7</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">6+ Score</p>
            <p className="text-xl font-bold text-emerald-400">{topCount}</p>
          </div>
        </div>

        {/* Sport tabs */}
        <SportTabs
          selectedSport={selectedSport}
          sportCounts={sportCounts}
          onSelect={setSelectedSport}
        />

        {/* Prop grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PropGrid props={allProps} />
        )}
      </div>
      </DashboardShell>
    </ProtectedPage>
  )
}
