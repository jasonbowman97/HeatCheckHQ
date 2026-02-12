"use client"

import Link from "next/link"
import { BarChart3, Loader2 } from "lucide-react"
import useSWR from "swr"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import type { Trend } from "@/lib/trends-types"

const MLB_CATEGORIES = [
  "Hitting", "Multi-Hit", "Power", "RBI", "Runs",
  "On Base", "Stolen Bases", "Pitching", "Strikeouts",
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MLBTrendsPage() {
  const { data, isLoading } = useSWR<{ trends: Trend[]; source: string; date: string }>(
    "/api/mlb/trends",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  const trends = data?.trends ?? []
  const isLive = data?.source === "live"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">MLB Trends</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb/hot-hitters" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hot Hitters
            </Link>
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitter vs Pitcher
            </Link>
            <Link href="/mlb/pitching-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Pitching Stats
            </Link>
            <Link href="/mlb/nrfi" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NRFI
            </Link>
            <Link href="/mlb/weather" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Weather
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Trends
            </span>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Scanning all MLB players for active streaks...</p>
          </div>
        ) : (
          <TrendsDashboard
            trends={trends}
            categories={MLB_CATEGORIES}
            title="MLB Active Streaks"
            subtitle="Every MLB player scanned for active hot and cold streaks. Covers hits, multi-hit, power, RBI, runs, on-base, stolen bases, pitching, and strikeouts."
            isLive={isLive}
          />
        )}
      </main>
    </div>
  )
}
