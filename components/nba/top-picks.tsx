"use client"

import Image from "next/image"
import { Trophy, Share2 } from "lucide-react"
import type { RowData } from "@/components/nba/first-basket-table"

/** Minimum games started to be eligible for Top Picks (filters outliers like 1-game, 100% players) */
const MIN_GAMES_TOP_PICKS = 10

/**
 * Composite score for "tonight's best first basket pick":
 *  - 55% first basket % (the core stat)
 *  - 30% tip win % (team controls the ball)
 *  - 15% team rank bonus (rank 1 = 10, rank 2 = 6, rank 3 = 3, else 0)
 */
function pickScore(row: RowData): number {
  const rankBonus = row.teamRank === 1 ? 10 : row.teamRank === 2 ? 6 : row.teamRank === 3 ? 3 : 0
  return (row.firstBasketPct * 0.55) + (row.tipWinPct * 0.30) + rankBonus
}

export function TopPicks({ rows, maxPicks = 5 }: { rows: RowData[]; maxPicks?: number }) {
  if (rows.length === 0) return null

  const eligible = rows.filter((r) => r.gamesStarted >= MIN_GAMES_TOP_PICKS)
  if (eligible.length === 0) return null

  const topPicks = [...eligible]
    .sort((a, b) => pickScore(b) - pickScore(a))
    .slice(0, maxPicks)

  const gridCols = maxPicks <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-5"

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Tonight{"'"}s Top First Basket Picks</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Ranked by composite score</span>
        <button
          onClick={() => {
            const text = topPicks.slice(0, 3).map((p, i) => `${i + 1}. ${p.name} (${p.team}) — ${p.firstBasketPct.toFixed(1)}% first basket rate`).join("\n")
            const shareText = `Tonight's Top First Basket Picks\n${text}\n\nFull analysis at heatcheckhq.com/nba/first-basket`
            if (navigator.share) {
              navigator.share({ text: shareText }).catch(() => {})
            } else {
              navigator.clipboard.writeText(shareText).catch(() => {})
            }
          }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
          title="Share tonight's picks"
        >
          <Share2 className="h-3 w-3" />
          Share
        </button>
      </div>
      <div className={`grid grid-cols-1 ${gridCols} divide-y sm:divide-y-0 sm:divide-x divide-border/50`}>
        {topPicks.map((pick, i) => {
          return (
            <div key={pick.id} className="px-4 py-3 flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:py-4">
              {/* Rank badge */}
              <div className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                i === 0 ? "bg-primary/20 text-primary" :
                i === 1 ? "bg-amber-500/20 text-amber-400" :
                "bg-secondary text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {/* Player info */}
              <div className="flex items-center gap-2.5 sm:flex-col sm:gap-1.5">
                {pick.image ? (
                  <Image
                    src={pick.image}
                    alt={pick.name}
                    width={48}
                    height={48}
                    className="rounded-full bg-secondary shrink-0 h-11 w-11"
                    unoptimized
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-secondary shrink-0" />
                )}
                <div className="flex flex-col sm:items-center">
                  <span className="text-sm font-semibold text-foreground">{pick.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {pick.team} · {pick.isHome ? "vs" : "@"} {pick.opponent}
                  </span>
                </div>
              </div>
              {/* Key stats */}
              <div className="ml-auto flex items-center gap-3 sm:ml-0 sm:mt-1">
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-primary font-mono tabular-nums">{pick.firstBasketPct.toFixed(1)}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase">1st Bkt</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold font-mono tabular-nums text-foreground">{pick.firstBaskets}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Made</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold font-mono tabular-nums text-foreground">{pick.tipWinPct.toFixed(1)}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Tip</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
