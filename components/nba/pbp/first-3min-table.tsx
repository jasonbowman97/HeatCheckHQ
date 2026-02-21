"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ShareCapture } from "@/components/ui/share-capture"

interface First3MinPlayer {
  athleteId: string
  athleteName: string
  team: string
  avgPoints: number
  hitCount: number
  gamesInWindow: number
  hitRate: number
  recentResults: {
    date: string
    points: number
    hit: boolean
    opponent: string
    isHome: boolean
  }[]
  opponent: string | null
  isHome: boolean
}

interface First3MinTableProps {
  players: First3MinPlayer[]
  threshold: number
  maxRows?: number
  skipRows?: number
}

function hitRateColor(rate: number) {
  if (rate >= 80) return { text: "text-emerald-400", bg: "bg-emerald-400/10" }
  if (rate >= 60) return { text: "text-emerald-300", bg: "bg-emerald-300/10" }
  if (rate >= 40) return { text: "text-amber-400", bg: "bg-amber-400/10" }
  return { text: "text-red-400", bg: "bg-red-400/10" }
}

function SortHeader({
  label,
  column,
  sortColumn,
  sortDir,
  onSort,
  className = "",
}: {
  label: string
  column: string
  sortColumn: string
  sortDir: "asc" | "desc"
  onSort: (col: string) => void
  className?: string
}) {
  const active = sortColumn === column
  return (
    <th
      className={`px-3 py-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-foreground ${
        active ? "text-primary" : "text-muted-foreground"
      } ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active &&
          (sortDir === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          ))}
      </span>
    </th>
  )
}

export function First3MinTable({
  players,
  threshold,
  maxRows,
  skipRows = 0,
}: First3MinTableProps) {
  const [sortColumn, setSortColumn] = useState("avgPoints")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function handleSort(col: string) {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(col)
      setSortDir("desc")
    }
  }

  const sorted = [...players].sort((a, b) => {
    const aVal = (a as unknown as Record<string, number>)[sortColumn] ?? 0
    const bVal = (b as unknown as Record<string, number>)[sortColumn] ?? 0
    return sortDir === "desc" ? bVal - aVal : aVal - bVal
  })

  const displayed = maxRows
    ? sorted.slice(skipRows, skipRows + maxRows)
    : sorted.slice(skipRows)

  return (
    <ShareCapture label={`First 3 Minutes (${threshold}+ pts)`}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10">
                  #
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary min-w-[160px]">
                  Player
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent
                </th>
                <SortHeader
                  label="Avg Pts"
                  column="avgPoints"
                  sortColumn={sortColumn}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right w-16"
                />
                <SortHeader
                  label="Hit Rate"
                  column="hitRate"
                  sortColumn={sortColumn}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-center w-20"
                />
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-16">
                  Games
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((player, i) => {
                const rank = skipRows + i + 1
                const colors = hitRateColor(player.hitRate)

                return (
                  <tr
                    key={player.athleteId}
                    className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                      {rank}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {player.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {player.team}
                          {player.opponent && (
                            <span className="text-amber-400 ml-1">
                              {player.isHome ? "vs" : "@"} {player.opponent}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {player.recentResults.slice(0, 10).map((g, j) => (
                          <div key={j} className="relative group">
                            <div
                              className={`hidden md:flex items-center justify-center w-8 h-7 rounded text-[11px] font-bold border ${
                                g.hit
                                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-400/10 text-red-400/70 border-red-500/15"
                              }`}
                            >
                              {g.points}
                            </div>
                            <div
                              className={`md:hidden w-3.5 h-3.5 rounded-full ${
                                g.hit ? "bg-emerald-400" : "bg-red-400/40"
                              }`}
                              title={`${g.points} pts vs ${g.opponent}`}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm font-bold text-foreground">
                        {player.avgPoints.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}
                      >
                        {player.hitCount}/{player.gamesInWindow}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-xs text-muted-foreground">
                        {player.gamesInWindow}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ShareCapture>
  )
}
