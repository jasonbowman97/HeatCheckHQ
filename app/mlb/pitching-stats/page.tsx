"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, Loader2 } from "lucide-react"
import { pitchers as staticPitchers } from "@/lib/pitching-data"
import type { PitcherStats } from "@/lib/pitching-data"
import { PitchingTable } from "@/components/mlb/pitching-table"
import { PitcherArsenal } from "@/components/mlb/pitcher-arsenal"
import type { PitchingLeader } from "@/lib/mlb-api"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function transformLeaders(leaders: PitchingLeader[]): PitcherStats[] {
  return leaders.map((l) => ({
    id: String(l.id),
    name: l.name,
    team: l.team,
    hand: (l.hand === "L" ? "L" : "R") as "L" | "R",
    era: l.era,
    kPerGame: l.inningsPitched > 0 ? (l.strikeOuts / l.inningsPitched) * 9 : 0,
    kPct: l.inningsPitched > 0 ? ((l.strikeOuts / (l.inningsPitched * 3 + l.strikeOuts + l.walks)) * 100) : 0,
    cswPct: 0, // not available from MLB Stats API
    inningsPitched: l.inningsPitched,
    oppKPctL30: 0,
    hr9: l.inningsPitched > 0 ? (l.homeRuns / l.inningsPitched) * 9 : 0,
    barrelPct: 0,
    hardHitPct: 0,
    hrFbPct: 0,
    flyBallPct: 0,
    pulledAirPct: 0,
    arsenal: [],
  }))
}

type HandFilter = "ALL" | "L" | "R"

export default function PitchingStatsPage() {
  const [handFilter, setHandFilter] = useState<HandFilter>("ALL")
  const [selectedPitcher, setSelectedPitcher] = useState<PitcherStats | null>(null)

  const { data, isLoading } = useSWR<{ leaders: PitchingLeader[] }>("/api/mlb/pitching", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  })

  const isLive = !!data?.leaders?.length
  const basePitchers = isLive ? transformLeaders(data.leaders) : staticPitchers

  const filteredData = useMemo(() => {
    if (handFilter === "ALL") return basePitchers
    return basePitchers.filter((p) => p.hand === handFilter)
  }, [handFilter, basePitchers])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">Pitching Stats</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitting Stats
            </Link>
            <Link href="/mlb/nrfi" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NRFI
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Pitching Stats
            </span>
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Hand:</span>
                <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
                  {(["ALL", "L", "R"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHandFilter(h)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        handFilter === h
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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

            {/* Table */}
            <PitchingTable data={filteredData} onSelectPitcher={setSelectedPitcher} />
          </>
        )}
      </main>
    </div>
  )
}
