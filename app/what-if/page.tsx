// ============================================================
// app/what-if/page.tsx — What-If Team Impact Simulator
// ============================================================
// "What if this player doesn't play?" — shows how a player's
// absence changes stat projections for the rest of the team.

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import {
  FlaskConical, Search, Loader2, TrendingUp, TrendingDown,
  Minus, ArrowRight, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Sport, PlayerSearchResult } from "@/types/shared"
import { statLabels } from "@/lib/design-tokens"

interface TeammateImpact {
  id: string
  name: string
  position: string
  headshotUrl: string
  stat: string
  withPlayer: { avg: number; games: number }
  withoutPlayer: { avg: number; games: number }
  delta: number
  deltaPct: number
  direction: "boost" | "drop" | "neutral"
}

interface WhatIfResponse {
  absentPlayer: {
    id: string
    name: string
    team: { abbrev: string; name: string; logo: string }
    position: string
    headshotUrl: string
    sport: Sport
  }
  stat: string
  impacts: TeammateImpact[]
  summary: {
    teamTotalWith: number
    teamTotalWithout: number
    netDelta: number
    teammatesAnalyzed: number
    biggestBeneficiary: string | null
    biggestLoser: string | null
  }
}

export default function WhatIfPage() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null)
  const [stat, setStat] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [result, setResult] = useState<WhatIfResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Player search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setSuggestions(data.results ?? [])
    } catch { setSuggestions([]) }
    finally { setSearchLoading(false) }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedPlayer(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 200)
    setShowSuggestions(true)
  }

  const handleSelectPlayer = (player: PlayerSearchResult) => {
    setSelectedPlayer(player)
    setQuery(player.name)
    setShowSuggestions(false)
    setStat("")
    setResult(null)
    setError(null)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSimulate = useCallback(async () => {
    if (!selectedPlayer || !stat) return
    setSimulating(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          sport: selectedPlayer.sport,
          stat,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error ?? "Simulation failed")
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSimulating(false)
    }
  }, [selectedPlayer, stat])

  const availableStats = selectedPlayer
    ? Object.entries(statLabels[selectedPlayer.sport] ?? {})
    : []

  return (
    <DashboardShell subtitle="Team impact simulator">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            What-If Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            What if this player doesn&apos;t play? See how their absence impacts every teammate&apos;s stats.
          </p>
        </div>

        {/* Input section */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary" />
            Remove a Player From the Lineup
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3">
            {/* Player search */}
            <div className="relative" ref={inputRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search player to sit out..."
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full rounded-lg border border-border bg-background pl-9 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                  {suggestions.map((player) => (
                    <button
                      key={player.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => handleSelectPlayer(player)}
                    >
                      {player.headshotUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.headshotUrl} alt={player.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.team.abbrev} · {player.position} · {player.sport.toUpperCase()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stat picker */}
            <select
              value={stat}
              onChange={e => setStat(e.target.value)}
              disabled={!selectedPlayer}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Select stat</option>
              {availableStats.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <Button
              onClick={handleSimulate}
              disabled={!selectedPlayer || !stat || simulating}
              className="bg-[#E85D2C] hover:bg-[#d14e20] text-white"
            >
              {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate"}
            </Button>
          </div>

          {selectedPlayer && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-red-400">SITTING OUT:</span>
              <span className="font-medium text-foreground">{selectedPlayer.name}</span>
              <span>·</span>
              <span>{selectedPlayer.team.abbrev}</span>
              <span>·</span>
              <span>{selectedPlayer.position}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">
                  Team Impact Without {result.absentPlayer.name}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Teammates Analyzed</p>
                  <p className="text-lg font-bold text-foreground">{result.summary.teammatesAnalyzed}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Team {stat} With</p>
                  <p className="text-lg font-bold text-foreground">{result.summary.teamTotalWith}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Team {stat} Without</p>
                  <p className="text-lg font-bold text-foreground">{result.summary.teamTotalWithout}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Net Change</p>
                  <p className={`text-lg font-bold ${result.summary.netDelta > 0 ? "text-emerald-400" : result.summary.netDelta < 0 ? "text-red-400" : "text-foreground"}`}>
                    {result.summary.netDelta > 0 ? "+" : ""}{result.summary.netDelta}
                  </p>
                </div>
              </div>

              {(result.summary.biggestBeneficiary || result.summary.biggestLoser) && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {result.summary.biggestBeneficiary && (
                    <span>
                      <TrendingUp className="h-3 w-3 inline text-emerald-400 mr-1" />
                      Biggest boost: <span className="text-emerald-400 font-medium">{result.summary.biggestBeneficiary}</span>
                    </span>
                  )}
                  {result.summary.biggestLoser && (
                    <span>
                      <TrendingDown className="h-3 w-3 inline text-red-400 mr-1" />
                      Biggest drop: <span className="text-red-400 font-medium">{result.summary.biggestLoser}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Individual teammate impacts */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground">Teammate-by-Teammate Breakdown</p>
              </div>

              {result.impacts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Not enough game data to compare with/without splits for teammates.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {result.impacts.map(impact => (
                    <div key={impact.id} className="px-4 py-3 flex items-center gap-3">
                      {/* Player info */}
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        {impact.headshotUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={impact.headshotUrl} alt={impact.name} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {impact.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{impact.name}</p>
                          <p className="text-[10px] text-muted-foreground">{impact.position}</p>
                        </div>
                      </div>

                      {/* With → Without visual */}
                      <div className="flex-1 flex items-center gap-2 justify-center">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">With</p>
                          <p className="text-sm font-bold font-mono text-foreground">{impact.withPlayer.avg}</p>
                          <p className="text-[9px] text-muted-foreground">{impact.withPlayer.games}g</p>
                        </div>

                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Without</p>
                          <p className="text-sm font-bold font-mono text-foreground">{impact.withoutPlayer.avg}</p>
                          <p className="text-[9px] text-muted-foreground">{impact.withoutPlayer.games}g</p>
                        </div>
                      </div>

                      {/* Delta */}
                      <div className="w-20 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {impact.direction === "boost" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                          {impact.direction === "drop" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                          {impact.direction === "neutral" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className={`text-sm font-bold font-mono ${
                            impact.direction === "boost" ? "text-emerald-400" :
                            impact.direction === "drop" ? "text-red-400" : "text-muted-foreground"
                          }`}>
                            {impact.delta > 0 ? "+" : ""}{impact.delta}
                          </span>
                        </div>
                        <p className={`text-[10px] ${
                          impact.direction === "boost" ? "text-emerald-400/70" :
                          impact.direction === "drop" ? "text-red-400/70" : "text-muted-foreground"
                        }`}>
                          {impact.deltaPct > 0 ? "+" : ""}{impact.deltaPct}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !simulating && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FlaskConical className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Search for a player, pick a stat, and simulate their absence.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              See which teammates get a boost and who takes a hit when the star sits.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
