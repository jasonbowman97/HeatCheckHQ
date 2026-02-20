"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Search, TrendingUp, Zap, Shield } from "lucide-react"
import { PlayerSearch } from "@/components/analyzer/player-search"
import { PlayerHeader } from "@/components/analyzer/player-header"
import { PropGrid, PropGridSkeleton } from "@/components/analyzer/prop-grid"
import { DetailPanel } from "@/components/analyzer/detail-panel"
import { DashboardShell } from "@/components/dashboard-shell"
import { useUserTier } from "@/components/user-tier-provider"
import { analytics } from "@/lib/analytics"
import type { PlayerAnalysis, PropSummary } from "@/types/analyzer"
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
  const tier = useUserTier()

  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detail panel state
  const [selectedStat, setSelectedStat] = useState<string | null>(null)
  const [selectedProp, setSelectedProp] = useState<PropSummary | null>(null)

  // Track the current player ID for deep linking + drill-down
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

  // ── Deep linking: auto-load player from URL params on mount ──
  useEffect(() => {
    const playerId = searchParams.get("player")
    const stat = searchParams.get("stat")
    if (playerId && !analysis && !isAnalyzing) {
      // Auto-fetch the player from URL
      setCurrentPlayerId(playerId)
      fetchAnalysis(playerId)
        .then(() => {
          // If a stat was specified in the URL, auto-open the drill-down
          if (stat) {
            setSelectedStat(stat)
          }
        })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When analysis loads and selectedStat is set (from deep link), find the prop
  useEffect(() => {
    if (analysis && selectedStat) {
      const prop = analysis.props.find(p => p.stat === selectedStat)
      if (prop) {
        setSelectedProp(prop)
      }
    }
  }, [analysis, selectedStat])

  const fetchAnalysis = useCallback(async (playerId: string) => {
    setIsAnalyzing(true)
    setError(null)
    setSelectedStat(null)
    setSelectedProp(null)

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

  const handlePlayerSelect = useCallback((player: PlayerSearchResult) => {
    setCurrentPlayerId(player.id)
    analytics.propAnalyzerSearch(player.name, player.sport)
    fetchAnalysis(player.id)
  }, [fetchAnalysis])

  const handlePropSelect = useCallback((stat: string) => {
    if (!analysis) return
    const prop = analysis.props.find(p => p.stat === stat)
    if (!prop) return

    setSelectedStat(stat)
    setSelectedProp(prop)

    // Track drill-down
    analytics.propAnalyzerCardClick(stat, analysis.sport)

    // Update URL with stat for deep linking
    const params = new URLSearchParams()
    if (currentPlayerId) params.set("player", currentPlayerId)
    params.set("stat", stat)
    params.set("line", prop.line.toString())
    router.replace(`/check?${params.toString()}`, { scroll: false })
  }, [analysis, currentPlayerId, router])

  const handleClosePanel = useCallback(() => {
    setSelectedStat(null)
    setSelectedProp(null)

    // Restore URL to just player
    if (currentPlayerId) {
      const params = new URLSearchParams()
      params.set("player", currentPlayerId)
      router.replace(`/check?${params.toString()}`, { scroll: false })
    }
  }, [currentPlayerId, router])

  return (
    <DashboardShell subtitle="Analyze any player's props">
      <div className="pb-20 sm:pb-0">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Prop Analyzer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search any player to analyze all their props with 7-factor convergence
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
                    We'll analyze every available prop with pre-set common lines, hit rates,
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
                      <p className="text-xs font-semibold text-foreground">7-Factor Score</p>
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
                      <p className="text-xs font-semibold text-foreground">Deep Drill-Down</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tap any prop for full matchup context
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
            <div className="mt-6 space-y-4">
              {/* Player header skeleton */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 animate-pulse">
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

              {/* Prop grid skeleton */}
              <PropGridSkeleton />
            </div>
          )}

          {/* ── STATE: Results ── */}
          {analysis && !isAnalyzing && (
            <div className="mt-6 space-y-4">
              {/* Player Header */}
              <PlayerHeader
                player={analysis.player}
                nextGame={analysis.nextGame}
                seasonAverages={analysis.seasonAverages}
                gamesPlayed={analysis.gamesPlayed}
              />

              {/* Prop Card Grid */}
              <PropGrid
                props={analysis.props}
                sport={analysis.sport}
                selectedStat={selectedStat}
                onSelectProp={handlePropSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Drill-Down Detail Panel ── */}
      {selectedProp && currentPlayerId && analysis && (
        <DetailPanel
          prop={selectedProp}
          playerId={currentPlayerId}
          sport={analysis.sport}
          line={selectedProp.line}
          onClose={handleClosePanel}
        />
      )}
    </DashboardShell>
  )
}
