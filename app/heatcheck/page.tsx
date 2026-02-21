"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Loader2, Zap, Trophy, AlertCircle } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useUserTier } from "@/components/user-tier-provider"
import { HeatCheckCard } from "@/components/heatcheck/heatcheck-card"
import { HeatCheckSkeleton } from "@/components/heatcheck/heatcheck-skeleton"
import type { HeatCheckBoardResult } from "@/types/heatcheck"
import type { Sport } from "@/types/shared"

const SPORTS: { key: Sport; label: string }[] = [
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nfl", label: "NFL" },
]

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (res.status === 403) throw new Error("pro_required")
  if (!res.ok) throw new Error("fetch_error")
  return res.json()
})

export default function HeatCheckPage() {
  const router = useRouter()
  const userTier = useUserTier()
  const isPro = userTier === "pro"

  const [sport, setSport] = useState<Sport>("nba")

  const { data, error, isLoading } = useSWR<HeatCheckBoardResult>(
    isPro ? `/api/heatcheck?sport=${sport}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  const handleAnalyze = useCallback(
    (playerId: string, stat: string) => {
      router.push(`/check?player=${playerId}&stat=${stat}`)
    },
    [router],
  )

  return (
    <DashboardShell subtitle="Tonight's Top Picks">
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              The HeatCheck
            </h1>
          </div>

          {data && (
            <p className="text-xs text-muted-foreground">
              {data.gamesScanned} games &middot; {data.playersScanned} players scanned
              &middot; Updated {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Sport tabs */}
        <div className="flex items-center gap-2">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSport(s.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                sport === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Pro gate */}
        {!isPro && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-6 py-16 text-center">
            <Trophy className="h-10 w-10 text-amber-400" />
            <h2 className="text-lg font-bold text-foreground">
              The HeatCheck is a Pro Feature
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Upgrade to Pro to unlock daily top picks powered by our convergence engine.
              We scan every game, project player performance, and surface the highest-edge
              props for tonight&apos;s slate.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Loading */}
        {isPro && isLoading && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning tonight&apos;s slate...
            </div>
            <HeatCheckSkeleton />
          </div>
        )}

        {/* Error */}
        {isPro && error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-muted-foreground">
              {error.message === "pro_required"
                ? "A Pro subscription is required to access The HeatCheck."
                : "Failed to load tonight's picks. Please try again."}
            </p>
          </div>
        )}

        {/* Empty state */}
        {isPro && !isLoading && !error && data && data.picks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
            <Zap className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No games scheduled tonight for {sport.toUpperCase()}.
              Check back when games are on the slate!
            </p>
          </div>
        )}

        {/* Picks grid */}
        {isPro && !isLoading && !error && data && data.picks.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.picks.map((pick) => (
              <HeatCheckCard
                key={`${pick.player.id}-${pick.stat}`}
                pick={pick}
                onAnalyze={() => handleAnalyze(pick.player.id, pick.stat)}
              />
            ))}
          </div>
        )}
      </main>
    </DashboardShell>
  )
}
