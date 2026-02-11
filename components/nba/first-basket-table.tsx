"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getHeatmapClass } from "@/lib/nba-first-basket-data"
import type { BPFirstBasketPlayer, BPTeamTipoff } from "@/lib/bettingpros-scraper"
import { useMemo } from "react"

interface FirstBasketTableProps {
  players: BPFirstBasketPlayer[]
  teamTipoffs: Record<string, BPTeamTipoff>
  gameFilter: string
  sortColumn: string
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
  isLive: boolean
}

interface RowData {
  id: string
  name: string
  team: string
  position: string
  gamesStarted: number
  tipWinPct: number
  firstShotPct: number
  firstBaskets: number
  firstBasketPct: number
  teamRank: number
  teamFirstBaskets: number
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `${rank}th`
}

export function FirstBasketTable({
  players,
  teamTipoffs,
  gameFilter,
  sortColumn,
  sortDirection,
  onSort,
  isLive,
}: FirstBasketTableProps) {
  const rows = useMemo(() => {
    let filtered = players

    if (gameFilter !== "all") {
      const gameTeams = gameFilter.split("-")
      if (gameTeams.length === 2) {
        filtered = players.filter(
          (p) => p.team === gameTeams[0] || p.team === gameTeams[1]
        )
      }
    }

    const mapped: RowData[] = filtered
      .filter((p) => p.gamesStarted > 0)
      .map((p) => {
        const teamTip = teamTipoffs[p.team]
        const tipWinPct = teamTip && teamTip.teamGames > 0
          ? Math.round((teamTip.tipoffWins / teamTip.teamGames) * 1000) / 10
          : 0
        const firstShotPct = p.gamesStarted > 0
          ? Math.round((p.firstShots / p.gamesStarted) * 1000) / 10
          : 0
        const firstBasketPct = p.gamesStarted > 0
          ? Math.round((p.firstBaskets / p.gamesStarted) * 1000) / 10
          : 0

        return {
          id: p.id,
          name: p.name,
          team: p.team,
          position: p.position,
          gamesStarted: p.gamesStarted,
          tipWinPct,
          firstShotPct,
          firstBaskets: p.firstBaskets,
          firstBasketPct,
          teamRank: p.teamRank,
          teamFirstBaskets: teamTip?.firstBaskets ?? 0,
        }
      })

    mapped.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn] as number ?? 0
      const bVal = (b as Record<string, unknown>)[sortColumn] as number ?? 0
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    })

    return mapped
  }, [players, teamTipoffs, gameFilter, sortColumn, sortDirection])

  const bounds = useMemo(() => {
    if (rows.length === 0) return { tipWinPct: { min: 0, max: 100 }, firstShotPct: { min: 0, max: 30 }, firstBasketPct: { min: 0, max: 30 } }
    const tipVals = rows.map((r) => r.tipWinPct)
    const shotVals = rows.map((r) => r.firstShotPct)
    const fbVals = rows.map((r) => r.firstBasketPct)
    return {
      tipWinPct: { min: Math.min(...tipVals), max: Math.max(...tipVals) },
      firstShotPct: { min: Math.min(...shotVals), max: Math.max(...shotVals) },
      firstBasketPct: { min: Math.min(...fbVals), max: Math.max(...fbVals) },
    }
  }, [rows])

  const columns = [
    { key: "player", label: "Player", sortable: false },
    { key: "gamesStarted", label: "Gms Started", sortable: true },
    { key: "tipWinPct", label: "Tip Win %", sortable: true },
    { key: "firstShotPct", label: "1st Shot %", sortable: true },
    { key: "firstBaskets", label: "1st Baskets", sortable: true },
    { key: "firstBasketPct", label: "1st Basket %", sortable: true },
    { key: "teamRank", label: "Team Rank", sortable: true },
    { key: "teamFirstBaskets", label: "Team 1st Baskets", sortable: true },
  ]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {!isLive && rows.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading first basket data...
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.key === "player" ? "text-left" : "text-center"
                  } ${col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortColumn === col.key && (
                      <span className="text-primary text-[10px]">
                        {sortDirection === "desc" ? "\u25BC" : "\u25B2"}
                      </span>
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <TableCell className="py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.team} - {row.position}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-foreground font-mono">{row.gamesStarted}</span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${getHeatmapClass(
                      row.tipWinPct,
                      bounds.tipWinPct.min,
                      bounds.tipWinPct.max
                    )}`}
                  >
                    {row.tipWinPct.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${getHeatmapClass(
                      row.firstShotPct,
                      bounds.firstShotPct.min,
                      bounds.firstShotPct.max
                    )}`}
                  >
                    {row.firstShotPct.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-foreground font-mono">{row.firstBaskets}</span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${getHeatmapClass(
                      row.firstBasketPct,
                      bounds.firstBasketPct.min,
                      bounds.firstBasketPct.max
                    )}`}
                  >
                    {row.firstBasketPct.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${
                      row.teamRank === 1
                        ? "bg-primary/15 text-primary"
                        : row.teamRank === 2
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {getRankSuffix(row.teamRank)}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-muted-foreground font-mono">{row.teamFirstBaskets}</span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && isLive && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No players found for this matchup filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
