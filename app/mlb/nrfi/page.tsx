"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Calendar, Loader2, Lock, AlertCircle, RefreshCw, ArrowUpDown } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { NrfiTable } from "@/components/mlb/nrfi-table"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { SignupGate } from "@/components/signup-gate"
import { useUserTier } from "@/components/user-tier-provider"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import type { NrfiGame } from "@/lib/nrfi-data"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type HandFilter = "All" | "RHP" | "LHP"
type NrfiSort = "time" | "nrfiPct" | "streak"

const SORT_OPTIONS: { value: NrfiSort; label: string }[] = [
  { value: "time", label: "Game Time" },
  { value: "nrfiPct", label: "NRFI %" },
  { value: "streak", label: "Streak" },
]

function avgPitcherStat(game: NrfiGame, key: "nrfiPct" | "streak"): number {
  const vals: number[] = []
  if (game.away.pitcher) vals.push(game.away.pitcher[key])
  if (game.home.pitcher) vals.push(game.home.pitcher[key])
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

const PREVIEW_GAMES = 3

export default function NrfiPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"
  const [handFilter, setHandFilter] = useState<HandFilter>("All")
  const [sortBy, setSortBy] = useState<NrfiSort>("time")
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

  const { data, isLoading, error, mutate } = useSWR<{ games: NrfiGame[]; date: string; updatedAt?: string }>(
    `/api/mlb/nrfi?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const games = data?.games ?? []
  const isLive = games.length > 0 && !isLoading

  // Filter games by pitcher hand
  const filteredGames = useMemo(() => {
    if (handFilter === "All") return games
    const hand = handFilter === "RHP" ? "R" : "L"
    // Keep games where at least one pitcher matches the hand filter
    return games.filter((g) =>
      (g.away.pitcher?.hand === hand) || (g.home.pitcher?.hand === hand)
    )
  }, [handFilter, games])

  // Sort filtered games
  const sortedGames = useMemo(() => {
    if (sortBy === "time") return filteredGames
    return [...filteredGames].sort((a, b) => {
      if (sortBy === "nrfiPct") return avgPitcherStat(b, "nrfiPct") - avgPitcherStat(a, "nrfiPct")
      return avgPitcherStat(b, "streak") - avgPitcherStat(a, "streak")
    })
  }, [filteredGames, sortBy])

  // Count pitchers with NRFI data
  const pitcherCount = games.reduce((n, g) => {
    if (g.away.pitcher) n++
    if (g.home.pitcher) n++
    return n
  }, 0)

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">No Run First Inning</h1>
            <SectionInfoTip page="/mlb/nrfi" />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isLive
              ? `${games.length} games, ${pitcherCount} probable starters with NRFI records.`
              : "Matchup pairs with pitcher NRFI records and streaks."}
          </p>
          <LastUpdated timestamp={data?.updatedAt} />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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

          {/* Pitcher hand filter — locked for anonymous users */}
          <div className="relative">
            {isAnonymous && (
              <div className="absolute inset-0 z-10 flex items-center justify-end pr-2">
                <Link
                  href="/auth/sign-up"
                  className="flex items-center gap-1.5 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm backdrop-blur-sm"
                >
                  <Lock className="h-3 w-3" />
                  Sign up to filter
                </Link>
              </div>
            )}
            <div className={`flex items-center gap-3 ${isAnonymous ? "pointer-events-none opacity-40" : ""}`}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pitcher</span>
              <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Filter by pitcher hand">
                {(["All", "RHP", "LHP"] as const).map((hand) => (
                  <button
                    key={hand}
                    onClick={() => setHandFilter(hand)}
                    aria-pressed={handFilter === hand}
                    aria-label={`Filter by ${hand === "All" ? "all pitchers" : hand}`}
                    className={`px-3.5 py-2.5 text-xs font-semibold transition-colors ${
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
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as NrfiSort)}
              aria-label="Sort games by"
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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

        {/* Loading state */}
        {isLoading && <TableSkeleton rows={6} columns={5} />}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">Failed to load NRFI data</p>
            <p className="text-xs text-muted-foreground">Something went wrong. Try again.</p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Data */}
        {!isLoading && !error && (
          <>
            {isAnonymous && sortedGames.length > PREVIEW_GAMES ? (
              <SignupGate
                headline="See all NRFI matchups — free"
                description="Unlock every pitcher matchup, NRFI streaks, and game probabilities. Free forever, no credit card."
                countLabel={`${sortedGames.length} games today — updated with probable starters`}
                preview={<NrfiTable games={sortedGames.slice(0, PREVIEW_GAMES)} />}
                gated={<NrfiTable games={sortedGames.slice(PREVIEW_GAMES)} />}
              />
            ) : (
              <NrfiTable games={sortedGames} />
            )}
          </>
        )}

        {userTier === "free" && <ProUpsellBanner />}
      </main>
    </DashboardShell>
  )
}
