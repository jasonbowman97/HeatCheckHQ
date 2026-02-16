"use client"

import { hitRateColorClass, type FilteredPlayerRow } from "@/lib/streak-filter"
import type { WindowSize } from "@/lib/streak-types"

interface StreakTableProps {
  rows: FilteredPlayerRow[]
  threshold: number
  statLabel: string
  window: WindowSize
  startRank?: number
}

export function StreakTable({
  rows,
  threshold,
  statLabel,
  window,
  startRank = 1,
}: StreakTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Scrollable wrapper for the table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          {/* Header */}
          <thead>
            <tr className="border-b border-border bg-card/80">
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary w-10">
                #
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary min-w-[160px]">
                Player
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                <span className="hidden md:inline">Last {window} Games</span>
                <span className="md:hidden">Recent</span>
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-20">
                Hit Rate
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-16 hidden sm:table-cell">
                Streak
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-right w-16">
                Avg
              </th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-right w-16 hidden sm:table-cell">
                Szn
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const rank = startRank + i
              const colors = hitRateColorClass(row.hitRate)

              return (
                <tr
                  key={`${row.player.id}-${i}`}
                  className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  {/* Rank */}
                  <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                    {rank}
                  </td>

                  {/* Player */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://a.espncdn.com/i/teamlogos/nba/500/${row.player.team.toLowerCase()}.png`}
                        alt={row.player.team}
                        width={22}
                        height={22}
                        className="rounded flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {row.player.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {row.player.team}
                          {row.player.opponent && (
                            <span className="text-amber-400 ml-1">
                              vs {row.player.opponent}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Game stat boxes */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {row.statValues.map((val, j) => {
                        const hit = row.hitGames[j]
                        return (
                          <div
                            key={j}
                            className="relative group"
                          >
                            {/* Desktop: show stat value */}
                            <div
                              className={`hidden md:flex items-center justify-center w-9 h-7 rounded text-[11px] font-bold border ${
                                hit
                                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-400/10 text-red-400/70 border-red-500/15"
                              }`}
                            >
                              {val}
                            </div>
                            {/* Mobile: show dot */}
                            <div
                              className={`md:hidden w-3.5 h-3.5 rounded-full ${
                                hit ? "bg-emerald-400" : "bg-red-400/40"
                              }`}
                              title={`${val} ${statLabel}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </td>

                  {/* Hit rate badge */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}
                    >
                      {row.hitCount}/{row.windowGames.length}
                    </span>
                  </td>

                  {/* Consecutive streak */}
                  <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                    {row.consecutiveStreak > 0 ? (
                      <span className="text-xs font-bold text-emerald-400">
                        {row.consecutiveStreak}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Window avg */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-sm font-bold text-foreground">
                      {row.windowAvg.toFixed(1)}
                    </span>
                  </td>

                  {/* Season avg */}
                  <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                    <span className="text-xs font-medium text-muted-foreground">
                      {row.seasonAvg.toFixed(1)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
