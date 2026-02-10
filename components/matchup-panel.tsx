"use client"

import { useState } from "react"
import type { Pitcher, PitchArsenal } from "@/lib/matchup-data"
import { getTodayMatchup, getOpponentPitchers } from "@/lib/matchup-data"
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
import { Info, User } from "lucide-react"

interface MatchupPanelProps {
  selectedPitcher: Pitcher
  onPitcherChange: (pitcher: Pitcher) => void
  selectedPitchTypes: string[]
  onPitchTypesChange: (types: string[]) => void
  minUsagePct: number
  onMinUsagePctChange: (pct: number) => void
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

export function MatchupPanel({
  selectedPitcher,
  onPitcherChange,
  selectedPitchTypes,
  onPitchTypesChange,
  minUsagePct,
  onMinUsagePctChange,
}: MatchupPanelProps) {
  const matchup = getTodayMatchup()
  const availablePitchers = getOpponentPitchers(matchup.opponentAbbr)

  function togglePitch(pitchType: string) {
    if (selectedPitchTypes.includes(pitchType)) {
      // Don't allow deselecting all pitches
      if (selectedPitchTypes.length > 1) {
        onPitchTypesChange(selectedPitchTypes.filter((t) => t !== pitchType))
      }
    } else {
      onPitchTypesChange([...selectedPitchTypes, pitchType])
    }
  }

  function handleSelectAll() {
    onPitchTypesChange(selectedPitcher.arsenal.map((p) => p.pitchType))
  }

  function handleDeselectBelow() {
    const above = selectedPitcher.arsenal
      .filter((p) => p.usagePct >= minUsagePct)
      .map((p) => p.pitchType)
    if (above.length > 0) {
      onPitchTypesChange(above)
    }
  }

  const sortedArsenal = [...selectedPitcher.arsenal].sort(
    (a, b) => b.usagePct - a.usagePct
  )

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
              {"Today's Matchup"}
            </h3>
            <p className="text-xs text-muted-foreground">
              vs {matchup.opponent} · {matchup.gameTime}
            </p>
          </div>
        </div>
      </div>

      {/* Pitcher Selector */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-primary uppercase tracking-wider">
            Probable Pitcher
          </label>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
              selectedPitcher.hand === "R"
                ? "bg-sky-500/15 text-sky-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {selectedPitcher.hand === "R" ? "RHP" : "LHP"}
          </span>
        </div>
        <Select
          value={selectedPitcher.id}
          onValueChange={(id) => {
            const pitcher = availablePitchers.find((p) => p.id === id)
            if (pitcher) onPitcherChange(pitcher)
          }}
        >
          <SelectTrigger className="w-full bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availablePitchers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.hand === "R" ? "RHP" : "LHP"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pitch Arsenal Toggles */}
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
                    Toggle pitch types on/off to include or exclude them from
                    batter stats. Deselect low-usage pitches to avoid skewing
                    the data.
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
                          Below {minUsagePct}% usage threshold - may skew stats
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
    </div>
  )
}
