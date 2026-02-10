"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react"
import { HeatCheckLogo } from "@/components/ui/sport-icons"
import { Button } from "@/components/ui/button"
import { NrfiTable } from "@/components/mlb/nrfi-table"
import { nrfiPitchers } from "@/lib/nrfi-data"
import type { NrfiPitcher } from "@/lib/nrfi-data"

interface APIGame {
  gamePk: number
  gameDate: string
  status: string
  away: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  home: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  venue: string
  weather: { condition: string; temp: string; wind: string } | null
}

function transformToNrfi(games: APIGame[]): NrfiPitcher[] {
  const rows: NrfiPitcher[] = []
  for (const g of games) {
    const time = new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    if (g.away.probablePitcher) {
      rows.push({
        id: `live-${g.away.probablePitcher.id}`,
        time,
        team: g.away.abbreviation,
        player: g.away.probablePitcher.fullName,
        hand: "R",
        record: "--",
        nrfiPct: 0,
        streak: 0,
        hrsAllowed: 0,
        opponent: g.home.abbreviation,
        opponentRecord: "--",
        opponentNrfiStreak: 0,
        opponentNrfiRank: 0,
      })
    }
    if (g.home.probablePitcher) {
      rows.push({
        id: `live-${g.home.probablePitcher.id}`,
        time,
        team: g.home.abbreviation,
        player: g.home.probablePitcher.fullName,
        hand: "R",
        record: "--",
        nrfiPct: 0,
        streak: 0,
        hrsAllowed: 0,
        opponent: g.away.abbreviation,
        opponentRecord: "--",
        opponentNrfiStreak: 0,
        opponentNrfiRank: 0,
      })
    }
  }
  return rows
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type HandFilter = "All" | "RHP" | "LHP"

export default function NrfiPage() {
  const [handFilter, setHandFilter] = useState<HandFilter>("All")
  const [dateOffset, setDateOffset] = useState(0)

  // Date navigation
  const currentDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + dateOffset)
    return d
  }, [dateOffset])
  const dateParam = currentDate.toISOString().slice(0, 10)
  const dateLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const { data, isLoading } = useSWR<{ games: APIGame[]; date: string }>(`/api/mlb/schedule?date=${dateParam}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const liveNrfi = useMemo(() => {
    const games = data?.games ?? []
    return games.length > 0 ? transformToNrfi(games) : []
  }, [data])
  const isLive = liveNrfi.length > 0

  // Use live probable pitchers when available, static as fallback
  const basePitchers = isLive ? liveNrfi : nrfiPitchers

  // Filter by pitcher hand
  const filteredData = useMemo(() => {
    if (handFilter === "All") return basePitchers
    const hand = handFilter === "RHP" ? "R" : "L"
    return basePitchers.filter((p) => p.hand === hand)
  }, [handFilter, basePitchers])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <HeatCheckLogo className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold tracking-tight">HeatCheck HQ</span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs font-medium text-primary">MLB</span>
          </div>

          <div className="flex items-center gap-3">
            {/* MLB sub-nav */}
            <Link
              href="/mlb/hitting-stats"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              Hitting Stats
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              NRFI
            </span>
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

      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground text-balance">No Run First Inning</h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isLive
              ? `${liveNrfi.length} probable pitchers for today's slate. NRFI stats show season totals.`
              : "Probable pitchers and their NRFI track records for today's slate."}
          </p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Date navigator */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-card">
            <button
              onClick={() => setDateOffset((d) => d - 1)}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground min-w-[100px] text-center">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={() => setDateOffset((d) => d + 1)}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Pitcher hand filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pitcher</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["All", "RHP", "LHP"] as const).map((hand) => (
                <button
                  key={hand}
                  onClick={() => setHandFilter(hand)}
                  className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    handFilter === hand
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {hand}
                </button>
              ))}
            </div>
          </div>

          {/* Reset to today */}
          {dateOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateOffset(0)}
              className="text-xs text-muted-foreground hover:text-foreground h-9"
            >
              Today
            </Button>
          )}
        </div>

        {/* Data table */}
        <NrfiTable data={filteredData} />
      </main>
    </div>
  )
}
