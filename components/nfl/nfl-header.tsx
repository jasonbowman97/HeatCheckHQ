"use client"

import { BarChart3 } from "lucide-react"
import Link from "next/link"

export function NFLHeader() {
  return (
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
              <p className="text-xs text-muted-foreground">NFL Matchup Center</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/mlb/hitting-stats"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            MLB
          </Link>
          <Link
            href="/nba/first-basket"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            NBA
          </Link>
          <Link
            href="/nfl/matchup"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Matchup
          </Link>
          <Link
            href="/nfl/defense-vs-position"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Def vs Pos
          </Link>
          <Link
            href="/nfl/trends"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Trends
          </Link>
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            2025-26 Season
          </span>
        </div>
      </div>
    </header>
  )
}
