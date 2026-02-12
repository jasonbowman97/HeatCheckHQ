"use client"

import { useState, useMemo } from "react"
import type { Trend } from "@/lib/trends-types"
import { TrendCard } from "./trend-card"
import { TrendingUp, TrendingDown, ArrowUpDown, Search, CalendarCheck } from "lucide-react"

type SortOption = "streak" | "name"

interface TrendsDashboardProps {
  trends: Trend[]
  categories: string[]
  title: string
  subtitle: string
  isLive?: boolean
}

export function TrendsDashboard({ trends, categories, title, subtitle, isLive }: TrendsDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "hot" | "cold">("all")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [activeTeam, setActiveTeam] = useState<string>("All")
  const [sortBy, setSortBy] = useState<SortOption>("streak")
  const [search, setSearch] = useState("")
  const [playingTodayOnly, setPlayingTodayOnly] = useState(false)

  // Derive unique teams from the data
  const teams = useMemo(() => {
    const set = new Set(trends.map((t) => t.team))
    return Array.from(set).sort()
  }, [trends])

  const playingTodayCount = useMemo(
    () => trends.filter((t) => t.playingToday).length,
    [trends]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let result = trends.filter((t) => {
      if (activeFilter !== "all" && t.type !== activeFilter) return false
      if (activeCategory !== "All" && t.category !== activeCategory) return false
      if (activeTeam !== "All" && t.team !== activeTeam) return false
      if (playingTodayOnly && !t.playingToday) return false
      if (q && !t.playerName.toLowerCase().includes(q) && !t.team.toLowerCase().includes(q)) return false
      return true
    })

    if (sortBy === "streak") {
      result = [...result].sort((a, b) => b.streakLength - a.streakLength)
    } else {
      result = [...result].sort((a, b) => a.playerName.localeCompare(b.playerName))
    }

    return result
  }, [trends, activeFilter, activeCategory, activeTeam, sortBy, search, playingTodayOnly])

  const hotCount = trends.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false
    if (activeTeam !== "All" && t.team !== activeTeam) return false
    if (playingTodayOnly && !t.playingToday) return false
    return t.type === "hot"
  }).length

  const coldCount = trends.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false
    if (activeTeam !== "All" && t.team !== activeTeam) return false
    if (playingTodayOnly && !t.playingToday) return false
    return t.type === "cold"
  }).length

  return (
    <div className="flex flex-col gap-6">
      {/* Title area */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {isLive && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              Live
            </span>
          )}
          {trends.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              {trends.length} streaks found
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Search + Playing Today */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search player or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary w-52"
          />
        </div>

        {/* Playing Today toggle */}
        {playingTodayCount > 0 && (
          <button
            type="button"
            onClick={() => setPlayingTodayOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              playingTodayOnly
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "text-muted-foreground hover:text-foreground border-border bg-card"
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Playing Today ({playingTodayCount})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Hot / Cold toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({hotCount + coldCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("hot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "hot"
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Hot ({hotCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("cold")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "cold"
                ? "bg-red-500/10 text-red-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Cold ({coldCount})
          </button>
        </div>

        {/* Category pills — scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {["All", ...categories].map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground bg-card border border-border hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Team filter */}
        {teams.length > 1 && (
          <select
            value={activeTeam}
            onChange={(e) => setActiveTeam(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        )}

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSortBy((s) => (s === "streak" ? "name" : "streak"))}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "streak" ? "Streak Length" : "Player Name"}
        </button>
      </div>

      {/* Count label */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} trend{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {trends.length === 0
              ? "No active streaks detected. Check back when NBA games are being played."
              : "No trends match the current filters."}
          </p>
        </div>
      )}
    </div>
  )
}
