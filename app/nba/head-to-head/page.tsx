"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, Loader2 } from "lucide-react"
import { nbaGames as staticGames } from "@/lib/nba-h2h-data"
import type { NBAGame } from "@/lib/nba-h2h-data"
import type { NBAScheduleGame, NBATeamSummary } from "@/lib/nba-api"
import type { InjuredPlayer } from "@/lib/nba-h2h-data"
import { H2HMatchupSelector } from "@/components/nba/h2h-matchup-selector"
import { H2HHistory } from "@/components/nba/h2h-history"
import { H2HMomentum } from "@/components/nba/h2h-momentum"
import { H2HDefense } from "@/components/nba/h2h-defense"
import { H2HInjuries } from "@/components/nba/h2h-injuries"

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

const emptyDefense: NBAGame["awayDefense"] = { pg: 0, sg: 0, sf: 0, pf: 0, c: 0 }

function mapInjuryStatus(status: string): InjuredPlayer["status"] {
  const lower = status.toLowerCase()
  if (lower.includes("out")) return "Out"
  if (lower.includes("question")) return "Questionable"
  return "Day-To-Day"
}

function buildMomentum(summary: NBATeamSummary | undefined): NBAGame["awayMomentum"] {
  if (!summary) return { ...emptyMomentum }
  const record = summary.record // e.g. "35-20"
  const [wins, losses] = record.split("-").map(Number)
  return {
    ...emptyMomentum,
    streak: record,
    ppg: Math.round(summary.ppg * 10) / 10,
    oppPpg: Math.round(summary.oppPpg * 10) / 10,
    last10: { wins: Math.min(wins, 10), losses: Math.min(losses, 10) },
    last5: { wins: Math.min(wins, 5), losses: Math.min(losses, 5) },
    trend: summary.ppg > summary.oppPpg ? "Trending Up" : summary.ppg < summary.oppPpg ? "Trending Down" : "Steady",
    homeRecord: record,
    awayRecord: record,
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

function espnToH2HGames(espnGames: NBAScheduleGame[], summaries: Record<string, NBATeamSummary>): NBAGame[] {
  return espnGames.map((g) => {
    const time = new Date(g.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const awaySummary = summaries[g.awayTeam.id]
    const homeSummary = summaries[g.homeTeam.id]
    return {
      id: g.id,
      awayTeam: g.awayTeam.abbreviation,
      awayFull: g.awayTeam.displayName,
      homeTeam: g.homeTeam.abbreviation,
      homeFull: g.homeTeam.displayName,
      date: new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time,
      venue: g.venue,
      awayInjuries: buildInjuries(awaySummary),
      homeInjuries: buildInjuries(homeSummary),
      h2hHistory: { record: "N/A", awayAvgPts: 0, homeAvgPts: 0, avgTotal: 0, margin: "N/A", recentMeetings: [] },
      awayMomentum: buildMomentum(awaySummary),
      homeMomentum: buildMomentum(homeSummary),
      awayDefense: { ...emptyDefense },
      homeDefense: { ...emptyDefense },
    }
  })
}

export default function NBAH2HPage() {
  const { data, isLoading } = useSWR<{ games: NBAScheduleGame[]; summaries: Record<string, NBATeamSummary> }>("/api/nba/h2h", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const liveGames = useMemo(() => (data?.games?.length ? espnToH2HGames(data.games, data.summaries ?? {}) : null), [data])

  // Merge: use live games for the matchup selector but fall back to static for detailed stats
  const allGames = liveGames ?? staticGames
  const isLive = !!liveGames

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const activeId = selectedGameId ?? allGames[0]?.id
  // Try to find a matching static game for full detail, otherwise use the live shell
  const selectedGame = staticGames.find((g) => g.id === activeId)
    ?? allGames.find((g) => g.id === activeId)
    ?? allGames[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <p className="text-xs text-muted-foreground">NBA Head-to-Head</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/nba/first-basket"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              First Basket
            </Link>
  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
  H2H
  </span>
  <Link
    href="/nba/defense-vs-position"
    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
  >
  Def vs Pos
  </Link>
  <Link
    href="/nba/trends"
    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
  >
  Trends
  </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link
              href="/mlb/hitting-stats"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              MLB
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

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Team vs Team H2H Analysis</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive matchup analytics with betting insights and injury reports
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <H2HMatchupSelector
            games={allGames}
            selectedId={activeId}
            onSelect={setSelectedGameId}
          />
          <H2HHistory game={selectedGame} />
          <H2HMomentum game={selectedGame} />
          <H2HDefense game={selectedGame} />
          <H2HInjuries game={selectedGame} />
        </div>
      </main>
    </div>
  )
}
