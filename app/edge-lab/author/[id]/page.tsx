// ============================================================
// app/edge-lab/author/[id]/page.tsx — Author profile page
// ============================================================
// Shows author info, reputation, stats, and their strategies.

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StrategyCard } from "@/components/edge-lab/strategy-card"
import { ArrowLeft, Loader2, Trophy, TrendingUp, BarChart3, Star } from "lucide-react"
import Link from "next/link"
import type { PublicStrategy } from "@/types/community"

export default function AuthorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [strategies, setStrategies] = useState<PublicStrategy[]>([])
  const [loading, setLoading] = useState(true)

  const loadAuthor = useCallback(async () => {
    try {
      const res = await fetch(`/api/strategies?authorId=${id}&sort=hot`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setStrategies(data.strategies ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadAuthor() }, [loadAuthor])

  const author = strategies.length > 0 ? strategies[0].author : null

  // Compute aggregate stats
  const totalFollowers = strategies.reduce((sum, s) => sum + s.followerCount, 0)
  const totalForks = strategies.reduce((sum, s) => sum + s.forkCount, 0)
  const withLive = strategies.filter(s => s.livePerformance.games >= 10)
  const avgROI = withLive.length > 0
    ? withLive.reduce((sum, s) => sum + s.livePerformance.roi, 0) / withLive.length
    : 0
  const bestROI = withLive.length > 0
    ? Math.max(...withLive.map(s => s.livePerformance.roi))
    : 0

  return (
    <DashboardShell subtitle="Author profile">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {/* Back */}
        <Link
          href="/edge-lab/community"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Community Library
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !author ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-red-400">Author not found</p>
          </div>
        ) : (
          <>
            {/* Author header */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {author.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.avatarUrl} alt={author.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {author.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">{author.displayName}</h1>
                  <p className="text-xs text-muted-foreground">
                    {strategies.length} strateg{strategies.length !== 1 ? 'ies' : 'y'} published
                    <span className="mx-1.5">&middot;</span>
                    Reputation: {author.reputation}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2">
              <StatChip icon={Trophy} label="Rep" value={String(author.reputation)} />
              <StatChip icon={Star} label="Followers" value={String(totalFollowers)} />
              <StatChip icon={TrendingUp} label="Avg ROI" value={avgROI ? `${(avgROI * 100).toFixed(1)}%` : '—'} positive={avgROI > 0} />
              <StatChip icon={BarChart3} label="Best ROI" value={bestROI ? `${(bestROI * 100).toFixed(1)}%` : '—'} positive={bestROI > 0} />
            </div>

            {/* Strategies */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">
                Published Strategies ({strategies.length})
              </p>
              {strategies.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">No published strategies yet.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {strategies.map(strategy => (
                    <StrategyCard key={strategy.id} strategy={strategy} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}

function StatChip({ icon: Icon, label, value, positive }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-bold ${positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}
