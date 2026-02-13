"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import type { PitcherStats } from "@/lib/pitching-data"
import { PitchingTable } from "@/components/mlb/pitching-table"
import { PitcherArsenal } from "@/components/mlb/pitcher-arsenal"
import type { PitchingLeader } from "@/lib/mlb-api"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Enriched leader from /api/mlb/pitching */
interface EnrichedPitchingLeader extends PitchingLeader {
  barrelPctAgainst?: number
  hardHitPctAgainst?: number
  whiffPct?: number
  isTodayStarter?: boolean
}

function transformLeaders(leaders: EnrichedPitchingLeader[]): PitcherStats[] {
  return leaders.map((l) => ({
    id: l.id,
    name: l.name,
    team: l.team,
    hand: (l.hand === "L" ? "L" : "R") as "L" | "R",
    era: l.era,
    whip: l.whip,
    wins: l.wins,
    losses: l.losses,
    kPer9: l.inningsPitched > 0 ? (l.strikeOuts / l.inningsPitched) * 9 : 0,
    kPct: l.inningsPitched > 0 ? ((l.strikeOuts / (l.inningsPitched * 3 + l.strikeOuts + l.walks)) * 100) : 0,
    inningsPitched: l.inningsPitched,
    barrelPct: l.barrelPctAgainst ?? 0,
    hardHitPct: l.hardHitPctAgainst ?? 0,
    whiffPct: l.whiffPct ?? 0,
    arsenal: [],
    isTodayStarter: l.isTodayStarter ?? false,
  }))
}

type HandFilter = "ALL" | "L" | "R"
type ViewFilter = "ALL" | "TODAY"

export default function PitchingStatsPage() {
  const [handFilter, setHandFilter] = useState<HandFilter>("ALL")
  const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL")
  const [selectedPitcher, setSelectedPitcher] = useState<PitcherStats | null>(null)

  const { data, isLoading } = useSWR<{ leaders: EnrichedPitchingLeader[]; hasStatcast: boolean; todayStarterIds: number[] }>(
    "/api/mlb/pitching",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const isLive = !!data?.leaders?.length
  const allPitchers = isLive ? transformLeaders(data.leaders) : []
  const hasTodayStarters = allPitchers.some((p) => p.isTodayStarter)

  const filteredData = useMemo(() => {
    let rows = allPitchers
    if (viewFilter === "TODAY") {
      rows = rows.filter((p) => p.isTodayStarter)
    }
    if (handFilter !== "ALL") {
      rows = rows.filter((p) => p.hand === handFilter)
    }
    return rows
  }, [handFilter, viewFilter, allPitchers])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">Pitching Stats</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/mlb/hot-hitters" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hot Hitters
            </Link>
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitter vs Pitcher
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Pitching Stats
            </span>
            <Link href="/mlb/nrfi" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NRFI
            </Link>
            <Link href="/mlb/weather" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Weather
            </Link>
            <Link href="/mlb/trends" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Trends
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 flex flex-col gap-6">
        {selectedPitcher ? (
          <PitcherArsenal pitcher={selectedPitcher} onBack={() => setSelectedPitcher(null)} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Today's Starters / All Pitchers toggle */}
              {hasTodayStarters && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">View</span>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["TODAY", "ALL"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setViewFilter(v)}
                        className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          viewFilter === v
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {v === "TODAY" ? "Today's Starters" : "All Pitchers"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hand filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hand</span>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(["ALL", "L", "R"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHandFilter(h)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        handFilter === h
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {h === "ALL" ? "All" : `${h}HP`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {isLive && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                    Live
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {filteredData.length} pitchers
                </span>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading pitching stats...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredData.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {viewFilter === "TODAY"
                    ? "No probable starters match your filters."
                    : "No pitching data available."}
                </p>
              </div>
            )}

            {/* Table */}
            {filteredData.length > 0 && (
              <PitchingTable data={filteredData} onSelectPitcher={setSelectedPitcher} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
