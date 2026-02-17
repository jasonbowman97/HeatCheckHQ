"use client"

import { Logo } from "@/components/logo"
import Link from "next/link"

export function NBAHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                HeatCheck HQ
              </h1>
              <p className="text-xs text-muted-foreground">NBA First Basket</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/mlb"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            MLB
          </Link>
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
            First Basket
          </span>
          <Link
            href="/nba/head-to-head"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            H2H
          </Link>
          <Link
            href="/nba/defense-vs-position"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Def vs Pos
          </Link>
          <Link
            href="/nba/streaks"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Streaks
          </Link>
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />
          <Link
            href="/nfl"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            NFL
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
