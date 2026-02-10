"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type NBAPlayer,
  type FirstBasketStats,
  type TimeFrame,
  nbaPlayers,
  getFirstBasketStats,
  getHeatmapClass,
} from "@/lib/nba-first-basket-data"
import { useMemo } from "react"

interface FirstBasketTableProps {
  timeFrame: TimeFrame
  gameFilter: string // "all" or a game id
  sortColumn: string
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
}

type MergedRow = NBAPlayer & FirstBasketStats

function getRankSuffix(rank: number): string {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `${rank}th`
}

export function FirstBasketTable({
  timeFrame,
  gameFilter,
  sortColumn,
  sortDirection,
  onSort,
}: FirstBasketTableProps) {
  const rows = useMemo(() => {
    let filtered = nbaPlayers
    if (gameFilter !== "all") {
      // Filter by specific game - match by team
      const gameTeams = gameFilter.split("-")
      if (gameTeams.length === 2) {
        filtered = nbaPlayers.filter(
          (p) => p.team === gameTeams[0] || p.team === gameTeams[1]
        )
      }
    }

    const merged: MergedRow[] = filtered
      .map((player) => {
        const stats = getFirstBasketStats(timeFrame, player.id)
        if (!stats) return null
        return { ...player, ...stats }
      })
      .filter((r): r is MergedRow => r !== null)

    // Sort
    merged.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sortColumn) {
        case "gamesStarted": aVal = a.gamesStarted; bVal = b.gamesStarted; break
        case "tipWinPct": aVal = a.tipWinPct; bVal = b.tipWinPct; break
        case "firstShotPct": aVal = a.firstShotPct; bVal = b.firstShotPct; break
        case "firstBasketsMade": aVal = a.firstBasketsMade; bVal = b.firstBasketsMade; break
        case "firstBasketPerGmPct": aVal = a.firstBasketPerGmPct; bVal = b.firstBasketPerGmPct; break
        case "firstBasketRank": aVal = a.firstBasketRank; bVal = b.firstBasketRank; break
        case "teamFirstBaskets": aVal = a.teamFirstBaskets; bVal = b.teamFirstBaskets; break
        default: aVal = a.firstBasketPerGmPct; bVal = b.firstBasketPerGmPct; break
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    })

    return merged
  }, [timeFrame, gameFilter, sortColumn, sortDirection])

  // Bounds for heatmap columns
  const bounds = useMemo(() => {
    if (rows.length === 0) return { tipWinPct: { min: 0, max: 100 }, firstShotPct: { min: 0, max: 30 }, firstBasketPerGmPct: { min: 0, max: 30 } }
    const tipVals = rows.map((r) => r.tipWinPct)
    const shotVals = rows.map((r) => r.firstShotPct)
    const fbVals = rows.map((r) => r.firstBasketPerGmPct)
    return {
      tipWinPct: { min: Math.min(...tipVals), max: Math.max(...tipVals) },
      firstShotPct: { min: Math.min(...shotVals), max: Math.max(...shotVals) },
      firstBasketPerGmPct: { min: Math.min(...fbVals), max: Math.max(...fbVals) },
    }
  }, [rows])

  const columns = [
    { key: "player", label: "Player", sortable: false },
    { key: "matchup", label: "Matchup", sortable: false },
    { key: "gamesStarted", label: "Gms Started", sortable: true },
    { key: "tipWinPct", label: "Tip Win %", sortable: true },
    { key: "firstShotPct", label: "1st Shot %", sortable: true },
    { key: "firstBasketsMade", label: "1st Baskets Made", sortable: true },
    { key: "firstBasketPerGmPct", label: "1st Basket / Gms", sortable: true },
    { key: "firstBasketRank", label: "1st Basket Rank", sortable: true },
    { key: "teamFirstBaskets", label: "Team 1st Baskets", sortable: true },
  ]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.key === "player" ? "text-left" : col.key === "matchup" ? "text-center" : "text-center"
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
                {/* Player */}
                <TableCell className="py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.team} - {row.position}
                    </span>
                  </div>
                </TableCell>
                {/* Matchup */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-muted-foreground">{row.matchup}</span>
                </TableCell>
                {/* Games Started */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-foreground font-mono">{row.gamesStarted}</span>
                </TableCell>
                {/* Tip Win % */}
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
                {/* 1st Shot % */}
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
                {/* 1st Baskets Made */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-foreground font-mono">{row.firstBasketsMade}</span>
                </TableCell>
                {/* 1st Basket / Gms */}
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold font-mono ${getHeatmapClass(
                      row.firstBasketPerGmPct,
                      bounds.firstBasketPerGmPct.min,
                      bounds.firstBasketPerGmPct.max
                    )}`}
                  >
                    {row.firstBasketPerGmPct.toFixed(1)}%
                  </span>
                </TableCell>
                {/* 1st Basket Rank */}
                <TableCell className="py-3.5 text-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold ${
                      row.firstBasketRank === 1
                        ? "bg-primary/15 text-primary"
                        : row.firstBasketRank === 2
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {getRankSuffix(row.firstBasketRank)}
                  </span>
                </TableCell>
                {/* Team 1st Baskets */}
                <TableCell className="py-3.5 text-center">
                  <span className="text-sm text-muted-foreground font-mono">{row.teamFirstBaskets}</span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
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
