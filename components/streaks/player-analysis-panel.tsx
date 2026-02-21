"use client"

import { useEffect, useState, useCallback } from "react"
import { X, Loader2, ExternalLink } from "lucide-react"
import { RecentPerformance } from "@/components/analyzer/recent-performance"
import type { PlayerAnalysis } from "@/types/analyzer"
import type { SportKey } from "@/lib/streak-types"

interface PlayerAnalysisPanelProps {
  playerId: string
  sport: SportKey
  onClose: () => void
}

export function PlayerAnalysisPanel({ playerId, sport, onClose }: PlayerAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalysis() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/analyze-player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        })

        if (cancelled) return

        const data = await res.json()

        if (data.error) {
          setError(data.message || data.error)
          return
        }

        setAnalysis(data as PlayerAnalysis)
      } catch {
        if (!cancelled) setError("Failed to load player analysis.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAnalysis()
    return () => { cancelled = true }
  }, [playerId])

  const handleSelectProp = useCallback(() => {
    // No-op for inline panel — prop drill-down opens DetailPanel
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[680px] bg-background border-l border-border overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {loading ? "Loading player..." : analysis?.player.name ?? "Player Analysis"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {loading ? "Fetching prop analysis" : analysis ? `${analysis.props.length} props analyzed` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <a
                href={`/check?player=${playerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Open full page"
              >
                <ExternalLink className="h-3 w-3" />
                Full Page
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <AnalysisPanelSkeleton />
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Close
              </button>
            </div>
          ) : analysis ? (
            <RecentPerformance
              player={analysis.player}
              nextGame={analysis.nextGame}
              props={analysis.props}
              sport={analysis.sport}
              seasonAverages={analysis.seasonAverages}
              gamesPlayed={analysis.gamesPlayed}
              onSelectProp={handleSelectProp}
              matchupContext={analysis.matchupContext ? {
                defRank: analysis.matchupContext.opponentDefRank,
                isHome: analysis.matchupContext.isHome,
                restDays: analysis.matchupContext.restDays,
                isB2B: analysis.matchupContext.isB2B,
              } : undefined}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}

function AnalysisPanelSkeleton() {
  return (
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
      </div>
    </div>
  )
}
