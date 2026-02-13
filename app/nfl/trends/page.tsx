"use client"

import Link from "next/link"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Logo } from "@/components/logo"
import useSWR from "swr"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import type { Trend } from "@/lib/trends-types"

const NFL_CATEGORIES = [
  "Passing", "Rushing", "Receiving", "Touchdowns",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function NFLTrendsPage() {
  const { data, isLoading, error, mutate } = useSWR<{ trends: Trend[]; source: string }>(
    "/api/nfl/trends",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  const trends = data?.trends ?? []
  const isLive = data?.source === "live"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">NFL Trends</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <Link href="/nba" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Matchup
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Trends
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 flex flex-col gap-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">Failed to load trend data</p>
            <p className="text-xs text-muted-foreground">Something went wrong fetching NFL streaks. Try again.</p>
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
            <p className="text-sm text-muted-foreground">Scanning all NFL players for active streaks...</p>
          </div>
        ) : (
          <TrendsDashboard
            trends={trends}
            categories={NFL_CATEGORIES}
            title="NFL Active Streaks"
            subtitle="Players on active hot and cold streaks based on recent game-by-game performance. Identifies patterns like '3 straight games with 300+ pass yards' or '5 straight games with a rushing TD' to spot current form."
            isLive={isLive}
          />
        )}
        <ProUpsellBanner />
      </main>
    </div>
  )
}
