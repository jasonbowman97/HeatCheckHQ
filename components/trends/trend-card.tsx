"use client"

import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import type { Trend } from "@/lib/trends-types"

interface GameLogEntry {
  date: string
  opponent: string
  pts: number
  reb: number
  ast: number
  min: number
  fgm: number
  fga: number
  threepm: number
  threepa: number
  ftm: number
  fta: number
  stl: number
  blk: number
  to: number
}

/** Determine which stat column to highlight based on the trend's threshold or category */
function getHighlightStat(trend: Trend): { key: keyof GameLogEntry; threshold: number } | null {
  if (trend.threshold) {
    const stat = trend.threshold.stat
    const line = trend.threshold.line
    if (stat === "PTS") return { key: "pts", threshold: line }
    if (stat === "REB") return { key: "reb", threshold: line }
    if (stat === "AST") return { key: "ast", threshold: line }
    if (stat === "3PM") return { key: "threepm", threshold: line }
  }
  if (trend.category === "Scoring") return { key: "pts", threshold: 20 }
  if (trend.category === "Rebounds") return { key: "reb", threshold: 10 }
  if (trend.category === "Assists") return { key: "ast", threshold: 8 }
  if (trend.category === "Threes") return { key: "threepm", threshold: 3 }
  return null
}

export function TrendCard({ trend }: { trend: Trend }) {
  const isHot = trend.type === "hot"
  const isConsistency = !!trend.threshold
  const [expanded, setExpanded] = useState(false)
  const [gameLog, setGameLog] = useState<GameLogEntry[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canExpand = !!trend.playerId

  async function handleToggle() {
    if (!canExpand) return
    const next = !expanded
    setExpanded(next)

    if (next && !gameLog) {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/nba/gamelog/${trend.playerId}`)
        if (res.ok) {
          const data = await res.json()
          setGameLog(data.games)
        }
      } catch {
        // Silently fail — game log just won't show
      } finally {
        setIsLoading(false)
      }
    }
  }

  const highlight = getHighlightStat(trend)

  return (
    <div
      className={`relative rounded-xl border bg-card transition-colors ${
        isConsistency
          ? isHot
            ? "border-blue-500/20 hover:border-blue-500/40"
            : "border-orange-500/20 hover:border-orange-500/40"
          : isHot
            ? "border-emerald-500/20 hover:border-emerald-500/40"
            : "border-red-500/20 hover:border-red-500/40"
      }`}
    >
      {/* Clickable card body */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canExpand}
        className={`w-full text-left p-5 ${canExpand ? "cursor-pointer" : "cursor-default"}`}
      >
        {/* Type badge + category + playing today */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isConsistency ? (
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                  isHot
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-orange-400 bg-orange-500/10"
                }`}
              >
                {isHot ? "Over" : "Under"}
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                  isHot
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}
              >
                {isHot ? "Hot" : "Cold"}
              </span>
            )}
            {trend.eliteStreak && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                Elite
              </span>
            )}
            {trend.playingToday && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                Today{trend.opponent ? ` vs ${trend.opponent}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
              isConsistency
                ? "text-blue-400 bg-blue-500/10"
                : "text-muted-foreground bg-secondary"
            }`}>
              {isConsistency ? trend.threshold?.stat : trend.category}
            </span>
            {canExpand && (
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>
        </div>

        {/* Player info */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-foreground">{trend.playerName}</h3>
          <p className="text-xs text-muted-foreground">
            {trend.team} &middot; {trend.position}
          </p>
        </div>

        {/* Threshold line display for consistency trends */}
        {isConsistency && trend.threshold && (
          <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg ${
            isHot ? "bg-blue-500/5 border border-blue-500/10" : "bg-orange-500/5 border border-orange-500/10"
          }`}>
            <span className={`text-xs font-bold ${isHot ? "text-blue-400" : "text-orange-400"}`}>
              {isHot ? "OVER" : "UNDER"} {trend.threshold.line}
            </span>
            <span className="text-[10px] text-muted-foreground">{trend.threshold.stat}</span>
            <span className="ml-auto text-xs font-bold text-foreground">{trend.threshold.hitRate}</span>
          </div>
        )}

        {/* Headline */}
        <p className="text-sm font-semibold text-foreground mb-1">{trend.headline}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{trend.detail}</p>

        {/* Stat + streak */}
        <div className="flex items-end justify-between">
          <div>
            <p
              className={`text-2xl font-bold font-mono tabular-nums ${
                isConsistency
                  ? isHot ? "text-blue-400" : "text-orange-400"
                  : isHot ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {trend.statValue}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {trend.statLabel}
            </p>
            {trend.seasonAvg && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Season avg: <span className="font-semibold text-foreground/70">{trend.seasonAvg}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] text-muted-foreground">{trend.streakLabel}</span>
            <div className="flex gap-1">
              {trend.recentGames.map((hit, i) => (
                <div
                  key={`${trend.id}-game-${i}`}
                  className={`h-2 w-2 rounded-full ${
                    hit
                      ? isConsistency
                        ? isHot ? "bg-blue-400" : "bg-orange-400"
                        : isHot ? "bg-emerald-400" : "bg-red-400"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </button>

      {/* Expandable game log section */}
      {expanded && (
        <div className="border-t border-border px-5 pb-4 pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading game log...</span>
            </div>
          ) : gameLog && gameLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground uppercase tracking-wider">
                    <th className="text-left pb-2 pr-3 font-semibold">Date</th>
                    <th className="text-left pb-2 pr-3 font-semibold">OPP</th>
                    <th className={`text-right pb-2 pr-3 font-semibold ${highlight?.key === "pts" ? "text-primary" : ""}`}>PTS</th>
                    <th className={`text-right pb-2 pr-3 font-semibold ${highlight?.key === "reb" ? "text-primary" : ""}`}>REB</th>
                    <th className={`text-right pb-2 pr-3 font-semibold ${highlight?.key === "ast" ? "text-primary" : ""}`}>AST</th>
                    <th className="text-right pb-2 pr-3 font-semibold">MIN</th>
                    <th className="text-right pb-2 pr-3 font-semibold">FG%</th>
                    <th className={`text-right pb-2 font-semibold ${highlight?.key === "threepm" ? "text-primary" : ""}`}>3PM</th>
                  </tr>
                </thead>
                <tbody>
                  {gameLog.map((g, i) => {
                    const fgPct = g.fga > 0 ? ((g.fgm / g.fga) * 100).toFixed(0) : "-"
                    const dateStr = g.date ? new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"
                    return (
                      <tr key={i} className="border-t border-border/30">
                        <td className="py-1.5 pr-3 text-muted-foreground">{dateStr}</td>
                        <td className="py-1.5 pr-3 font-medium text-foreground">{g.opponent || "-"}</td>
                        <td className={`py-1.5 pr-3 text-right font-mono tabular-nums ${
                          highlight?.key === "pts" && g.pts > (highlight.threshold ?? 0)
                            ? "font-bold text-emerald-400"
                            : "text-foreground"
                        }`}>{g.pts}</td>
                        <td className={`py-1.5 pr-3 text-right font-mono tabular-nums ${
                          highlight?.key === "reb" && g.reb > (highlight.threshold ?? 0)
                            ? "font-bold text-emerald-400"
                            : "text-foreground"
                        }`}>{g.reb}</td>
                        <td className={`py-1.5 pr-3 text-right font-mono tabular-nums ${
                          highlight?.key === "ast" && g.ast > (highlight.threshold ?? 0)
                            ? "font-bold text-emerald-400"
                            : "text-foreground"
                        }`}>{g.ast}</td>
                        <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-muted-foreground">{g.min}</td>
                        <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-muted-foreground">{fgPct}%</td>
                        <td className={`py-1.5 text-right font-mono tabular-nums ${
                          highlight?.key === "threepm" && g.threepm > (highlight.threshold ?? 0)
                            ? "font-bold text-emerald-400"
                            : "text-foreground"
                        }`}>{g.threepm}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">Game log unavailable</p>
          )}
        </div>
      )}
    </div>
  )
}
