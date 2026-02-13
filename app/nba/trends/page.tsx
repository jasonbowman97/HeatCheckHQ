"use client"

import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import useSWR from "swr"
import { DashboardShell } from "@/components/dashboard-shell"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import type { Trend } from "@/lib/trends-types"

const NBA_CATEGORIES = [
  "Scoring", "Threes", "Rebounds", "Assists", "Combos", "Defense", "Turnovers", "Consistency",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NBATrendsPage() {
  const { data, isLoading, error, mutate } = useSWR<{ trends: Trend[]; source: string }>(
    "/api/nba/trends",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  const trends = data?.trends ?? []
  const isLive = data?.source === "live"

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-6 py-8 flex flex-col gap-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">Failed to load trend data</p>
            <p className="text-xs text-muted-foreground">Something went wrong fetching NBA streaks. Try again.</p>
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
            <p className="text-sm text-muted-foreground">Scanning all NBA players for active streaks...</p>
          </div>
        ) : (
          <TrendsDashboard
            trends={trends}
            categories={NBA_CATEGORIES}
            title="NBA Active Streaks"
            subtitle="Active hot and cold streaks plus threshold consistency trends. Spot players consistently going over or under key stat lines — points, rebounds, assists, threes, and PRA combos."
            isLive={isLive}
          />
        )}
        <ProUpsellBanner />
      </main>
    </DashboardShell>
  )
}
