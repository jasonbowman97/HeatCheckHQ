"use client"

import Image from "next/image"
import { Trophy } from "lucide-react"
import { ShareCapture } from "@/components/ui/share-capture"
import type { RowData } from "@/components/nba/first-basket-table"

/** Minimum games started to be eligible for Top Picks (filters outliers like 1-game, 100% players) */
const MIN_GAMES_TOP_PICKS = 10

/**
 * First Basket Probability:
 *   P(First Basket) = Tip% × 1st Shot% × (Made / Team 1st Buckets)
 *
 * - tipWinPct: Probability the player's team wins the jump (0-100)
 * - firstShotPct: How often this player takes the team's very first shot (0-100)
 * - firstBaskets / teamFirstBaskets: Conversion ratio — how many of the team's
 *   first baskets this player actually scored
 */
function pickScore(row: RowData): number {
  const tipPct = row.tipWinPct / 100
  const firstShotPct = row.firstShotPct / 100
  const madeRatio = row.teamFirstBaskets > 0 ? row.firstBaskets / row.teamFirstBaskets : 0
  return tipPct * firstShotPct * madeRatio
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
    <ShareCapture label="Tonight's Top First Basket Picks">
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Tonight{"'"}s Top First Basket Picks</span>
        <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">Based on tip win %, first shot %, and conversion rate</span>
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
                  <span className="text-xs font-semibold font-mono tabular-nums text-foreground">{pick.firstShotPct.toFixed(1)}%</span>
                  <span className="text-[9px] text-muted-foreground uppercase">1st Shot</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold font-mono tabular-nums text-foreground">{pick.firstBaskets}/{pick.gamesStarted}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Made</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </ShareCapture>
  )
}
