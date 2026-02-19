// ============================================================
// app/edge-lab/community/page.tsx — Community Strategy Library
// ============================================================
// Browse, sort, and filter community-published strategies.

"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { DashboardShell } from "@/components/dashboard-shell"
import { StrategyCard } from "@/components/edge-lab/strategy-card"
import { Library, Loader2, Search, TrendingUp, Clock, Star, Users, Flame } from "lucide-react"
import type { PublicStrategy } from "@/types/community"

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'rising', label: 'Rising', icon: TrendingUp },
  { value: 'top_roi', label: 'Top ROI', icon: Star },
  { value: 'most_followed', label: 'Popular', icon: Users },
  { value: 'newest', label: 'New', icon: Clock },
] as const

const SPORTS = ['all', 'nba', 'nfl', 'mlb', 'nhl', 'ncaab', 'ncaaf'] as const

export default function CommunityLibraryPage() {
  const [strategies, setStrategies] = useState<PublicStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<string>('hot')
  const [sport, setSport] = useState<string>('all')
  const [search, setSearch] = useState('')

  const loadStrategies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (sport !== 'all') params.set('sport', sport)
      const res = await fetch(`/api/strategies?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setStrategies(data.strategies ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [sort, sport])

  useEffect(() => { loadStrategies() }, [loadStrategies])

  const handleVote = useCallback(async (strategyId: string, vote: 1 | -1) => {
    try {
      await fetch(`/api/strategies/${strategyId}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', vote }),
      })
      await loadStrategies()
    } catch {
      // silent
    }
  }, [loadStrategies])

  // Client-side search filter
  const filtered = search.trim()
    ? strategies.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : strategies

  return (
    <ProtectedPage pathname="/edge-lab">
      <DashboardShell subtitle="Community strategy library">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            Community Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse strategies published by the community. Follow, fork, or get inspired.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search strategies by name, description, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SPORTS.map(s => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium uppercase ${
                sport === s ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All Sports' : s}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  sort === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-3 w-3" />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Library className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No strategies found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? 'Try a different search term.' : 'Be the first to publish a strategy!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onVote={(vote) => handleVote(strategy.id, vote)}
              />
            ))}
          </div>
        )}
      </div>
      </DashboardShell>
    </ProtectedPage>
  )
}
