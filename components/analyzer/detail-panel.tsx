"use client"

import { useEffect, useState } from "react"
import { X, Loader2, Share2, Bookmark } from "lucide-react"
import type { PropCheckResult } from "@/types/check-prop"
import type { PropSummary } from "@/types/analyzer"
import { VerdictCard } from "./verdict-card"
import { HitRatePills } from "./hit-rate-pills"
import { SignalBars } from "./signal-bars"
import { GameLogChart } from "./game-log-chart"
import { MatchupInfo } from "./matchup-info"

interface DetailPanelProps {
  prop: PropSummary
  playerId: string
  sport: string
  /** Currently selected line (from the card) */
  line: number
  onClose: () => void
}

export function DetailPanel({ prop, playerId, sport, line: initialLine, onClose }: DetailPanelProps) {
  const [result, setResult] = useState<PropCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLine, setActiveLine] = useState(initialLine)

  // Fetch full deep analysis when panel opens
  useEffect(() => {
    let cancelled = false

    async function fetchDeepAnalysis() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/check-prop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId, stat: prop.stat, line: initialLine, sport }),
        })

        if (cancelled) return

        if (!res.ok) {
          const data = await res.json()
          setError(data.message || "Failed to load analysis")
          return
        }

        const data = await res.json()

        // Check if this is an error response (like no_game_today)
        if (data.error) {
          setError(data.message || "Analysis unavailable")
          return
        }

        setResult(data)
      } catch {
        if (!cancelled) setError("Failed to load analysis")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDeepAnalysis()
    return () => { cancelled = true }
  }, [playerId, prop.stat, initialLine, sport])

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] bg-background border-l border-border overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{prop.statLabel}</h3>
            <p className="text-xs text-muted-foreground">Line: {activeLine}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <DetailPanelSkeleton />
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : result ? (
            <>
              {/* Verdict */}
              <VerdictCard verdict={result.verdict} stat={prop.statLabel} line={activeLine} />

              {/* Hit Rate Pills */}
              <HitRatePills
                l5={prop.hitRateL5}
                l10={prop.hitRateL10}
                l20={result.gameLog.games.length >= 20
                  ? result.gameLog.games.slice(0, 20).filter(g => (g.stats[prop.stat] ?? 0) > activeLine).length / 20
                  : null
                }
                season={prop.hitRateSeason}
                h2h={prop.hitRateH2H}
              />

              {/* Convergence Signal Bars */}
              <SignalBars factors={result.convergence.factors} />

              {/* Game Log Chart */}
              <GameLogChart
                games={result.gameLog.games}
                stat={prop.stat}
                line={activeLine}
                seasonAverage={result.gameLog.seasonAverage}
                onLineChange={setActiveLine}
              />

              {/* Matchup Context */}
              <MatchupInfo matchup={result.matchup} />

              {/* Narrative Flags */}
              {result.narratives.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Narratives
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.narratives.map((n, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          n.impact === "positive"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : n.impact === "negative"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {n.headline}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Bookmark className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}

function DetailPanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-16 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="flex-1 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-40 rounded-xl bg-muted" />
    </div>
  )
}
