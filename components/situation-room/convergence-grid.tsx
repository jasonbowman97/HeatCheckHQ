// ============================================================
// components/situation-room/convergence-grid.tsx — Sortable prop grid
// ============================================================
// Displays all convergence props across today's games in a
// sortable, filterable table. Shows score, player, stat, line,
// direction, confidence, and top factors.

"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowUpDown, ChevronDown, Filter, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SituationRoomProp } from "@/types/innovation-playbook"

interface ConvergenceGridProps {
  props: SituationRoomProp[]
}

type SortKey = 'convergenceScore' | 'confidence' | 'playerName' | 'stat'
type SortDir = 'asc' | 'desc'

export function ConvergenceGrid({ props }: ConvergenceGridProps) {
  const [sortKey, setSortKey] = useState<SortKey>('convergenceScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [minScore, setMinScore] = useState(0)
  const [directionFilter, setDirectionFilter] = useState<'all' | 'over' | 'under'>('all')

  const filtered = useMemo(() => {
    let result = [...props]

    // Apply filters
    if (minScore > 0) {
      result = result.filter(p => p.convergenceScore >= minScore)
    }
    if (directionFilter !== 'all') {
      result = result.filter(p => p.direction === directionFilter)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'convergenceScore':
          cmp = a.convergenceScore - b.convergenceScore
          break
        case 'confidence':
          cmp = a.confidence - b.confidence
          break
        case 'playerName':
          cmp = a.playerName.localeCompare(b.playerName)
          break
        case 'stat':
          cmp = a.stat.localeCompare(b.stat)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [props, sortKey, sortDir, minScore, directionFilter])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (props.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No convergence props yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Props will populate as games approach and data is analyzed
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header & Filters */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Convergence Grid
          <span className="text-muted-foreground font-normal ml-1">
            {filtered.length} prop{filtered.length !== 1 ? 's' : ''}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
          >
            <option value={0}>All scores</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
            <option value={6}>6+</option>
          </select>

          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value as 'all' | 'over' | 'under')}
            className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
          >
            <option value="all">All</option>
            <option value="over">Over</option>
            <option value="under">Under</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <SortableHeader label="Score" sortKey="convergenceScore" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Player" sortKey="playerName" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Stat" sortKey="stat" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">Line</th>
              <th className="px-3 py-2 text-left text-muted-foreground font-medium">Dir</th>
              <SortableHeader label="Conf" sortKey="confidence" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left text-muted-foreground font-medium hidden md:table-cell">Top Factors</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((prop, i) => (
              <tr key={`${prop.playerId}-${prop.stat}-${i}`} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5">
                  <ConvergenceBadge score={prop.convergenceScore} />
                </td>
                <td className="px-3 py-2.5">
                  <div>
                    <span className="font-medium text-foreground">{prop.playerName}</span>
                    <span className="text-muted-foreground ml-1.5">{prop.team}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{prop.stat}</td>
                <td className="px-3 py-2.5 font-mono text-foreground">{prop.line}</td>
                <td className="px-3 py-2.5">
                  <span className={`font-semibold ${
                    prop.direction === 'over' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {prop.direction === 'over' ? 'OVER' : 'UNDER'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-semibold ${
                    prop.confidence >= 70 ? 'text-emerald-400' :
                    prop.confidence >= 50 ? 'text-amber-400' :
                    'text-muted-foreground'
                  }`}>
                    {Math.round(prop.confidence)}%
                  </span>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {prop.topFactors.slice(0, 3).map((f, j) => (
                      <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/check?player=${encodeURIComponent(prop.playerName)}&stat=${prop.stat}&line=${prop.line}`}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Check
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && props.length > 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No props match current filters. Try adjusting your criteria.
          </p>
        </div>
      )}
    </div>
  )
}

function SortableHeader({
  label, sortKey, currentKey, dir, onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = currentKey === sortKey
  return (
    <th className="px-3 py-2 text-left">
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 font-medium transition-colors ${
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
        {isActive && (
          <ChevronDown className={`h-3 w-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} />
        )}
      </button>
    </th>
  )
}

function ConvergenceBadge({ score }: { score: number }) {
  const bg = score >= 6
    ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
    : score >= 5
    ? 'bg-amber-500/15 text-amber-400 ring-amber-500/30'
    : score >= 4
    ? 'bg-blue-500/15 text-blue-400 ring-blue-500/30'
    : 'bg-muted text-muted-foreground ring-border'

  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${bg}`}>
      {score}
    </span>
  )
}
