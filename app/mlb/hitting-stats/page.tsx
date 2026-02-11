"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import type { Player } from "@/lib/players-data"
import { players as staticPlayers } from "@/lib/players-data"
import type { Pitcher } from "@/lib/matchup-data"
import { getTodayMatchup, aggregateBatterStats } from "@/lib/matchup-data"
import { DashboardHeader } from "@/components/dashboard-header"
import { MatchupPanel } from "@/components/matchup-panel"
import { PlayersTable } from "@/components/players-table"
import { PlayerDetail } from "@/components/player-detail"
import { TimeRangeFilter, type TimeRange } from "@/components/time-range-filter"
import { Switch } from "@/components/ui/switch"
import type { BattingLeader } from "@/lib/mlb-api"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Enriched leader from /api/mlb/batting (BattingLeader + Statcast fields) */
interface EnrichedBattingLeader extends BattingLeader {
  exitVelocity?: number
  barrelPct?: number
  hardHitPct?: number
  xBA?: number
  xSLG?: number
  xwOBA?: number
  whiffPct?: number
  batSpeed?: number
}

function transformBattingLeaders(leaders: EnrichedBattingLeader[]): Player[] {
  return leaders.map((l) => ({
    id: String(l.id),
    name: l.name,
    position: l.pos,
    team: l.team,
    abs: l.atBats,
    avg: l.avg,
    slg: l.slg,
    xbh: l.doubles + l.triples + l.homeRuns,
    hr: l.homeRuns,
    ballsLaunched: 0,
    exitVelo: l.exitVelocity ?? 0,
    barrelPct: l.barrelPct ?? 0,
    hardHitPct: l.hardHitPct ?? 0,
    flyBallPct: 0, // Not available from Statcast leaderboard
    pulledAirPct: 0, // Not available from Statcast leaderboard
  }))
}

type BatterHandFilter = "All" | "LHH" | "RHH"

function filterByBatterHand(playerList: Player[], hand: BatterHandFilter): Player[] {
  if (hand === "All") return playerList
  // LHH: show L batters + S (switch hitters who bat left vs RHP)
  // RHH: show R batters + S (switch hitters who bat right vs LHP)
  if (hand === "LHH") return playerList.filter((p) => p.position === "L" || p.position === "S")
  return playerList.filter((p) => p.position === "R" || p.position === "S")
}

export default function Page() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  // Live data
  const { data: liveData } = useSWR<{ leaders: EnrichedBattingLeader[]; hasStatcast: boolean }>("/api/mlb/batting", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000,
  })
  const livePlayers = useMemo(
    () => (liveData?.leaders?.length ? transformBattingLeaders(liveData.leaders) : null),
    [liveData]
  )

  // Matchup state
  const matchup = getTodayMatchup()
  const [selectedPitcher, setSelectedPitcher] = useState<Pitcher>(matchup.probablePitcher)
  const [selectedPitchTypes, setSelectedPitchTypes] = useState<string[]>(
    matchup.probablePitcher.arsenal.map((p) => p.pitchType)
  )
  const [minUsagePct, setMinUsagePct] = useState(5)
  const [matchupMode, setMatchupMode] = useState(true)

  // Batter hand filter
  const [batterHand, setBatterHand] = useState<BatterHandFilter>("All")

  // Time range filter
  const [timeRange, setTimeRange] = useState<TimeRange>({ preset: "season" })

  // When pitcher changes, reset selected pitch types to their full arsenal
  function handlePitcherChange(pitcher: Pitcher) {
    setSelectedPitcher(pitcher)
    setSelectedPitchTypes(pitcher.arsenal.map((p) => p.pitchType))
  }

  // Use live data when matchup mode is off, static for matchup mode
  const basePlayers = matchupMode ? staticPlayers : (livePlayers ?? staticPlayers)
  const isLive = !matchupMode && !!livePlayers

  // Filter players by batter hand
  const filteredPlayers = useMemo(
    () => filterByBatterHand(basePlayers, batterHand),
    [batterHand, basePlayers]
  )

  // Compute aggregated stats for each batter vs selected pitcher's pitch mix
  const matchupStats = useMemo(() => {
    if (!matchupMode) return []
    return filteredPlayers
      .map((player) =>
        aggregateBatterStats(
          player.id,
          player.name,
          player.position,
          player.team,
          selectedPitcher.hand,
          selectedPitchTypes
        )
      )
      .filter((s) => s !== null)
  }, [matchupMode, selectedPitcher, selectedPitchTypes, filteredPlayers])

  if (selectedPlayer) {
    return (
      <PlayerDetail
        player={selectedPlayer}
        onBack={() => setSelectedPlayer(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left sidebar - Matchup Panel */}
          <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Matchup Mode</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${matchupMode ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {matchupMode ? "On" : "Off"}
                </span>
                <Switch
                  checked={matchupMode}
                  onCheckedChange={setMatchupMode}
                  aria-label="Toggle matchup mode"
                />
              </div>
            </div>
            {matchupMode && (
              <MatchupPanel
                selectedPitcher={selectedPitcher}
                onPitcherChange={handlePitcherChange}
                selectedPitchTypes={selectedPitchTypes}
                onPitchTypesChange={setSelectedPitchTypes}
                minUsagePct={minUsagePct}
                onMinUsagePctChange={setMinUsagePct}
              />
            )}
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Players Hitting Stats
                </h2>
                {isLive && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                    Live
                  </span>
                )}
              </div>
                <p className="text-sm text-muted-foreground">
                  {matchupMode ? (
                    <>
                      vs {selectedPitcher.name} ({selectedPitcher.hand === "R" ? "RHP" : "LHP"})
                      {batterHand !== "All" && ` — ${batterHand} only`}
                      {timeRange.preset !== "season" && ` — ${timeRange.preset === "custom" ? "custom range" : `last ${timeRange.preset.replace("L", "")} games`}`}
                      {" "}— {selectedPitchTypes.length} pitch {selectedPitchTypes.length === 1 ? "type" : "types"} selected.{" "}
                      <span className="text-muted-foreground/70">Click a row for game log details.</span>
                    </>
                  ) : (
                    <>
                      {timeRange.preset === "season"
                        ? "Full season stats"
                        : timeRange.preset === "custom"
                          ? "Custom date range"
                          : `Last ${timeRange.preset.replace("L", "")} games`}
                      {batterHand !== "All" ? ` — ${batterHand} only` : ""}.{" "}
                      Click on a player row to view their detailed game log.
                    </>
                  )}
                </p>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Time Range Filter */}
                <TimeRangeFilter value={timeRange} onChange={setTimeRange} />

                {/* Divider */}
                <div className="hidden sm:block h-6 w-px bg-border" />

                {/* Batter Hand Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batter</span>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["All", "LHH", "RHH"] as const).map((hand) => (
                      <button
                        key={hand}
                        onClick={() => setBatterHand(hand)}
                        className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          batterHand === hand
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
            </div>

            {/* Active pitch chips when in matchup mode */}
            {matchupMode && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Active pitches:</span>
                {selectedPitchTypes.map((pt) => {
                  const arsenalPitch = selectedPitcher.arsenal.find((a) => a.pitchType === pt)
                  return (
                    <span
                      key={pt}
                      className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {pt}
                      {arsenalPitch && (
                        <span className="text-muted-foreground font-mono">
                          {arsenalPitch.usagePct.toFixed(1)}%
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            )}

            <PlayersTable
              onSelectPlayer={setSelectedPlayer}
              matchupStats={matchupStats}
              useMatchupStats={matchupMode}
              filteredPlayers={filteredPlayers}
              timeRange={timeRange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
