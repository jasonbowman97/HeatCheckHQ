"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Search, TrendingUp, Zap, Shield } from "lucide-react"
import { PlayerSearch } from "@/components/analyzer/player-search"
import { RecentPerformance } from "@/components/analyzer/recent-performance"
import { DashboardShell } from "@/components/dashboard-shell"
import { analytics } from "@/lib/analytics"
import type { PlayerAnalysis } from "@/types/analyzer"
import type { PlayerSearchResult } from "@/types/shared"

export default function PropAnalyzerPage() {
  return (
    <Suspense fallback={
      <DashboardShell subtitle="Analyze any player's props">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    }>
      <PropAnalyzerContent />
    </Suspense>
  )
}

function PropAnalyzerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track the current player ID for deep linking
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

  const fetchAnalysis = useCallback(async (playerId: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const res = await fetch("/api/analyze-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.message || data.error)
        setAnalysis(null)
        return
      }

      const result = data as PlayerAnalysis
      setAnalysis(result)

      // Track analytics
      analytics.propAnalyzerView(result.player.name, result.sport, result.props.length)

      // Update URL for deep linking
      const params = new URLSearchParams()
      params.set("player", playerId)
      router.replace(`/check?${params.toString()}`, { scroll: false })
    } catch {
      setError("Failed to analyze player. Please try again.")
      setAnalysis(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [router])

  // ── Deep linking: auto-load player from URL params on mount ──
  useEffect(() => {
    const playerId = searchParams.get("player")
    if (playerId && !analysis && !isAnalyzing) {
      setCurrentPlayerId(playerId)
      fetchAnalysis(playerId)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePlayerSelect = useCallback((player: PlayerSearchResult) => {
    setCurrentPlayerId(player.id)
    analytics.propAnalyzerSearch(player.name, player.sport)
    fetchAnalysis(player.id)
  }, [fetchAnalysis])

  const handleStatSelect = useCallback((stat: string) => {
    if (!analysis) return

    // Track stat selection
    analytics.propAnalyzerCardClick(stat, analysis.sport)

    // Update URL with stat for deep linking
    const params = new URLSearchParams()
    if (currentPlayerId) params.set("player", currentPlayerId)
    params.set("stat", stat)
    router.replace(`/check?${params.toString()}`, { scroll: false })
  }, [analysis, currentPlayerId, router])

  return (
    <DashboardShell subtitle="Analyze any player's props">
      <div className="pb-20 sm:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Prop Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search any player to analyze all their props with 9-factor convergence
            </p>
          </div>

          {/* Player Search */}
          <div className="relative max-w-xl">
            <PlayerSearch onSelect={handlePlayerSelect} isAnalyzing={isAnalyzing} />
          </div>

          {/* ── STATE: Empty (no analysis, no loading, no error) ── */}
          {!analysis && !isAnalyzing && !error && (
            <div className="mt-8">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <div className="text-center max-w-lg mx-auto">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Search any player to get started
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    We&apos;ll analyze every available prop with pre-set common lines, hit rates,
                    trends, and convergence signals — all at a glance.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Every Prop</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        All stats analyzed with smart default lines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">9-Factor Score</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Convergence analysis for each stat
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Full Analysis</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Game log, hit rates, and convergence — all in one view
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STATE: Error ── */}
          {error && !isAnalyzing && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
              <p className="text-sm font-medium text-red-400">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  if (currentPlayerId) fetchAnalysis(currentPlayerId)
                }}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── STATE: Loading ── */}
          {isAnalyzing && (
            <div className="mt-6">
              <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                {/* Player header skeleton */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-40 rounded bg-muted" />
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-48 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
                <div className="border-t border-border" />
                {/* Chart area skeleton */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-6 w-32 rounded bg-muted" />
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-7 w-16 rounded-full bg-muted" />
                    ))}
                  </div>
                  <div className="h-64 rounded-lg bg-muted" />
                  <div className="flex gap-3">
                    <div className="flex-1 h-24 rounded-xl bg-muted" />
                    <div className="w-56 h-24 rounded-xl bg-muted" />
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 w-14 rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STATE: Results ── */}
          {analysis && !isAnalyzing && (
            <div className="mt-6">
              <RecentPerformance
                player={analysis.player}
                nextGame={analysis.nextGame}
                props={analysis.props}
                sport={analysis.sport}
                seasonAverages={analysis.seasonAverages}
                gamesPlayed={analysis.gamesPlayed}
                onSelectProp={handleStatSelect}
                matchupContext={analysis.matchupContext ? {
                  defRank: analysis.matchupContext.opponentDefRank,
                  isHome: analysis.matchupContext.isHome,
                  restDays: analysis.matchupContext.restDays,
                  isB2B: analysis.matchupContext.isB2B,
                } : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
