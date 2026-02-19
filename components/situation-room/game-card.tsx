// ============================================================
// components/situation-room/game-card.tsx — Game overview card
// ============================================================
// Displays a single game with team logos, spread, total,
// game time/status, and top convergence props for each team.

"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, TrendingUp, Zap } from "lucide-react"
import type { SituationRoomGame } from "@/types/innovation-playbook"

interface GameCardProps {
  game: SituationRoomGame
}

export function GameCard({ game }: GameCardProps) {
  const { game: g, topProps } = game
  const isLive = g.status === 'live'
  const isFinal = g.status === 'final'

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Game header */}
      <div className={`px-4 py-2.5 flex items-center justify-between text-xs ${
        isLive ? 'bg-emerald-500/10 border-b border-emerald-500/20' :
        isFinal ? 'bg-muted/50 border-b border-border' :
        'bg-muted/30 border-b border-border'
      }`}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : isFinal ? (
            <span className="text-muted-foreground font-medium">FINAL</span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatGameTime(g.date)}
            </span>
          )}
          {g.broadcast && (
            <span className="text-muted-foreground/60">{g.broadcast}</span>
          )}
        </div>
        <span className="text-muted-foreground truncate max-w-[140px]">{g.venue}</span>
      </div>

      {/* Teams matchup */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Away team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {g.awayTeam.logo && (
              <Image
                src={g.awayTeam.logo}
                alt={g.awayTeam.abbrev}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{g.awayTeam.name}</p>
              <p className="text-xs text-muted-foreground">{g.awayTeam.abbrev}</p>
            </div>
          </div>

          {/* Odds */}
          <div className="text-center flex-shrink-0 px-3">
            <p className="text-xs text-muted-foreground">@</p>
            {(g.spread != null || g.total != null) && (
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                {g.spread != null && <span>Spread {g.spread > 0 ? '+' : ''}{g.spread}</span>}
                {g.total != null && <span>O/U {g.total}</span>}
              </div>
            )}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{g.homeTeam.name}</p>
              <p className="text-xs text-muted-foreground">{g.homeTeam.abbrev}</p>
            </div>
            {g.homeTeam.logo && (
              <Image
                src={g.homeTeam.logo}
                alt={g.homeTeam.abbrev}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Props */}
      {topProps.length > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Top Convergence Props
          </p>
          <div className="space-y-1.5">
            {topProps.slice(0, 3).map((prop, i) => (
              <Link
                key={`${prop.playerId}-${prop.stat}-${i}`}
                href={`/check?player=${encodeURIComponent(prop.playerName)}&stat=${prop.stat}&line=${prop.line}`}
                className="flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ConvergenceBadge score={prop.convergenceScore} />
                  <span className="text-foreground font-medium truncate">{prop.playerName}</span>
                  <span className="text-muted-foreground">
                    {prop.stat} {prop.direction === 'over' ? 'O' : 'U'} {prop.line}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-semibold ${
                    prop.confidence >= 70 ? 'text-emerald-400' :
                    prop.confidence >= 50 ? 'text-amber-400' :
                    'text-muted-foreground'
                  }`}>
                    {Math.round(prop.confidence)}%
                  </span>
                  <Zap className="h-3 w-3 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ConvergenceBadge({ score }: { score: number }) {
  const bg = score >= 6
    ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
    : score >= 5
    ? 'bg-amber-500/15 text-amber-400 ring-amber-500/30'
    : 'bg-muted text-muted-foreground ring-border'

  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${bg}`}>
      {score}
    </span>
  )
}

function formatGameTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }) + ' ET'
  } catch {
    return ''
  }
}
