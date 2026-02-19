// ============================================================
// components/convergence-dashboard/prop-grid.tsx — Sortable prop table
// ============================================================
// Table of highest-convergence props with sorting and filtering.

"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import type { ConvergenceHighlight } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

interface PropGridProps {
  props: (ConvergenceHighlight & { sport: Sport })[]
}

type SortField = 'convergenceScore' | 'playerName' | 'stat' | 'line'
type SortDir = 'asc' | 'desc'

export function PropGrid({ props }: PropGridProps) {
  const [sortField, setSortField] = useState<SortField>('convergenceScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterDirection, setFilterDirection] = useState<'all' | 'over' | 'under'>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'convergenceScore' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    let filtered = filterDirection === 'all'
      ? props
      : props.filter(p => p.direction === filterDirection)

    return [...filtered].sort((a, b) => {
      let compare = 0
      switch (sortField) {
        case 'convergenceScore':
          compare = a.convergenceScore - b.convergenceScore
          break
        case 'playerName':
          compare = a.playerName.localeCompare(b.playerName)
          break
        case 'stat':
          compare = a.stat.localeCompare(b.stat)
          break
        case 'line':
          compare = a.line - b.line
          break
      }
      return sortDir === 'asc' ? compare : -compare
    })
  }, [props, sortField, sortDir, filterDirection])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Filter bar */}
      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          {sorted.length} Prop{sorted.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-1">
          {(['all', 'over', 'under'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDirection(d)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                filterDirection === d
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {d === 'all' ? 'All' : d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <SortHeader field="convergenceScore" label="Conv." current={sortField} dir={sortDir} onSort={handleSort} />
              <SortHeader field="playerName" label="Player" current={sortField} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Dir</th>
              <SortHeader field="line" label="Line" current={sortField} dir={sortDir} onSort={handleSort} />
              <SortHeader field="stat" label="Stat" current={sortField} dir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Sport</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  No props match the current filter.
                </td>
              </tr>
            ) : (
              sorted.map((prop, i) => (
                <tr key={`${prop.playerId}-${prop.stat}-${i}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                      prop.convergenceScore >= 6 ? 'bg-emerald-500/15 text-emerald-400' :
                      prop.convergenceScore >= 5 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {prop.convergenceScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">{prop.playerName}</td>
                  <td className="px-3 py-2">
                    <span className={`flex items-center gap-0.5 ${
                      prop.direction === 'over' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {prop.direction === 'over'
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />
                      }
                      {prop.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground">{prop.line}</td>
                  <td className="px-3 py-2 text-muted-foreground">{prop.stat}</td>
                  <td className="px-3 py-2">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {prop.sport}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {prop.changeFromYesterday != null ? (
                      <span className={`font-medium ${
                        prop.changeFromYesterday > 0 ? 'text-emerald-400' :
                        prop.changeFromYesterday < 0 ? 'text-red-400' :
                        'text-muted-foreground'
                      }`}>
                        {prop.changeFromYesterday > 0 ? '+' : ''}{prop.changeFromYesterday}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortHeader({
  field, label, current, dir, onSort
}: {
  field: SortField
  label: string
  current: SortField
  dir: SortDir
  onSort: (f: SortField) => void
}) {
  const isActive = current === field
  return (
    <th
      className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </span>
    </th>
  )
}
