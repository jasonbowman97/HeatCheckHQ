"use client"

import { useState } from "react"
import type { Trend } from "@/lib/trends-types"
import { TrendCard } from "./trend-card"
import { TrendingUp, TrendingDown } from "lucide-react"

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

  const filtered = trends.filter((t) => {
    if (activeFilter !== "all" && t.type !== activeFilter) return false
    if (activeCategory !== "All" && t.category !== activeCategory) return false
    return true
  })

  const hotCount = trends.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false
    return t.type === "hot"
  }).length

  const coldCount = trends.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false
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
        </div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
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

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["All", ...categories].map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground bg-card border border-border hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
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
          <p className="text-sm text-muted-foreground">No trends match the current filters.</p>
        </div>
      )}
    </div>
  )
}
