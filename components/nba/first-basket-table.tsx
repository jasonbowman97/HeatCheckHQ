"use client"

import { useMemo } from "react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown } from "lucide-react"
import { getHeatmapClass } from "@/lib/nba-first-basket-data"
import type { BPFirstBasketPlayer, BPTeamTipoff } from "@/lib/bettingpros-scraper"

interface FirstBasketTableProps {
  players: BPFirstBasketPlayer[]
  teamTipoffs: Record<string, BPTeamTipoff>
  gameFilter: string
  sortColumn: string
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
  isLive: boolean
  /** Map from team abbreviation → { opponent, isHome } */
  matchupMap: Record<string, { opponent: string; isHome: boolean }>
}

export interface RowData {
  id: string
  name: string
  image: string
  team: string
  position: string
  opponent: string
  isHome: boolean
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

function SortHeader({ field, label, activeField, activeDir, onSort }: {
  field: string
  label: string
  activeField: string
  activeDir: "asc" | "desc"
  onSort: (f: string) => void
}) {
  const active = field === activeField
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`} />
      {active && <span className="text-[10px]">{activeDir === "desc" ? "\u25BC" : "\u25B2"}</span>}
    </button>
  )
}

export function buildRows(
  players: BPFirstBasketPlayer[],
  teamTipoffs: Record<string, BPTeamTipoff>,
  matchupMap: Record<string, { opponent: string; isHome: boolean }>,
  gameFilter: string,
): RowData[] {
  let filtered = players

  if (gameFilter !== "all") {
    const gameTeams = gameFilter.split("-")
    if (gameTeams.length === 2) {
      filtered = players.filter(
        (p) => p.team === gameTeams[0] || p.team === gameTeams[1]
      )
    }
  }

  return filtered
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

      const mu = matchupMap[p.team]

      return {
        id: p.id,
        name: p.name,
        image: p.image || "",
        team: p.team,
        position: p.position,
        opponent: mu?.opponent ?? "",
        isHome: mu?.isHome ?? false,
        gamesStarted: p.gamesStarted,
        tipWinPct,
        firstShotPct,
        firstBaskets: p.firstBaskets,
        firstBasketPct,
        teamRank: p.teamRank,
        teamFirstBaskets: teamTip?.firstBaskets ?? 0,
      }
    })
}

export function FirstBasketTable({
  players,
  teamTipoffs,
  gameFilter,
  sortColumn,
  sortDirection,
  onSort,
  isLive,
  matchupMap,
}: FirstBasketTableProps) {
  const rows = useMemo(() => {
    const built = buildRows(players, teamTipoffs, matchupMap, gameFilter)
    built.sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[sortColumn] ?? 0
      const bVal = (b as unknown as Record<string, number>)[sortColumn] ?? 0
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    })
    return built
  }, [players, teamTipoffs, gameFilter, sortColumn, sortDirection, matchupMap])

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
            {/* Group header */}
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2" colSpan={3}>
                Player
              </TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2 border-l border-border" colSpan={3}>
                Season Stats
              </TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2 border-l border-border" colSpan={2}>
                Team
              </TableHead>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="py-3 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[220px]">
                Player
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[70px]">
                <SortHeader field="gamesStarted" label="GP" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[80px]">
                <SortHeader field="tipWinPct" label="Tip %" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[80px] border-l border-border">
                <SortHeader field="firstShotPct" label="1st Shot" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[70px]">
                <SortHeader field="firstBaskets" label="Made" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[90px]">
                <SortHeader field="firstBasketPct" label="1st Bkt %" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[70px] border-l border-border">
                <SortHeader field="teamRank" label="Rank" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center pr-4 w-[60px]">
                <SortHeader field="teamFirstBaskets" label="Total" activeField={sortColumn} activeDir={sortDirection} onSort={onSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow
                  key={row.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  {/* Player cell with headshot + opponent */}
                  <TableCell className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt={row.name}
                          width={32}
                          height={32}
                          className="rounded-full bg-secondary shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary shrink-0" />
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{row.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{row.team} · {row.position}</span>
                          {row.opponent && (
                            <span className={`text-[10px] font-medium ${row.isHome ? "text-emerald-400" : "text-blue-400"}`}>
                              {row.isHome ? "vs" : "@"} {row.opponent}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="text-sm text-foreground font-mono tabular-nums">{row.gamesStarted}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapClass(
                        row.tipWinPct, bounds.tipWinPct.min, bounds.tipWinPct.max
                      )}`}
                    >
                      {row.tipWinPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center border-l border-border/50">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapClass(
                        row.firstShotPct, bounds.firstShotPct.min, bounds.firstShotPct.max
                      )}`}
                    >
                      {row.firstShotPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="text-sm text-foreground font-mono tabular-nums">{row.firstBaskets}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapClass(
                        row.firstBasketPct, bounds.firstBasketPct.min, bounds.firstBasketPct.max
                      )}`}
                    >
                      {row.firstBasketPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  {/* Team context */}
                  <TableCell className="py-3 text-center border-l border-border/50">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${
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
                  <TableCell className="py-3 text-center pr-4">
                    <span className="text-sm text-muted-foreground font-mono tabular-nums">{row.teamFirstBaskets}</span>
                  </TableCell>
                </TableRow>
              )
            })}
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
