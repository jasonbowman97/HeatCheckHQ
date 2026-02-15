"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import type { ScheduleGame } from "@/lib/mlb-api"
import type { Pitcher, MatchupResponse, AggregatedBatterStats } from "@/lib/matchup-data"
import { buildMatchupRows, toPanelArsenal } from "@/lib/matchup-data"
import { DashboardShell } from "@/components/dashboard-shell"
import { MatchupPanel } from "@/components/matchup-panel"
import { PlayersTable } from "@/components/players-table"
import { Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type BatterHandFilter = "All" | "LHH" | "RHH"

export default function Page() {
  const currentYear = new Date().getFullYear()

  // Date navigation (±7 days)
  const [dateOffset, setDateOffset] = useState(0)
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

  // Game & pitcher selection state
  const [selectedGamePk, setSelectedGamePk] = useState<number | null>(null)
  const [selectedPitcherId, setSelectedPitcherId] = useState<number | null>(null)
  const [selectedPitcherHand, setSelectedPitcherHand] = useState<"L" | "R">("R")
  const [selectedPitcherName, setSelectedPitcherName] = useState("")
  const [selectedPitcherTeam, setSelectedPitcherTeam] = useState("")
  const [season, setSeason] = useState(currentYear)

  // Filters
  const [selectedPitchTypes, setSelectedPitchTypes] = useState<string[]>([])
  const [minUsagePct, setMinUsagePct] = useState(5)
  const [batterHand, setBatterHand] = useState<BatterHandFilter>("All")

  // Fetch schedule for selected date
  const { data: scheduleData, isLoading: isLoadingSchedule } = useSWR<{ games: ScheduleGame[] }>(
    `/api/mlb/schedule?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )
  const games = scheduleData?.games ?? []

  // Determine the batting team when a pitcher is selected
  const battingTeamId = useMemo(() => {
    if (!selectedGamePk || !selectedPitcherId) return null
    const game = games.find((g) => g.gamePk === selectedGamePk)
    if (!game) return null

    // If the home pitcher is selected, the batting team is away, and vice versa
    if (game.home.probablePitcher?.id === selectedPitcherId) {
      return { id: game.away.id, abbr: game.away.abbreviation }
    }
    if (game.away.probablePitcher?.id === selectedPitcherId) {
      return { id: game.home.id, abbr: game.home.abbreviation }
    }
    return null
  }, [selectedGamePk, selectedPitcherId, games])

  // Fetch matchup data
  const matchupKey = selectedPitcherId && battingTeamId
    ? `/api/mlb/matchup?pitcherId=${selectedPitcherId}&teamId=${battingTeamId.id}&season=${season}&hand=${selectedPitcherHand}&pitcherName=${encodeURIComponent(selectedPitcherName)}&pitcherTeam=${encodeURIComponent(selectedPitcherTeam)}&battingTeam=${encodeURIComponent(battingTeamId.abbr)}`
    : null
  const { data: matchupData, isLoading: isLoadingMatchup } = useSWR<MatchupResponse>(
    matchupKey,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  // Build the pitcher object for the MatchupPanel
  const pitcher: Pitcher | null = useMemo(() => {
    if (!matchupData?.pitcher) {
      if (selectedPitcherId) {
        // Minimal pitcher while loading
        return {
          id: selectedPitcherId,
          name: selectedPitcherName,
          team: selectedPitcherTeam,
          hand: selectedPitcherHand,
          arsenal: [],
        }
      }
      return null
    }
    return {
      id: matchupData.pitcher.id,
      name: matchupData.pitcher.name,
      team: matchupData.pitcher.team,
      hand: matchupData.pitcher.hand,
      arsenal: toPanelArsenal(matchupData.pitcher.arsenal),
      seasonStats: matchupData.pitcher.seasonStats,
    }
  }, [matchupData, selectedPitcherId, selectedPitcherName, selectedPitcherTeam, selectedPitcherHand])

  // Build aggregated batter rows
  const matchupRows: AggregatedBatterStats[] = useMemo(() => {
    if (!matchupData?.batters) return []
    const rows = buildMatchupRows(matchupData.batters, selectedPitcherHand)
    // Filter by batter hand
    if (batterHand === "LHH") {
      return rows.filter((r) => r.batSide === "L" || r.batSide === "S")
    }
    if (batterHand === "RHH") {
      return rows.filter((r) => r.batSide === "R" || r.batSide === "S")
    }
    return rows
  }, [matchupData, selectedPitcherHand, batterHand])

  // Reset selections when date changes
  useEffect(() => {
    setSelectedGamePk(null)
    setSelectedPitcherId(null)
    setSelectedPitcherName("")
    setSelectedPitcherTeam("")
    setSelectedPitchTypes([])
  }, [dateOffset])

  // Auto-select first game with both starters when schedule loads
  useEffect(() => {
    if (games.length > 0 && !selectedGamePk) {
      const gameWithStarters = games.find(
        (g) => g.home.probablePitcher && g.away.probablePitcher
      )
      const game = gameWithStarters ?? games[0]
      setSelectedGamePk(game.gamePk)
    }
  }, [games, selectedGamePk])

  // Auto-select the home pitcher when a game is selected
  useEffect(() => {
    if (!selectedGamePk) return
    const game = games.find((g) => g.gamePk === selectedGamePk)
    if (!game) return

    // Default: select the home pitcher (so we see the away batting lineup)
    const homePitcher = game.home.probablePitcher
    const awayPitcher = game.away.probablePitcher
    const p = homePitcher ?? awayPitcher

    if (p) {
      setSelectedPitcherId(p.id)
      setSelectedPitcherHand(p.hand ?? "R")
      setSelectedPitcherName(p.fullName)
      setSelectedPitcherTeam(
        homePitcher ? game.home.abbreviation : game.away.abbreviation
      )
    } else {
      setSelectedPitcherId(null)
      setSelectedPitcherName("")
      setSelectedPitcherTeam("")
    }
  }, [selectedGamePk, games])

  // Auto-select all pitch types when arsenal loads
  useEffect(() => {
    if (pitcher?.arsenal && pitcher.arsenal.length > 0 && selectedPitchTypes.length === 0) {
      setSelectedPitchTypes(pitcher.arsenal.map((p) => p.pitchType))
    }
  }, [pitcher?.arsenal, selectedPitchTypes.length])

  function handleGameChange(gamePk: number) {
    setSelectedGamePk(gamePk)
    setSelectedPitcherId(null)
    setSelectedPitcherName("")
    setSelectedPitcherTeam("")
    setSelectedPitchTypes([])
  }

  function handlePitcherSelect(id: number, hand: "L" | "R", name: string, team: string) {
    setSelectedPitcherId(id)
    setSelectedPitcherHand(hand)
    setSelectedPitcherName(name)
    setSelectedPitcherTeam(team)
    setSelectedPitchTypes([]) // Reset so auto-select kicks in
  }

  function handleSeasonChange(yr: number) {
    setSeason(yr)
    // Don't reset pitcher/game selection — just re-fetch with new season
  }

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Date navigator */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="inline-flex items-center rounded-lg border border-border bg-card">
            <button
              onClick={() => setDateOffset((p) => Math.max(p - 1, -7))}
              disabled={dateOffset <= -7}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors rounded-l-lg hover:bg-secondary disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 text-sm font-medium text-foreground min-w-[120px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={() => setDateOffset((p) => Math.min(p + 1, 7))}
              disabled={dateOffset >= 7}
              className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors rounded-r-lg hover:bg-secondary disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {dateOffset !== 0 && (
            <button
              onClick={() => setDateOffset(0)}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left sidebar - Matchup Panel */}
          <aside className="w-full lg:w-80 shrink-0">
            <MatchupPanel
              games={games}
              selectedGamePk={selectedGamePk}
              onGameChange={handleGameChange}
              isLoadingGames={isLoadingSchedule}
              selectedPitcher={pitcher}
              onPitcherSelect={handlePitcherSelect}
              selectedPitchTypes={selectedPitchTypes}
              onPitchTypesChange={setSelectedPitchTypes}
              minUsagePct={minUsagePct}
              onMinUsagePctChange={setMinUsagePct}
              season={season}
              onSeasonChange={handleSeasonChange}
              isLoadingMatchup={isLoadingMatchup}
            />
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    Hitter vs Pitcher
                  </h2>
                  {matchupData && !isLoadingMatchup && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  )}
                  {isLoadingMatchup && (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading
                    </span>
                  )}
                  {season < currentYear && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                      {season} Season
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedPitcherName && battingTeamId ? (
                    <>
                      {battingTeamId.abbr} lineup vs {selectedPitcherName} ({selectedPitcherHand === "R" ? "RHP" : "LHP"}) — {selectedPitcherTeam}
                      {batterHand !== "All" && ` — ${batterHand} only`}
                      {selectedPitchTypes.length > 0 && selectedPitchTypes.length < (pitcher?.arsenal?.length ?? 0) && (
                        <> — {selectedPitchTypes.length} pitch {selectedPitchTypes.length === 1 ? "type" : "types"} selected</>
                      )}
                    </>
                  ) : (
                    "Select a game and pitcher to analyze the batting lineup matchup."
                  )}
                </p>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-4">
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

            {/* Active pitch chips */}
            {selectedPitchTypes.length > 0 && pitcher?.arsenal && pitcher.arsenal.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Active pitches:</span>
                {selectedPitchTypes.map((pt) => {
                  const arsenalPitch = pitcher.arsenal.find((a) => a.pitchType === pt)
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
              matchupStats={matchupRows}
              isLoading={isLoadingMatchup}
            />
          </div>
        </div>
      </main>
    </DashboardShell>
  )
}
