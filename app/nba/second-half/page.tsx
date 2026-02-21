"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  Zap,
  Timer,
  Target,
  Users,
} from "lucide-react"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard-shell"
import { GameWindowFilter, type GameWindow } from "@/components/nba/pbp/game-window-filter"
import { SignupGate } from "@/components/signup-gate"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { useUserTier } from "@/components/user-tier-provider"
import { ShareCapture } from "@/components/ui/share-capture"

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

  const players = data?.players ?? []

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

        {/* Tab bar */}
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
              Play-by-play data hasn{"'"}t been ingested yet or no players are
              playing today. Check back after games are played.
            </p>
          </div>
        )}

        {/* Table */}
        {players.length > 0 &&
          (isAnonymous ? (
            <SignupGate
              headline={`See all ${tabLabel.toLowerCase()} data — free`}
              description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
              countLabel={`${players.length} players available today`}
              preview={
                <SecondHalfTable
                  players={players}
                  propType={tab}
                  maxRows={PREVIEW_ROWS}
                />
              }
              gated={
                <SecondHalfTable
                  players={players}
                  propType={tab}
                  skipRows={PREVIEW_ROWS}
                />
              }
            />
          ) : (
            <SecondHalfTable players={players} propType={tab} />
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

/* ─── Inline Table Component for 2nd Half ─── */

interface SecondHalfPlayer {
  athleteId: string
  athleteName: string
  team: string
  firstCount: number
  gamesInWindow: number
  rate: number
  recentResults: {
    gameId: string
    date: string
    opponent: string
    isHome: boolean
    scored: boolean
  }[]
  opponent: string | null
  isHome: boolean
}

function hitRateColor(rate: number): { text: string; bg: string } {
  if (rate >= 30) return { text: "text-emerald-400", bg: "bg-emerald-400/15" }
  if (rate >= 20) return { text: "text-emerald-300", bg: "bg-emerald-400/10" }
  if (rate >= 10) return { text: "text-amber-400", bg: "bg-amber-400/10" }
  return { text: "text-muted-foreground", bg: "bg-secondary" }
}

function SecondHalfTable({
  players,
  propType,
  maxRows,
  skipRows,
}: {
  players: SecondHalfPlayer[]
  propType: PropTab
  maxRows?: number
  skipRows?: number
}) {
  const rows = (() => {
    if (skipRows) return players.slice(skipRows)
    if (maxRows !== undefined) return players.slice(0, maxRows)
    return players
  })()

  const propLabel =
    propType === "first-basket" ? "2H First Basket" : "2H Team First FG"

  return (
    <ShareCapture label={propLabel}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary w-10">
                  #
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary min-w-[160px]">
                  Player
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-20">
                  Rate
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-16">
                  Made
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-16">
                  Games
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="hidden md:inline">Recent Games</span>
                  <span className="md:hidden">Recent</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player, i) => {
                const rank = (skipRows ?? 0) + i + 1
                const colors = hitRateColor(player.rate)

                return (
                  <tr
                    key={player.athleteId}
                    className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Rank */}
                    <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                      {rank}
                    </td>

                    {/* Player */}
                    <td className="px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {player.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {player.team}
                          {player.opponent && (
                            <span
                              className={`ml-1 ${
                                player.isHome
                                  ? "text-emerald-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {player.isHome ? "vs" : "@"} {player.opponent}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Rate badge */}
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}
                      >
                        {player.rate.toFixed(1)}%
                      </span>
                    </td>

                    {/* Made count */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                        {player.firstCount}
                      </span>
                    </td>

                    {/* Games in window */}
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        {player.gamesInWindow}
                      </span>
                    </td>

                    {/* Recent game dots */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {player.recentResults.map((game, j) => (
                          <div key={j} className="relative group">
                            {/* Desktop: show checkmark/x */}
                            <div
                              className={`hidden md:flex items-center justify-center w-7 h-7 rounded text-[11px] font-bold border ${
                                game.scored
                                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-400/10 text-red-400/70 border-red-500/15"
                              }`}
                            >
                              {game.scored ? "✓" : "✗"}
                            </div>
                            {/* Mobile: dots */}
                            <div
                              className={`md:hidden w-3.5 h-3.5 rounded-full ${
                                game.scored
                                  ? "bg-emerald-400"
                                  : "bg-red-400/40"
                              }`}
                              title={`${game.scored ? "Scored" : "Missed"} vs ${game.opponent}`}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ShareCapture>
  )
}
