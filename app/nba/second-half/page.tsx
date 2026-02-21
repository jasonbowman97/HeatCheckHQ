"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Zap,
  Timer,
  Target,
  Users,
} from "lucide-react"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard-shell"
import { PBPPlayerTable, type PBPPlayer, type TodayGame } from "@/components/nba/pbp/pbp-player-table"
import { GameWindowFilter, type GameWindow } from "@/components/nba/pbp/game-window-filter"
import { SignupGate } from "@/components/signup-gate"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { useUserTier } from "@/components/user-tier-provider"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type PropTab = "first-basket" | "first-team-fg"

const PREVIEW_ROWS = 8

export default function NBASecondHalfPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [tab, setTab] = useState<PropTab>("first-basket")
  const [gameWindow, setGameWindow] = useState<GameWindow>("season")

  const apiUrl = `/api/nba/second-half-pbp?type=${tab}&window=${gameWindow}`
  const { data, isLoading, error, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const players: PBPPlayer[] = data?.players ?? []
  const todayGames: TodayGame[] = data?.todayGames ?? []

  const tabLabel =
    tab === "first-basket" ? "2H First Basket" : "2H Team First FG"
  const tabDescription =
    tab === "first-basket"
      ? "Which players score the first basket of the second half (Q3)."
      : "Which players score their team's first field goal after halftime."

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Timer className="h-5 w-5 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              2nd Half Props
            </h1>
            <SectionInfoTip page="/nba/second-half" />
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{tabDescription}</p>
          <LastUpdated timestamp={data?.updatedAt} />
        </div>

        {/* Tab bar + filters */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div
            className="flex rounded-lg border border-border overflow-hidden"
            role="tablist"
            aria-label="Prop type"
          >
            {(
              [
                { value: "first-basket" as PropTab, label: "2H First Basket", icon: Target },
                { value: "first-team-fg" as PropTab, label: "2H Team First FG", icon: Users },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={tab === opt.value}
                onClick={() => setTab(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Game window */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Window
            </span>
            <GameWindowFilter value={gameWindow} onChange={setGameWindow} />
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
              headline={`See all ${tabLabel.toLowerCase()} data — free`}
              description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
              countLabel={`${players.length} players available`}
              preview={
                <PBPPlayerTable
                  players={players}
                  mode="first-basket"
                  label={tabLabel}
                  todayGames={todayGames}
                  maxRows={PREVIEW_ROWS}
                  showTopPicks
                />
              }
              gated={
                <PBPPlayerTable
                  players={players}
                  mode="first-basket"
                  label={tabLabel}
                  todayGames={todayGames}
                  skipRows={PREVIEW_ROWS}
                />
              }
            />
          ) : (
            <PBPPlayerTable
              players={players}
              mode="first-basket"
              label={tabLabel}
              todayGames={todayGames}
              showTopPicks
            />
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
