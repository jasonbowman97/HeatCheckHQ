"use client"

import { useState } from "react"
import useSWR from "swr"
import { Loader2, AlertCircle, RefreshCw, Lock, ArrowRight, Zap, Timer } from "lucide-react"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard-shell"
import { First3MinTable } from "@/components/nba/pbp/first-3min-table"
import { GameWindowFilter, type GameWindow } from "@/components/nba/pbp/game-window-filter"
import { SignupGate } from "@/components/signup-gate"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { useUserTier } from "@/components/user-tier-provider"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const THRESHOLD_OPTIONS = [
  { value: 0.5, label: "0.5+" },
  { value: 1.5, label: "1.5+" },
  { value: 2.5, label: "2.5+" },
  { value: 3.5, label: "3.5+" },
  { value: 4.5, label: "4.5+" },
]

const PREVIEW_ROWS = 8

export default function NBAFirst3MinPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [gameWindow, setGameWindow] = useState<GameWindow>("season")
  const [threshold, setThreshold] = useState(1.5)

  const apiUrl = `/api/nba/first-3min?window=${gameWindow}&threshold=${threshold}`
  const { data, isLoading, error, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const players = data?.players ?? []

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Timer className="h-5 w-5 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              First 3 Minutes Scoring
            </h1>
            <SectionInfoTip page="/nba/first-3min" />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Which players score the most points in the first 3 minutes of Q1.
            Powered by ESPN play-by-play data.
          </p>
          <LastUpdated timestamp={data?.updatedAt} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Game window */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Window
            </span>
            <GameWindowFilter value={gameWindow} onChange={setGameWindow} />
          </div>

          {/* Threshold */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Threshold
            </span>
            <div
              className="flex rounded-lg border border-border overflow-hidden"
              role="group"
              aria-label="Points threshold"
            >
              {THRESHOLD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThreshold(opt.value)}
                  aria-pressed={threshold === opt.value}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    threshold === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">
              Failed to load data
            </p>
            <p className="text-xs text-muted-foreground">
              PBP data may not be available yet. Run the backfill script first.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* No data state */}
        {!isLoading && !error && players.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              No data available
            </p>
            <p className="text-xs text-muted-foreground">
              Play-by-play data hasn{"'"}t been ingested yet. Check back after
              games are played.
            </p>
          </div>
        )}

        {/* Table */}
        {players.length > 0 &&
          (isAnonymous ? (
            <SignupGate
              headline="See all first 3-min scoring data — free"
              description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
              countLabel={`${players.length} players available today`}
              preview={
                <First3MinTable
                  players={players}
                  threshold={threshold}
                  maxRows={PREVIEW_ROWS}
                />
              }
              gated={
                <First3MinTable
                  players={players}
                  threshold={threshold}
                  skipRows={PREVIEW_ROWS}
                />
              }
            />
          ) : (
            <First3MinTable players={players} threshold={threshold} />
          ))}

        {/* Pro upsell */}
        {userTier === "free" && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Go Pro for unlimited data, all filters & zero gates
                </p>
                <p className="text-xs text-muted-foreground">
                  Full access to every dashboard — $12/mo
                </p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Go Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </main>
    </DashboardShell>
  )
}
