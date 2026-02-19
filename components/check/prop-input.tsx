"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Loader2 } from "lucide-react"
import type { PlayerSearchResult, Sport } from "@/types/shared"
import { statLabels } from "@/lib/design-tokens"

interface PropInputProps {
  onSubmit: (data: { playerId: string; stat: string; line: number }) => void
  isLoading?: boolean
  initialPlayer?: PlayerSearchResult
  initialStat?: string
  initialLine?: number
}

export function PropInput({
  onSubmit,
  isLoading = false,
  initialPlayer,
  initialStat,
  initialLine,
}: PropInputProps) {
  const [query, setQuery] = useState(initialPlayer?.name ?? "")
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(initialPlayer ?? null)
  const [stat, setStat] = useState(initialStat ?? "")
  const [line, setLine] = useState(initialLine?.toString() ?? "")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  const searchPlayers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      const data = await res.json()
      setSuggestions(data.results ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedPlayer(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlayers(value), 200)
    setShowSuggestions(true)
  }

  const handleSelectPlayer = (player: PlayerSearchResult) => {
    setSelectedPlayer(player)
    setQuery(player.name)
    setShowSuggestions(false)
    setStat("")
    setLine("")
  }

  const handleSubmit = () => {
    if (!selectedPlayer || !stat || !line) return
    const lineNum = parseFloat(line)
    if (isNaN(lineNum) || lineNum < 0) return
    onSubmit({ playerId: selectedPlayer.id, stat, line: lineNum })
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Available stats for selected player's sport
  const availableStats = selectedPlayer
    ? Object.entries(statLabels[selectedPlayer.sport] ?? {})
    : []

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Check My Prop</h2>

      <div className="grid gap-4 sm:grid-cols-[1fr_180px_120px_auto]">
        {/* Player Search */}
        <div className="relative" ref={inputRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search player..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-9"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
              {suggestions.map((player) => (
                <button
                  key={player.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleSelectPlayer(player)}
                >
                  {player.headshotUrl ? (
                    <img
                      src={player.headshotUrl}
                      alt={player.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.team.abbrev} · {player.position} · {player.sport.toUpperCase()}
                    </p>
                  </div>
                  {player.hasGameToday && player.todaysOpponent && (
                    <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {player.todaysOpponent}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stat Picker */}
        <Select value={stat} onValueChange={setStat} disabled={!selectedPlayer}>
          <SelectTrigger>
            <SelectValue placeholder="Stat type" />
          </SelectTrigger>
          <SelectContent>
            {availableStats.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line Input */}
        <Input
          type="number"
          step="0.5"
          min="0"
          placeholder="Line"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          disabled={!selectedPlayer || !stat}
          className="font-mono"
        />

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedPlayer || !stat || !line || isLoading}
          className="bg-[#E85D2C] hover:bg-[#d14e20] text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {/* Selected Player Context */}
      {selectedPlayer && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedPlayer.name}</span>
          <span>·</span>
          <span>{selectedPlayer.team.abbrev}</span>
          <span>·</span>
          <span>{selectedPlayer.position}</span>
          {selectedPlayer.hasGameToday && (
            <>
              <span>·</span>
              <span className="text-emerald-400 font-medium">
                {selectedPlayer.todaysOpponent} {selectedPlayer.todaysGameTime && `@ ${selectedPlayer.todaysGameTime}`}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
