"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AggregatedBatterStats } from "@/lib/matchup-data"
import { useMemo, useState } from "react"
import { Loader2, Users, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HeatmapLegend } from "@/components/ui/heatmap-legend"

interface PlayersTableProps {
  matchupStats: AggregatedBatterStats[]
  isLoading?: boolean
}

type SortKey = "name" | "abs" | "avg" | "obp" | "slg" | "ops" | "hr" | "rbi" | "h2hAvg" | "h2hOPS" | "seasonOPS"
type SortDir = "asc" | "desc"

type HeatmapStat = "avg" | "obp" | "slg" | "ops"

const THRESHOLDS: Record<HeatmapStat, { good: number; bad: number }> = {
  avg: { good: 0.270, bad: 0.230 },
  obp: { good: 0.340, bad: 0.300 },
  slg: { good: 0.450, bad: 0.380 },
  ops: { good: 0.780, bad: 0.680 },
}

function getHeatmapColor(value: number, stat: HeatmapStat): string {
  const t = THRESHOLDS[stat]
  if (value >= t.good) return "bg-emerald-500/20 text-emerald-400"
  if (value <= t.bad) return "bg-red-500/20 text-red-400"
  return "" // neutral — no highlight
}

export function PlayersTable({ matchupStats, isLoading }: PlayersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ops")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    const rows = [...matchupStats]
    rows.sort((a, b) => {
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const av = Number(aVal) || 0
      const bv = Number(bVal) || 0
      return sortDir === "asc" ? av - bv : bv - av
    })
    return rows
  }, [matchupStats, sortKey, sortDir])

  // Heatmap uses absolute baseball thresholds — no bounds computation needed

  const SortHeader = ({ label, field, className }: { label: string; field: SortKey; className?: string }) => (
    <TableHead
      className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${className ?? ""}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortKey === field && (
          <span className="text-primary text-[10px]">{sortDir === "desc" ? "▼" : "▲"}</span>
        )}
      </span>
    </TableHead>
  )

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading matchup data...</p>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center flex flex-col items-center gap-3">
        <Users className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No matchup data yet</p>
        <p className="text-xs text-muted-foreground">
          Select a game and pitcher above to see the batter-by-batter breakdown.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex justify-end">
        <HeatmapLegend />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">
                <span className="sr-only">Row</span>
              </TableHead>
              <SortHeader label="Player" field="name" />
              <SortHeader label="ABs" field="abs" className="text-right" />
              <SortHeader label="AVG" field="avg" className="text-center" />
              <SortHeader label="OBP" field="obp" className="text-center" />
              <SortHeader label="SLG" field="slg" className="text-center" />
              <SortHeader label="OPS" field="ops" className="text-center" />
              <SortHeader label="HR" field="hr" className="text-right" />
              <SortHeader label="RBI" field="rbi" className="text-right" />
              {/* H2H columns */}
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center border-l border-border/30 pl-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 cursor-help">
                        vs P AVG
                        <Info className="h-2.5 w-2.5 text-muted-foreground/50" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Career batting average vs this specific pitcher. N/A = no career matchup history.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 cursor-help">
                        vs P OPS
                        <Info className="h-2.5 w-2.5 text-muted-foreground/50" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Career OPS vs this specific pitcher. N/A = no career matchup history.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                vs P AB
              </TableHead>
              {/* Season context */}
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center border-l border-border/30 pl-3">
                SZN OPS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, idx) => {
              const hasData = row.abs > 0
              const hasH2H = row.h2hABs > 0

              return (
                <TableRow
                  key={row.playerId}
                  className="border-b border-border/50 hover:bg-secondary/50 transition-colors group"
                >
                  <TableCell className="py-3 text-center">
                    <span className="text-[10px] font-mono text-muted-foreground/60">{idx + 1}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{row.name}</span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          row.batSide === "S"
                            ? "bg-violet-500/15 text-violet-400"
                            : row.batSide === "L"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        {row.batSide}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{row.position}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-muted-foreground font-mono">{row.abs}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? (getHeatmapColor(row.avg, "avg") || "text-foreground") : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.avg.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? (getHeatmapColor(row.obp, "obp") || "text-foreground") : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.obp.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? (getHeatmapColor(row.slg, "slg") || "text-foreground") : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.slg.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? (getHeatmapColor(row.ops, "ops") || "text-foreground") : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.ops.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-foreground font-mono">{hasData ? row.hr : "-"}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-foreground font-mono">{hasData ? row.rbi : "-"}</span>
                  </TableCell>
                  {/* H2H vs this pitcher */}
                  <TableCell className="py-3 text-center border-l border-border/30 pl-3">
                    <span className={`text-xs font-mono ${hasH2H ? "text-foreground font-semibold" : "text-muted-foreground/30 italic text-[10px]"}`}>
                      {hasH2H ? row.h2hAvg.toFixed(3) : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`text-xs font-mono ${hasH2H ? "text-foreground font-semibold" : "text-muted-foreground/30 italic text-[10px]"}`}>
                      {hasH2H ? row.h2hOPS.toFixed(3) : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`text-[10px] font-mono ${hasH2H ? "text-muted-foreground" : "text-muted-foreground/30 italic"}`}>
                      {hasH2H ? row.h2hABs : "N/A"}
                    </span>
                  </TableCell>
                  {/* Season context */}
                  <TableCell className="py-3 text-center border-l border-border/30 pl-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {row.seasonABs > 0 ? row.seasonOPS.toFixed(3) : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
