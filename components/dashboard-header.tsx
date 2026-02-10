"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HeatCheckLogo } from "@/components/ui/sport-icons"

interface DashboardHeaderProps {
  showBack?: boolean
  onBack?: () => void
  playerName?: string
}

export function DashboardHeader({ showBack, onBack, playerName }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <HeatCheckLogo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {playerName ? playerName : "HeatCheck HQ"}
              </h1>
              {!playerName && (
                <p className="text-xs text-muted-foreground">Player Hitting Stats</p>
              )}
              {playerName && (
                <p className="text-xs text-muted-foreground">Game Log & At-Bat Analysis</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
            Hitting Stats
          </span>
          <Link
            href="/mlb/nrfi"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            NRFI
          </Link>
          <Link
            href="/mlb/pitching-stats"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Pitching Stats
          </Link>
          <Link
            href="/mlb/weather"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Weather
          </Link>
          <Link
            href="/mlb/trends"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
          >
            Trends
          </Link>
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />
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
            NFL
          </Link>
        </div>
      </div>
    </header>
  )
}
