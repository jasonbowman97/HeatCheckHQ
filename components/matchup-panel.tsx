"use client"

import type { PitchArsenal, Pitcher, PitcherSeasonStats, PitcherPlatoonSplit } from "@/lib/matchup-data"
import type { ScheduleGame } from "@/lib/mlb-api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, User, Calendar, Loader2 } from "lucide-react"

type BatterHandFilter = "All" | "LHH" | "RHH"

interface MatchupPanelProps {
  // Game selection
  games: ScheduleGame[]
  selectedGamePk: number | null
  onGameChange: (gamePk: number) => void
  isLoadingGames: boolean

  // Pitcher selection
  selectedPitcher: Pitcher | null
  onPitcherSelect: (pitcherId: number, hand: "L" | "R", name: string, team: string) => void

  // Pitch types
  selectedPitchTypes: string[]
  onPitchTypesChange: (types: string[]) => void
  minUsagePct: number
  onMinUsagePctChange: (pct: number) => void

  // Season
  season: number
  onSeasonChange: (season: number) => void

  // Loading
  isLoadingMatchup: boolean

  // Batter hand context (for platoon display)
  batterHand?: BatterHandFilter
}

function UsageBar({ pct }: { pct: number }) {
  const color =
    pct >= 30
      ? "bg-primary"
      : pct >= 15
        ? "bg-sky-500"
        : pct >= 8
          ? "bg-amber-500"
          : "bg-red-400"
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function PitcherContextCard({ stats }: { stats: PitcherSeasonStats }) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg bg-secondary/50 p-3">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ERA</p>
        <p className="text-sm font-bold font-mono tabular-nums text-foreground">{stats.era.toFixed(2)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">WHIP</p>
        <p className="text-sm font-bold font-mono tabular-nums text-foreground">{stats.whip.toFixed(2)}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">K/9</p>
        <p className="text-sm font-bold font-mono tabular-nums text-foreground">
          {stats.inningsPitched > 0 ? ((stats.strikeOuts / stats.inningsPitched) * 9).toFixed(1) : "0.0"}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">W-L</p>
        <p className="text-sm font-bold font-mono tabular-nums text-foreground">{stats.wins}-{stats.losses}</p>
      </div>
    </div>
  )
}

function PitcherPlatoonCard({
  vsLHB,
  vsRHB,
  batterHand,
}: {
  vsLHB: PitcherPlatoonSplit | null | undefined
  vsRHB: PitcherPlatoonSplit | null | undefined
  batterHand: BatterHandFilter
}) {
  // Determine which splits to show
  const splits: { label: string; data: PitcherPlatoonSplit }[] = []
  if ((batterHand === "All" || batterHand === "LHH") && vsLHB) {
    splits.push({ label: "vs LHB", data: vsLHB })
  }
  if ((batterHand === "All" || batterHand === "RHH") && vsRHB) {
    splits.push({ label: "vs RHB", data: vsRHB })
  }

  if (splits.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-primary uppercase tracking-wider">
        Platoon Splits
      </span>
      {splits.map((s) => (
        <div key={s.label} className="rounded-lg bg-secondary/50 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
            {s.label}
            <span className="text-muted-foreground/50 ml-1.5 normal-case tracking-normal">
              ({s.data.atBats} AB)
            </span>
          </span>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AVG</p>
              <p className={`text-sm font-bold font-mono tabular-nums ${
                s.data.avg >= .300 ? "text-emerald-400" : s.data.avg >= .250 ? "text-foreground" : "text-red-400"
              }`}>
                {s.data.avg.toFixed(3).replace(/^0/, "")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OPS</p>
              <p className={`text-sm font-bold font-mono tabular-nums ${
                s.data.ops >= .800 ? "text-emerald-400" : s.data.ops >= .700 ? "text-foreground" : "text-red-400"
              }`}>
                {s.data.ops.toFixed(3).replace(/^0/, "")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">K/9</p>
              <p className="text-sm font-bold font-mono tabular-nums text-foreground">
                {s.data.strikeoutsPer9.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">WHIP</p>
              <p className="text-sm font-bold font-mono tabular-nums text-foreground">
                {s.data.whip.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Format game time from ISO string to local time */
function formatGameTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  } catch {
    return ""
  }
}

/** Get the two probable starters for a game */
function getGamePitchers(game: ScheduleGame): { id: number; name: string; hand: "L" | "R"; team: string; side: "home" | "away" }[] {
  const pitchers: { id: number; name: string; hand: "L" | "R"; team: string; side: "home" | "away" }[] = []
  if (game.home.probablePitcher) {
    pitchers.push({
      id: game.home.probablePitcher.id,
      name: game.home.probablePitcher.fullName,
      hand: game.home.probablePitcher.hand ?? "R",
      team: game.home.abbreviation,
      side: "home",
    })
  }
  if (game.away.probablePitcher) {
    pitchers.push({
      id: game.away.probablePitcher.id,
      name: game.away.probablePitcher.fullName,
      hand: game.away.probablePitcher.hand ?? "R",
      team: game.away.abbreviation,
      side: "away",
    })
  }
  return pitchers
}

export function MatchupPanel({
  games,
  selectedGamePk,
  onGameChange,
  isLoadingGames,
  selectedPitcher,
  onPitcherSelect,
  selectedPitchTypes,
  onPitchTypesChange,
  minUsagePct,
  onMinUsagePctChange,
  season,
  onSeasonChange,
  isLoadingMatchup,
  batterHand = "All",
}: MatchupPanelProps) {
  const currentYear = new Date().getFullYear()
  const selectedGame = games.find((g) => g.gamePk === selectedGamePk) ?? null
  const gamePitchers = selectedGame ? getGamePitchers(selectedGame) : []

  function togglePitch(pitchType: string) {
    if (selectedPitchTypes.includes(pitchType)) {
      if (selectedPitchTypes.length > 1) {
        onPitchTypesChange(selectedPitchTypes.filter((t) => t !== pitchType))
      }
    } else {
      onPitchTypesChange([...selectedPitchTypes, pitchType])
    }
  }

  function handleSelectAll() {
    if (selectedPitcher?.arsenal) {
      onPitchTypesChange(selectedPitcher.arsenal.map((p) => p.pitchType))
    }
  }

  function handleDeselectBelow() {
    if (!selectedPitcher?.arsenal) return
    const above = selectedPitcher.arsenal
      .filter((p) => p.usagePct >= minUsagePct)
      .map((p) => p.pitchType)
    if (above.length > 0) {
      onPitchTypesChange(above)
    }
  }

  const sortedArsenal = selectedPitcher?.arsenal
    ? [...selectedPitcher.arsenal].sort((a, b) => b.usagePct - a.usagePct)
    : []

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Hitter vs Pitcher
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedGame
                ? `${selectedGame.away.abbreviation} @ ${selectedGame.home.abbreviation} · ${formatGameTime(selectedGame.gameDate)}`
                : "Select a game"}
            </p>
          </div>
        </div>
        {isLoadingMatchup && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Season Selector */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-primary uppercase tracking-wider">
            Season
          </label>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[currentYear, currentYear - 1].map((yr) => (
            <button
              key={yr}
              onClick={() => onSeasonChange(yr)}
              className={`flex-1 px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                season === yr
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
        {season < currentYear && (
          <p className="text-[10px] text-amber-400 mt-1.5">
            Showing prior season data for reference
          </p>
        )}
      </div>

      {/* Game Selector */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-primary uppercase tracking-wider">
            <Calendar className="h-3 w-3 inline mr-1.5" />
            {"Today's Games"}
          </label>
          {isLoadingGames && (
            <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
          )}
        </div>
        {games.length > 0 ? (
          <Select
            value={selectedGamePk ? String(selectedGamePk) : ""}
            onValueChange={(val) => onGameChange(Number(val))}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-foreground">
              <SelectValue placeholder="Select a game..." />
            </SelectTrigger>
            <SelectContent>
              {games.map((g) => (
                <SelectItem key={g.gamePk} value={String(g.gamePk)}>
                  {g.away.abbreviation} @ {g.home.abbreviation} · {formatGameTime(g.gameDate)}
                  {(!g.home.probablePitcher || !g.away.probablePitcher) && " (TBD)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">
            {isLoadingGames ? "Loading schedule..." : "No games scheduled today"}
          </p>
        )}
      </div>

      {/* Pitcher Selector */}
      {selectedGame && (
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-primary uppercase tracking-wider">
              Pitcher to Analyze
            </label>
            {selectedPitcher && (
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  selectedPitcher.hand === "R"
                    ? "bg-sky-500/15 text-sky-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {selectedPitcher.hand === "R" ? "RHP" : "LHP"}
              </span>
            )}
          </div>
          {gamePitchers.length > 0 ? (
            <Select
              value={selectedPitcher ? String(selectedPitcher.id) : ""}
              onValueChange={(val) => {
                const p = gamePitchers.find((gp) => String(gp.id) === val)
                if (p) onPitcherSelect(p.id, p.hand, p.name, p.team)
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select pitcher..." />
              </SelectTrigger>
              <SelectContent>
                {gamePitchers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.hand === "R" ? "RHP" : "LHP"}) — {p.team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">
              No probable starters announced
            </p>
          )}
        </div>
      )}

      {/* Pitcher Context Card */}
      {selectedPitcher?.seasonStats && (
        <div className="border-b border-border px-5 py-4">
          <PitcherContextCard stats={selectedPitcher.seasonStats} />
        </div>
      )}

      {/* Pitcher Platoon Splits */}
      {(selectedPitcher?.vsLHB || selectedPitcher?.vsRHB) && (
        <div className="border-b border-border px-5 py-4">
          <PitcherPlatoonCard
            vsLHB={selectedPitcher.vsLHB}
            vsRHB={selectedPitcher.vsRHB}
            batterHand={batterHand}
          />
        </div>
      )}

      {/* Pitch Arsenal Toggles */}
      {sortedArsenal.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Pitch Arsenal
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[260px]">
                    <p className="text-xs">
                      Overall season pitch mix — toggle types on/off to focus the
                      matchup analysis. Per-pitch splits by batter hand are not
                      available; use the platoon splits above for hand-specific context.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-medium text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
              >
                All
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                onClick={handleDeselectBelow}
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
              >
                {">"}{minUsagePct}% only
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sortedArsenal.map((pitch) => {
              const isSelected = selectedPitchTypes.includes(pitch.pitchType)
              const isBelowThreshold = pitch.usagePct < minUsagePct
              return (
                <div
                  key={pitch.pitchType}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-secondary/80"
                      : "bg-secondary/30 opacity-50"
                  } ${isBelowThreshold && isSelected ? "ring-1 ring-amber-500/30" : ""}`}
                  onClick={() => togglePitch(pitch.pitchType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      togglePitch(pitch.pitchType)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => togglePitch(pitch.pitchType)}
                    className="pointer-events-none"
                    aria-label={`Toggle ${pitch.pitchType}`}
                  />
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {pitch.pitchType}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {pitch.avgVelocity.toFixed(1)} mph
                      </span>
                    </div>
                    <UsageBar pct={pitch.usagePct} />
                  </div>
                  {isBelowThreshold && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 text-amber-400 shrink-0">
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Below {minUsagePct}% usage threshold - low sample
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )
            })}
          </div>

          {/* Min usage threshold slider */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Usage Threshold
              </span>
              <span className="text-xs font-mono text-foreground">
                {minUsagePct}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={minUsagePct}
              onChange={(e) => onMinUsagePctChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-secondary cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Pitches below this threshold are flagged as low-sample
            </p>
          </div>
        </div>
      )}

      {/* Loading state when no arsenal yet */}
      {isLoadingMatchup && sortedArsenal.length === 0 && selectedPitcher && (
        <div className="px-5 py-8 text-center">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Loading pitch arsenal...</p>
        </div>
      )}
    </div>
  )
}
