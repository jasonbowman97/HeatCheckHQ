// ============================================================
// components/convergence-dashboard/sport-tabs.tsx — Sport filter with counts
// ============================================================
// Horizontal sport filter tabs showing prop count per sport.

"use client"

import type { Sport } from "@/types/shared"

interface SportTabsProps {
  selectedSport: Sport | 'all'
  sportCounts: Record<string, number>
  onSelect: (sport: Sport | 'all') => void
}

const SPORTS: Array<{ key: Sport | 'all'; label: string }> = [
  { key: 'all', label: 'All Sports' },
  { key: 'nba', label: 'NBA' },
  { key: 'nfl', label: 'NFL' },
  { key: 'mlb', label: 'MLB' },
]

export function SportTabs({ selectedSport, sportCounts, onSelect }: SportTabsProps) {
  const totalCount = Object.values(sportCounts).reduce((sum, c) => sum + c, 0)

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {SPORTS.map(({ key, label }) => {
        const count = key === 'all' ? totalCount : (sportCounts[key] ?? 0)
        const isActive = selectedSport === key

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`text-[9px] px-1 py-px rounded-full ${
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
