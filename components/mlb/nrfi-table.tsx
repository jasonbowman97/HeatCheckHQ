"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { NrfiPitcher } from "@/lib/nrfi-data"
import { getStreakColor, getRankColor, getNrfiPctColor } from "@/lib/nrfi-data"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useState, useMemo } from "react"

type SortField =
  | "time"
  | "nrfiPct"
  | "streak"
  | "opponentNrfiStreak"
  | "opponentNrfiRank"

type SortDir = "asc" | "desc"

interface NrfiTableProps {
  data: NrfiPitcher[]
}

function SortButton({
  field,
  label,
  activeField,
  activeDir,
  onSort,
}: {
  field: SortField
  label: string
  activeField: SortField | null
  activeDir: SortDir
  onSort: (f: SortField) => void
}) {
  const isActive = activeField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        activeDir === "asc" ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : (
          <ArrowDown className="h-3 w-3 text-primary" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

export function NrfiTable({ data }: NrfiTableProps) {
  const [sortField, setSortField] = useState<SortField | null>("nrfiPct")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      let aVal: number
      let bVal: number

      if (sortField === "time") {
        // Sort by time string converted to comparable value
        const toMinutes = (t: string) => {
          const [time, period] = t.split(" ")
          const [h, m] = time.split(":").map(Number)
          return ((h % 12) + (period === "PM" ? 12 : 0)) * 60 + m
        }
        aVal = toMinutes(a.time)
        bVal = toMinutes(b.time)
      } else {
        aVal = a[sortField]
        bVal = b[sortField]
      }

      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
  }, [data, sortField, sortDir])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <SortButton field="time" label="Time" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Player
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Record
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="nrfiPct" label="NRFI %" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="streak" label="Streak" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                vs
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                Opp Record
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="opponentNrfiStreak" label="Opp Streak" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                <SortButton field="opponentNrfiRank" label="Opp Rank" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((pitcher) => (
              <TableRow
                key={pitcher.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground font-mono tabular-nums">
                    {pitcher.time}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm font-semibold text-foreground">
                    {pitcher.team}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {pitcher.player}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        pitcher.hand === "L"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-sky-500/15 text-sky-400"
                      }`}
                    >
                      {pitcher.hand}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className="text-sm text-muted-foreground font-mono tabular-nums">
                    {pitcher.record}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className={`text-sm font-bold font-mono tabular-nums ${getNrfiPctColor(pitcher.nrfiPct)}`}>
                    {pitcher.nrfiPct}%
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <StreakBadge value={pitcher.streak} />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {pitcher.opponent}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <span className="text-sm text-muted-foreground font-mono tabular-nums">
                    {pitcher.opponentRecord}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-center">
                  <StreakBadge value={pitcher.opponentNrfiStreak} />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <RankBadge value={pitcher.opponentNrfiRank} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StreakBadge({ value }: { value: number }) {
  const colorClass = getStreakColor(value)
  const abs = Math.abs(value)
  if (abs <= 1) {
    return (
      <span className="text-sm font-mono tabular-nums text-muted-foreground">
        {value}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-bold font-mono tabular-nums min-w-[36px] ${colorClass}`}
    >
      {value > 0 ? value : value}
    </span>
  )
}

function RankBadge({ value }: { value: number }) {
  const colorClass = getRankColor(value)
  const display = value < 0 ? Math.abs(value) : value
  const isBold = (value > 0 && value <= 8) || value < 0 || value >= 15
  if (!isBold) {
    return (
      <span className="text-sm font-mono tabular-nums text-muted-foreground">
        {display}
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-bold font-mono tabular-nums min-w-[36px] ${colorClass}`}
    >
      {display}
    </span>
  )
}
