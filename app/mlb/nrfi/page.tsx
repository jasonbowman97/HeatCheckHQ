"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Calendar, Loader2, Lock } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { NrfiTable } from "@/components/mlb/nrfi-table"
import { SignupGate } from "@/components/signup-gate"
import { useUserTier } from "@/components/user-tier-provider"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import type { NrfiGame } from "@/lib/nrfi-data"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type HandFilter = "All" | "RHP" | "LHP"

const PREVIEW_GAMES = 3

export default function NrfiPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"
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

  const { data, isLoading } = useSWR<{ games: NrfiGame[]; date: string }>(
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

  // Count pitchers with NRFI data
  const pitcherCount = games.reduce((n, g) => {
    if (g.away.pitcher) n++
    if (g.home.pitcher) n++
    return n
  }, 0)

  return (
    <DashboardShell>
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
              ? `${games.length} games, ${pitcherCount} probable starters with NRFI records.`
              : "Matchup pairs with pitcher NRFI records and streaks."}
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
        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading NRFI matchups...</p>
          </div>
        )}

        {/* Data */}
        {!isLoading && (
          <>
            {isAnonymous && filteredGames.length > PREVIEW_GAMES ? (
              <SignupGate
                headline="See all NRFI matchups — free"
                description="Unlock every pitcher matchup, NRFI streaks, and game probabilities. Free forever, no credit card."
                countLabel={`${filteredGames.length} games today — updated with probable starters`}
                preview={<NrfiTable games={filteredGames.slice(0, PREVIEW_GAMES)} />}
                gated={<NrfiTable games={filteredGames.slice(PREVIEW_GAMES)} />}
              />
            ) : (
              <NrfiTable games={filteredGames} />
            )}
          </>
        )}

        {userTier === "free" && <ProUpsellBanner />}
      </main>
    </DashboardShell>
  )
}
