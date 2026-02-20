"use client"

import { useState } from "react"
import type { PropSummary } from "@/types/analyzer"
import type { Sport } from "@/types/shared"
import { PropCard } from "./prop-card"
import { ProGate } from "@/components/pro-gate"
import { useUserTier } from "@/components/user-tier-provider"
import { STAT_CATEGORIES, CORE_STATS } from "@/lib/prop-lines"

interface PropGridProps {
  props: PropSummary[]
  sport: Sport
  selectedStat: string | null
  onSelectProp: (stat: string) => void
}

export function PropGrid({ props, sport, selectedStat, onSelectProp }: PropGridProps) {
  const [filter, setFilter] = useState<string>("all")
  const tier = useUserTier()
  const isPro = tier === "pro"

  const categories = STAT_CATEGORIES[sport] || []
  const coreStats = CORE_STATS[sport] || []

  // Filter props by category
  const filteredProps = filter === "all"
    ? props
    : props.filter(p => {
        const category = categories.find(c => c.label === filter)
        return category ? category.stats.includes(p.stat) : true
      })

  // Split into free (core) and pro-only props
  const freeProps = filteredProps.filter(p => coreStats.includes(p.stat))
  const proProps = filteredProps.filter(p => !coreStats.includes(p.stat))

  // Only show category tabs if there are multiple categories
  const showTabs = categories.length > 1

  return (
    <div>
      {/* Category Tabs */}
      {showTabs && (
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            // Only show categories that have props
            const hasProps = props.some(p => cat.stats.includes(p.stat))
            if (!hasProps) return null

            return (
              <button
                key={cat.label}
                onClick={() => setFilter(cat.label)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === cat.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Free Props — always visible */}
      {freeProps.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freeProps.map((prop) => (
            <PropCard
              key={prop.stat}
              prop={prop}
              sport={sport}
              allValues={prop.allValues}
              isSelected={selectedStat === prop.stat}
              onClick={() => onSelectProp(prop.stat)}
            />
          ))}
        </div>
      )}

      {/* Pro Props — visible for Pro, gated for free */}
      {proProps.length > 0 && (
        isPro ? (
          <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${freeProps.length > 0 ? "mt-3" : ""}`}>
            {proProps.map((prop) => (
              <PropCard
                key={prop.stat}
                prop={prop}
                sport={sport}
                allValues={prop.allValues}
                isSelected={selectedStat === prop.stat}
                onClick={() => onSelectProp(prop.stat)}
              />
            ))}
          </div>
        ) : (
          <div className={freeProps.length > 0 ? "mt-3" : ""}>
            <ProGate
              feature="prop_analyzer_full"
              headline="Unlock All Props"
              teaser={`See all ${proProps.length} remaining stat analyses with hit rates, trends, and convergence signals`}
              minHeight="200px"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {proProps.slice(0, 6).map((prop) => (
                  <PropCard
                    key={prop.stat}
                    prop={prop}
                    sport={sport}
                    allValues={prop.allValues}
                    isSelected={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </ProGate>
          </div>
        )
      )}

      {/* Empty state for filtered category */}
      {filteredProps.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No props available in this category
        </div>
      )}
    </div>
  )
}

// ──── Skeleton for loading state ────

export function PropGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative rounded-xl border border-border bg-card overflow-hidden animate-pulse"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted" />
          <div className="pl-4 pr-3 pt-3 pb-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-5 w-12 rounded bg-muted" />
            </div>
            {/* Chart area */}
            <div className="h-10 w-full rounded bg-muted mb-3" />
            {/* Line + split bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-16 rounded bg-muted" />
              <div className="flex-1 h-4 rounded bg-muted" />
            </div>
            {/* Quick stats */}
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
