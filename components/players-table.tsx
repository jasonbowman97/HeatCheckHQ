"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Player } from "@/lib/players-data"
import { getHeatmapColor, players, getGameLogs } from "@/lib/players-data"
import type { AggregatedBatterStats } from "@/lib/matchup-data"
import type { TimeRange } from "@/components/time-range-filter"
import { filterByTimeRange } from "@/components/time-range-filter"
import { ChevronRight } from "lucide-react"
import { useMemo } from "react"

interface PlayersTableProps {
  onSelectPlayer: (player: Player) => void
  matchupStats?: AggregatedBatterStats[]
  useMatchupStats: boolean
  filteredPlayers?: Player[]
  timeRange?: TimeRange
}

function getStatBounds(data: { avg: number; slg: number; exitVelo: number; barrelPct: number; hardHitPct: number; flyBallPct: number }[]) {
  const nonZero = data.filter((d) => d.slg > 0 || d.exitVelo > 0)
  if (nonZero.length === 0) {
    return {
      avg: { min: 0, max: 0.400 },
      slg: { min: 0, max: 1 },
      exitVelo: { min: 70, max: 100 },
      barrelPct: { min: 0, max: 15 },
      hardHitPct: { min: 0, max: 60 },
      flyBallPct: { min: 0, max: 50 },
    }
  }
  const fields = ["avg", "slg", "exitVelo", "barrelPct", "hardHitPct", "flyBallPct"] as const
  const bounds: Record<string, { min: number; max: number }> = {}
  for (const field of fields) {
    const values = nonZero.map((p) => p[field])
    bounds[field] = { min: Math.min(...values), max: Math.max(...values) }
  }
  return bounds
}

type RowData = {
  id: string
  name: string
  position: string
  team: string
  abs: number
  avg: number
  slg: number
  xbh: number
  hr: number
  exitVelo: number
  barrelPct: number
  hardHitPct: number
  flyBallPct: number
  pulledAirPct: number
}

function normalizeRow(row: Player | AggregatedBatterStats): RowData {
  if ("playerId" in row) {
    return {
      id: row.playerId,
      name: row.name,
      position: row.position,
      team: row.team,
      abs: row.abs,
      avg: row.avg,
      slg: row.slg,
      xbh: row.xbh,
      hr: row.hr,
      exitVelo: row.exitVelo,
      barrelPct: row.barrelPct,
      hardHitPct: row.hardHitPct,
      flyBallPct: row.flyBallPct,
      pulledAirPct: row.pulledAirPct,
    }
  }
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    team: row.team,
    abs: row.abs,
    avg: row.avg,
    slg: row.slg,
    xbh: row.xbh,
    hr: row.hr,
    exitVelo: row.exitVelo,
    barrelPct: row.barrelPct,
    hardHitPct: row.hardHitPct,
    flyBallPct: row.flyBallPct,
    pulledAirPct: row.pulledAirPct,
  }
}

export function PlayersTable({ onSelectPlayer, matchupStats, useMatchupStats, filteredPlayers, timeRange }: PlayersTableProps) {
  const showMatchup = useMatchupStats && matchupStats && matchupStats.length > 0
  const basePlayers = filteredPlayers ?? players

  // When not in matchup mode and a time range is applied, recalculate stats from game logs
  const timeFilteredPlayers = useMemo(() => {
    if (showMatchup) return basePlayers
    if (!timeRange || timeRange.preset === "season") return basePlayers

    return basePlayers.map((player) => {
      const allLogs = getGameLogs(player.id)
      const filtered = filterByTimeRange(allLogs, timeRange)
      if (filtered.length === 0) {
        return { ...player, abs: 0, avg: 0, slg: 0, xbh: 0, hr: 0, exitVelo: 0, barrelPct: 0, hardHitPct: 0, flyBallPct: 0, pulledAirPct: 0 }
      }
      // Recalculate aggregate stats from filtered game logs
      const abs = filtered.length
      const hrs = filtered.filter((l) => l.result === "HR").length
      const hits = filtered.filter((l) => ["1B", "2B", "3B", "HR"].includes(l.result))
      const xbh = filtered.filter((l) => ["2B", "3B", "HR"].includes(l.result)).length
      const totalBases = hits.reduce((sum, l) => {
        if (l.result === "1B") return sum + 1
        if (l.result === "2B") return sum + 2
        if (l.result === "3B") return sum + 3
        if (l.result === "HR") return sum + 4
        return sum
      }, 0)
      const battingAvg = abs > 0 ? hits.length / abs : 0
      const slg = abs > 0 ? totalBases / abs : 0
      const avgEv = filtered.reduce((s, l) => s + l.exitVelo, 0) / filtered.length
      const barrels = filtered.filter((l) => l.barrel).length
      const hardHits = filtered.filter((l) => l.hardHit).length
      const barrelPct = (barrels / filtered.length) * 100
      const hardHitPct = (hardHits / filtered.length) * 100

      return {
        ...player,
        abs,
        avg: battingAvg,
        slg,
        xbh,
        hr: hrs,
        exitVelo: avgEv,
        barrelPct,
        hardHitPct,
        flyBallPct: player.flyBallPct,
        pulledAirPct: player.pulledAirPct,
      }
    })
  }, [basePlayers, showMatchup, timeRange])

  const rawData: (Player | AggregatedBatterStats)[] = showMatchup ? matchupStats! : timeFilteredPlayers
  const rows = rawData.map(normalizeRow)

  const bounds = getStatBounds(rows)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">
                <span className="sr-only">View Details</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">ABs</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">AVG</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">SLG</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">XBH</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">HR</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Exit Velo</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Barrel %</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Hard-Hit %</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Fly Ball %</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Pulled-Air %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const originalPlayer = players.find((p) => p.id === row.id)
              const hasData = row.abs > 0

              return (
                <TableRow
                  key={row.id}
                  className="border-b border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors group"
                  onClick={() => {
                    if (originalPlayer) onSelectPlayer(originalPlayer)
                  }}
                >
                  <TableCell className="py-3">
                    <button
                      className="flex items-center justify-center h-7 w-7 rounded-md bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                      aria-label={`View ${row.name} details`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm font-medium text-muted-foreground">{row.team}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{row.name}</span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          row.position === "S"
                            ? "bg-violet-500/15 text-violet-400"
                            : row.position === "L"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        {row.position === "S" ? "S" : row.position === "L" ? "L" : "R"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-muted-foreground font-mono">{row.abs}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? getHeatmapColor(row.avg, bounds.avg.min, bounds.avg.max) : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.avg.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? getHeatmapColor(row.slg, bounds.slg.min, bounds.slg.max) : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.slg.toFixed(3) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-foreground font-mono">{row.xbh}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-foreground font-mono">{row.hr}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? getHeatmapColor(row.exitVelo, bounds.exitVelo.min, bounds.exitVelo.max) : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? row.exitVelo.toFixed(1) : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? getHeatmapColor(row.barrelPct, bounds.barrelPct.min, bounds.barrelPct.max) : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? `${row.barrelPct.toFixed(2)}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${hasData ? getHeatmapColor(row.hardHitPct, bounds.hardHitPct.min, bounds.hardHitPct.max) : "bg-secondary text-muted-foreground"}`}>
                      {hasData ? `${row.hardHitPct.toFixed(2)}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-muted-foreground font-mono">
                      {hasData ? `${row.flyBallPct.toFixed(2)}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm text-muted-foreground font-mono">
                      {hasData ? `${row.pulledAirPct.toFixed(0)}%` : "-"}
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
