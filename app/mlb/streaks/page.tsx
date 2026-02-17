"use client"

import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import useSWR from "swr"
import { DashboardShell } from "@/components/dashboard-shell"
import { StreaksDashboard } from "@/components/streaks/streaks-dashboard"
import type { EnrichedPlayer } from "@/lib/streak-types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MLBStreaksPage() {
  const { data, isLoading, error, mutate } = useSWR<{
    players: EnrichedPlayer[]
    updatedAt: string
  }>("/api/mlb/streaks", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  })

  const players = data?.players ?? []

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">
              Failed to load streak data
            </p>
            <p className="text-xs text-muted-foreground">
              Something went wrong fetching MLB player stats. Try again.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading player game logs for all MLB batters and pitchers...
            </p>
          </div>
        ) : (
          <StreaksDashboard players={players} sport="mlb" />
        )}
      </main>
    </DashboardShell>
  )
}
