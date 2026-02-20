"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Clock, X } from "lucide-react"
import type { PlayerSearchResult } from "@/types/shared"

interface PlayerSearchProps {
  onSelect: (player: PlayerSearchResult) => void
  isAnalyzing?: boolean
}

const RECENT_PLAYERS_KEY = "prop-analyzer-recent"
const MAX_RECENT = 5

function getRecentPlayers(): PlayerSearchResult[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_PLAYERS_KEY) || "[]")
  } catch {
    return []
  }
}

function saveRecentPlayer(player: PlayerSearchResult) {
  const recent = getRecentPlayers().filter(p => p.id !== player.id)
  recent.unshift(player)
  localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export function PlayerSearch({ onSelect, isAnalyzing = false }: PlayerSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlayerSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentPlayers, setRecentPlayers] = useState<PlayerSearchResult[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Load recent players on mount
  useEffect(() => {
    setRecentPlayers(getRecentPlayers())
  }, [])

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
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlayers(value), 200)
    setShowSuggestions(true)
  }

  const handleSelectPlayer = (player: PlayerSearchResult) => {
    saveRecentPlayer(player)
    setRecentPlayers(getRecentPlayers())
    setQuery(player.name)
    setShowSuggestions(false)
    setSuggestions([])
    onSelect(player)
  }

  const handleClear = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Show recent players or search results
  const showRecent = showSuggestions && query.length < 2 && recentPlayers.length > 0
  const showResults = showSuggestions && suggestions.length > 0 && query.length >= 2

  return (
    <div className="w-full" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search any player..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          disabled={isAnalyzing}
          className="h-12 pl-11 pr-10 text-base rounded-xl border-border bg-card placeholder:text-muted-foreground/60"
        />
        {(searchLoading || isAnalyzing) && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
        {query && !searchLoading && !isAnalyzing && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown: Search Results */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-w-lg rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {suggestions.map((player) => (
            <PlayerRow key={player.id} player={player} onClick={() => handleSelectPlayer(player)} />
          ))}
        </div>
      )}

      {/* Dropdown: Recent Players */}
      {showRecent && (
        <div className="absolute z-50 mt-1 w-full max-w-lg rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b border-border/50">
            <Clock className="h-3 w-3" />
            Recent
          </div>
          {recentPlayers.map((player) => (
            <PlayerRow key={player.id} player={player} onClick={() => handleSelectPlayer(player)} />
          ))}
        </div>
      )}

      {/* Recent Player Chips (below search when empty state) */}
      {!showSuggestions && recentPlayers.length > 0 && !query && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Recent:
          </span>
          {recentPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelectPlayer(player)}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {player.headshotUrl ? (
                <img src={player.headshotUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                  {player.name.charAt(0)}
                </span>
              )}
              {player.name}
              <span className="text-muted-foreground">{player.team.abbrev}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerRow({
  player,
  onClick,
}: {
  player: PlayerSearchResult
  onClick: () => void
}) {
  return (
    <button
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors"
      onClick={onClick}
    >
      {player.headshotUrl ? (
        <img
          src={player.headshotUrl}
          alt={player.name}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
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
  )
}
