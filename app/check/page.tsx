"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PropInput } from "@/components/check/prop-input"
import { VerdictBanner } from "@/components/check/verdict-banner"
import { HeatRingSVG } from "@/components/check/heat-ring-svg"
import { ConvergenceBreakdown } from "@/components/check/convergence-breakdown"
import { PropSpectrumChart } from "@/components/check/prop-spectrum-chart"
import { NarrativeFlags } from "@/components/check/narrative-flags"
import { MatchupContext } from "@/components/check/matchup-context"
import { GameLogTimeline } from "@/components/check/game-log-timeline"
import { SimilarSituations } from "@/components/check/similar-situations"
import { ActionBar } from "@/components/check/action-bar"
import { ProGate } from "@/components/pro-gate"
import { DashboardShell } from "@/components/dashboard-shell"
import { useUserTier } from "@/components/user-tier-provider"
import type { PropCheckResult, PropCheckError } from "@/types/check-prop"

export default function CheckMyPropPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = useUserTier()
  const isPro = tier === "pro"

  const [result, setResult] = useState<PropCheckResult | null>(null)
  const [error, setError] = useState<PropCheckError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(async (data: { playerId: string; stat: string; line: number }) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    // Update URL state for deep linking
    const params = new URLSearchParams()
    params.set("player", data.playerId)
    params.set("stat", data.stat)
    params.set("line", data.line.toString())
    router.replace(`/check?${params.toString()}`, { scroll: false })

    try {
      const res = await fetch("/api/check-prop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (json.error) {
        setError(json as PropCheckError)
      } else {
        setResult(json as PropCheckResult)
      }
    } catch {
      setError({ error: "server_error", message: "Failed to check prop. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleRecheck = useCallback(() => {
    setResult(null)
    setError(null)
    router.replace("/check", { scroll: false })
  }, [router])

  return (
    <DashboardShell subtitle="Validate any prop bet">
    <div className="pb-20 sm:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check My Prop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            7-factor convergence analysis for any player prop
          </p>
        </div>

        {/* Input */}
        <PropInput onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Error State */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <p className="text-sm font-medium text-red-400">{error.message}</p>
            {error.canShowHistorical && (
              <p className="text-xs text-muted-foreground mt-2">
                Historical data is still available for this player.
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-6 space-y-4">
            <div className="h-24 rounded-xl bg-muted animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="mt-6 space-y-6">
            {/* 1. Verdict Banner (always visible) */}
            <VerdictBanner
              verdict={result.verdict}
              statLabel={result.statLabel}
              line={result.line}
              playerName={result.player.name}
            />

            {/* 2. Heat Ring + Convergence (two-column on desktop) */}
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-4">
                <HeatRingSVG
                  games={result.heatRing.games}
                  size="lg"
                  hitRate={result.heatRing.aggregates.hitRate}
                  hitCount={result.heatRing.aggregates.hitCount}
                  totalGames={result.heatRing.aggregates.totalGames}
                  streak={result.heatRing.aggregates.streak}
                />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Avg margin: <span className="font-mono text-foreground">
                      {result.heatRing.aggregates.avgMargin > 0 ? '+' : ''}
                      {result.heatRing.aggregates.avgMargin.toFixed(1)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg value: <span className="font-mono text-foreground">
                      {result.heatRing.aggregates.avgValue.toFixed(1)}
                    </span>
                  </p>
                  {!isPro && (
                    <p className="text-[10px] text-primary mt-1">
                      Showing last 10 games &middot; Pro shows 20
                    </p>
                  )}
                </div>
              </div>

              <ConvergenceBreakdown
                factors={result.convergence.factors}
                overCount={result.convergence.overCount}
                underCount={result.convergence.underCount}
                neutralCount={result.convergence.neutralCount}
              />
            </div>

            {/* 3. Narrative Flags (always visible) */}
            <NarrativeFlags narratives={result.narratives} />

            {/* 4. Prop Spectrum (always visible, but overlay toggles are Pro) */}
            <PropSpectrumChart
              spectrum={result.spectrum}
              line={result.line}
              statLabel={result.statLabel}
            />

            {/* 4b. Spectrum Split Overlays (Pro only) */}
            <ProGate
              feature="spectrum_overlays"
              headline="Split Overlays"
              teaser="Compare home vs away and top vs bottom defense distributions to find hidden edges"
            >
              <SpectrumOverlays spectrum={result.spectrum} statLabel={result.statLabel} />
            </ProGate>

            {/* 5. Matchup Context (always visible) */}
            <MatchupContext
              matchup={result.matchup}
              playerName={result.player.name}
            />

            {/* 6. Game Log Timeline (always visible) */}
            <GameLogTimeline
              games={result.gameLog.games}
              movingAverage={result.gameLog.movingAverage}
              seasonAverage={result.gameLog.seasonAverage}
              stat={result.stat}
              statLabel={result.statLabel}
              line={result.line}
            />

            {/* 7. Similar Situations (Pro only — gated) */}
            {result.similarSituations ? (
              <SimilarSituations
                data={result.similarSituations}
                statLabel={result.statLabel}
                line={result.line}
              />
            ) : (
              <ProGate
                feature="similar_situations"
                headline="Similar Situations"
                teaser="See how this player has performed in comparable matchup conditions historically"
              >
                <SimilarSituationsPlaceholder />
              </ProGate>
            )}

            {/* 8. Action Bar */}
            <ActionBar result={result} onRecheck={handleRecheck} />
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  )
}

// ── Spectrum overlays for Pro users ──

function SpectrumOverlays({ spectrum, statLabel }: {
  spectrum: PropCheckResult["spectrum"]
  statLabel: string
}) {
  const overlays = [
    { label: "Home", data: spectrum.overlays.home, color: "text-emerald-400" },
    { label: "Away", data: spectrum.overlays.away, color: "text-red-400" },
    { label: "vs Top Defense", data: spectrum.overlays.vsTopDefense, color: "text-blue-400" },
    { label: "vs Bottom Defense", data: spectrum.overlays.vsBottomDefense, color: "text-yellow-400" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Split Comparisons
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Pro
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {overlays.map(({ label, data, color }) => (
          <div key={label} className="text-center">
            <p className={`text-lg font-bold font-mono ${color}`}>
              {data.games > 0 ? data.mean.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{data.games} games</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Placeholder for similar situations (shown behind ProGate) ──

function SimilarSituationsPlaceholder() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Similar Situations
      </h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-lg font-bold font-mono text-foreground">12</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Games</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-foreground">26.3</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Value</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-emerald-400">72%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hit Rate</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-foreground">+3.1</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Margin</p>
        </div>
      </div>
    </div>
  )
}
