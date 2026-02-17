"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Loader2, Lock } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import type { NBAGame } from "@/lib/nba-h2h-data"
import type { NBAScheduleGame, NBATeamSummary } from "@/lib/nba-api"
import type { InjuredPlayer } from "@/lib/nba-h2h-data"
import { H2HMatchupSelector } from "@/components/nba/h2h-matchup-selector"
import { H2HHistory } from "@/components/nba/h2h-history"
import { H2HMomentum } from "@/components/nba/h2h-momentum"
import { H2HInjuries } from "@/components/nba/h2h-injuries"
import { SignupGate } from "@/components/signup-gate"
import { useUserTier } from "@/components/user-tier-provider"
import { DateNavigator } from "@/components/nba/date-navigator"
import { TableSkeleton } from "@/components/ui/table-skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const emptyMomentum: NBAGame["awayMomentum"] = {
  trend: "Steady",
  streak: "N/A",
  streakType: "W",
  last5: { wins: 0, losses: 0 },
  last10: { wins: 0, losses: 0 },
  ppg: 0,
  oppPpg: 0,
  atsRecord: "N/A",
  ouRecord: "N/A",
  homeRecord: "N/A",
  homePpg: 0,
  awayRecord: "N/A",
  awayPpg: 0,
}

function mapInjuryStatus(status: string): InjuredPlayer["status"] {
  const lower = status.toLowerCase()
  if (lower.includes("out")) return "Out"
  if (lower.includes("question")) return "Questionable"
  return "Day-To-Day"
}

interface LastRecord { last5: { wins: number; losses: number }; last10: { wins: number; losses: number } }

function buildMomentum(summary: NBATeamSummary | undefined, lastRec?: LastRecord): NBAGame["awayMomentum"] {
  if (!summary) return { ...emptyMomentum }
  const streak = summary.streak ?? 0
  return {
    trend: summary.ppg > summary.oppPpg ? "Trending Up" : summary.ppg < summary.oppPpg ? "Trending Down" : "Steady",
    streak: streak > 0 ? `W${streak}` : streak < 0 ? `L${Math.abs(streak)}` : "—",
    streakType: streak >= 0 ? "W" : "L",
    last5: lastRec?.last5 ?? { wins: 0, losses: 0 },
    last10: lastRec?.last10 ?? { wins: 0, losses: 0 },
    ppg: Math.round(summary.ppg * 10) / 10,
    oppPpg: Math.round(summary.oppPpg * 10) / 10,
    atsRecord: "N/A",
    ouRecord: "N/A",
    homeRecord: summary.homeRecord ?? "N/A",
    homePpg: 0,
    awayRecord: summary.awayRecord ?? "N/A",
    awayPpg: 0,
  }
}

function buildInjuries(summary: NBATeamSummary | undefined): InjuredPlayer[] {
  if (!summary) return []
  return summary.injuries.map((inj) => ({
    name: inj.name,
    injury: inj.detail || inj.status,
    status: mapInjuryStatus(inj.status),
  }))
}

interface H2HApiData {
  record: string
  awayAvgPts: number
  homeAvgPts: number
  avgTotal: number
  margin: string
  recentMeetings: { date: string; awayScore: number; homeScore: number; total: number; winner: string }[]
}

function espnToH2HGames(
  espnGames: NBAScheduleGame[],
  summaries: Record<string, NBATeamSummary>,
  h2hData: Record<string, H2HApiData | null>,
  lastRecords: Record<string, LastRecord>,
): NBAGame[] {
  return espnGames.map((g) => {
    const time = new Date(g.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const awaySummary = summaries[g.awayTeam.id]
    const homeSummary = summaries[g.homeTeam.id]
    const h2h = h2hData[g.id]

    return {
      id: g.id,
      awayTeam: g.awayTeam.abbreviation,
      awayFull: g.awayTeam.displayName,
      awayLogo: g.awayTeam.logo,
      homeTeam: g.homeTeam.abbreviation,
      homeFull: g.homeTeam.displayName,
      homeLogo: g.homeTeam.logo,
      date: new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time,
      venue: g.venue,
      awayInjuries: buildInjuries(awaySummary),
      homeInjuries: buildInjuries(homeSummary),
      h2hHistory: h2h
        ? { ...h2h, recentMeetings: h2h.recentMeetings.map((m) => ({ ...m, time: "" })) }
        : { record: "N/A", awayAvgPts: 0, homeAvgPts: 0, avgTotal: 0, margin: "N/A", recentMeetings: [] },
      awayMomentum: buildMomentum(awaySummary, lastRecords[g.awayTeam.id]),
      homeMomentum: buildMomentum(homeSummary, lastRecords[g.homeTeam.id]),
    }
  })
}

export default function NBAH2HPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [date, setDate] = useState(new Date())
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const handlePrevDay = useCallback(() => {
    setDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d })
    setSelectedGameId(null)
  }, [])

  const handleNextDay = useCallback(() => {
    setDate((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d })
    setSelectedGameId(null)
  }, [])

  const dateParam = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`

  const { data, isLoading } = useSWR<{
    games: NBAScheduleGame[]
    summaries: Record<string, NBATeamSummary>
    h2hData: Record<string, H2HApiData | null>
    lastRecords: Record<string, LastRecord>
    dvpRankings: Record<string, unknown>
  }>(`/api/nba/h2h?date=${dateParam}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000,
  })

  const games = useMemo(
    () => data?.games?.length
      ? espnToH2HGames(data.games, data.summaries ?? {}, data.h2hData ?? {}, data.lastRecords ?? {})
      : [],
    [data],
  )

  const isLive = games.length > 0

  const activeId = selectedGameId ?? games[0]?.id
  const selectedGame = games.find((g) => g.id === activeId) ?? games[0]

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Heading */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Head-to-Head</h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
            {!isLoading && games.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {games.length} Games
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <DateNavigator date={date} onPrev={handlePrevDay} onNext={handleNextDay} />
            <p className="text-sm text-muted-foreground">
              Season series, team form, and injury reports.
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && games.length === 0 && <TableSkeleton rows={5} columns={4} />}

        {/* No games state */}
        {!isLoading && games.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">
              No games scheduled for {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.
            </p>
          </div>
        )}

        {/* Content */}
        {selectedGame && (
          <>
            {/* Game selector — locked for anonymous when multiple games */}
            {isAnonymous && games.length > 1 ? (
              <div className="relative">
                <div className="absolute inset-0 z-10 flex items-center justify-end pr-6">
                  <Link
                    href="/auth/sign-up"
                    className="flex items-center gap-1.5 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm backdrop-blur-sm"
                  >
                    <Lock className="h-3 w-3" />
                    Sign up to switch games
                  </Link>
                </div>
                <div className="pointer-events-none opacity-60">
                  <H2HMatchupSelector
                    games={games}
                    selectedId={activeId}
                    onSelect={setSelectedGameId}
                  />
                </div>
              </div>
            ) : (
              <H2HMatchupSelector
                games={games}
                selectedId={activeId}
                onSelect={setSelectedGameId}
              />
            )}

            {/* H2H History shown as preview */}
            <H2HHistory game={selectedGame} />

            {/* Momentum + Injuries gated for anonymous */}
            {isAnonymous ? (
              <SignupGate
                headline="See full matchup breakdown — free"
                description="Unlock team momentum, injury reports, and every game's H2H data. Free forever, no credit card."
                countLabel={`${games.length} games tonight`}
                preview={<H2HMomentum game={selectedGame} />}
                gated={<H2HInjuries game={selectedGame} />}
              />
            ) : (
              <>
                <H2HMomentum game={selectedGame} />
                <H2HInjuries game={selectedGame} />
              </>
            )}
          </>
        )}
      </main>
    </DashboardShell>
  )
}
