"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { PitcherStats } from "@/lib/pitching-data"
import { getHeatmapColor, getHeatmapColorInverted } from "@/lib/pitching-data"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"

type SortField =
  | "era" | "whip" | "wins" | "kPer9" | "kPct"
  | "inningsPitched" | "barrelPct" | "hardHitPct"

type SortDir = "asc" | "desc"

interface PitchingTableProps {
  data: PitcherStats[]
  onSelectPitcher: (pitcher: PitcherStats) => void
}

function SortButton({
  field, label, activeField, activeDir, onSort,
}: {
  field: SortField; label: string; activeField: SortField | null; activeDir: SortDir; onSort: (f: SortField) => void
}) {
  const isActive = activeField === field
  return (
    <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      {isActive ? (
        activeDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

function getBounds(data: PitcherStats[], field: keyof PitcherStats) {
  const vals = data.map((p) => p[field] as number).filter((v) => v > 0)
  if (vals.length === 0) return { min: 0, max: 1 }
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

export function PitchingTable({ data, onSelectPitcher }: PitchingTableProps) {
  const [sortField, setSortField] = useState<SortField | null>("era")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // "Lower is better" fields default to ascending sort
  const lowerIsBetter = new Set<SortField>(["era", "whip", "barrelPct", "hardHitPct"])

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir(lowerIsBetter.has(field) ? "asc" : "desc") }
  }

  const sorted = useMemo(() => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortField] as number
      const bVal = b[sortField] as number
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, sortField, sortDir])

  const bounds = useMemo(() => ({
    era: getBounds(data, "era"),
    whip: getBounds(data, "whip"),
    kPer9: getBounds(data, "kPer9"),
    kPct: getBounds(data, "kPct"),
    barrelPct: getBounds(data, "barrelPct"),
    hardHitPct: getBounds(data, "hardHitPct"),
  }), [data])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">
                <span className="sr-only">Details</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pitcher</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="era" label="ERA" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="whip" label="WHIP" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="wins" label="W-L" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="kPer9" label="K/9" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="kPct" label="K%" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="inningsPitched" label="IP" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="barrelPct" label="Barrel%" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="hardHitPct" label="Hard-Hit%" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow
                key={p.id}
                className="border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors group"
                onClick={() => onSelectPitcher(p)}
              >
                <TableCell className="py-3">
                  <button className="flex items-center justify-center h-7 w-7 rounded-md bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors" aria-label={`View ${p.name} arsenal`}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${p.hand === "L" ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"}`}>
                      {p.hand}
                    </span>
                    {p.isTodayStarter && (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-400">
                        Today
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm font-medium text-muted-foreground">{p.team}</span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(p.era, bounds.era.min, bounds.era.max)}`}>
                    {p.era.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(p.whip, bounds.whip.min, bounds.whip.max)}`}>
                    {p.whip.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className="text-sm text-foreground font-mono tabular-nums">
                    {p.wins}-{p.losses}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${getHeatmapColor(p.kPer9, bounds.kPer9.min, bounds.kPer9.max)}`}>
                    {p.kPer9.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${getHeatmapColor(p.kPct, bounds.kPct.min, bounds.kPct.max)}`}>
                    {p.kPct.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className="text-sm text-muted-foreground font-mono tabular-nums">{p.inningsPitched.toFixed(1)}</span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${p.barrelPct > 0 ? getHeatmapColorInverted(p.barrelPct, bounds.barrelPct.min, bounds.barrelPct.max) : "bg-secondary text-muted-foreground"}`}>
                    {p.barrelPct > 0 ? `${p.barrelPct.toFixed(1)}%` : "—"}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono tabular-nums ${p.hardHitPct > 0 ? getHeatmapColorInverted(p.hardHitPct, bounds.hardHitPct.min, bounds.hardHitPct.max) : "bg-secondary text-muted-foreground"}`}>
                    {p.hardHitPct > 0 ? `${p.hardHitPct.toFixed(1)}%` : "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
