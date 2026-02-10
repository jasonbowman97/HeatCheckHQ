"use client"

import Link from "next/link"
import useSWR from "swr"
import { BarChart3, Loader2 } from "lucide-react"
import { RedzoneTable } from "@/components/nfl/redzone-table"
import type { NFLScheduleGame } from "@/lib/nfl-api"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function RedzoneClient() {
  const { data, isLoading } = useSWR<{ games: NFLScheduleGame[] }>("/api/nfl/schedule", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const liveGames = data?.games ?? []
  const isLive = liveGames.length > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  HeatCheck HQ
                </h1>
                <p className="text-xs text-muted-foreground">NFL Redzone Stats</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Matchup
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Redzone
            </span>
            <Link href="/nfl/trends" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Trends
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground text-balance">NFL Redzone Stats</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Passing, rushing, and receiving efficiency inside the red zone. 2025-26 Regular Season.
          </p>
        </div>

        {/* Live games context strip */}
        {isLive && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-card border border-border">
            <span className="text-xs text-muted-foreground mr-1">This week:</span>
            {liveGames.slice(0, 8).map((g) => (
              <div key={g.id} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs">
                <span className="font-semibold text-foreground">{g.awayTeam.abbreviation}</span>
                <span className="text-muted-foreground">@</span>
                <span className="font-semibold text-foreground">{g.homeTeam.abbreviation}</span>
              </div>
            ))}
          </div>
        )}

        <RedzoneTable />
      </main>
    </div>
  )
}
