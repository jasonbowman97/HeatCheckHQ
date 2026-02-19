// ============================================================
// components/edge-lab/strategy-card.tsx — Browse card with sparkline
// ============================================================
// Compact card showing strategy name, author, performance,
// sparkline, tags, and social stats.

"use client"

import { ThumbsUp, ThumbsDown, Users, GitFork, MessageSquare } from "lucide-react"
import { getStrategyBadges } from "@/types/community"
import type { PublicStrategy } from "@/types/community"
import Link from "next/link"

interface StrategyCardProps {
  strategy: PublicStrategy
  onVote?: (vote: 1 | -1) => void
}

export function StrategyCard({ strategy, onVote }: StrategyCardProps) {
  const badges = getStrategyBadges(strategy).filter(b => b.earned)
  const hitRate = strategy.livePerformance.games >= 5
    ? Math.round(strategy.livePerformance.hitRate * 100)
    : null
  const roi = strategy.livePerformance.games >= 5
    ? strategy.livePerformance.roi
    : null

  return (
    <Link
      href={`/edge-lab/strategy/${strategy.id}`}
      className="block rounded-xl border border-border bg-card hover:border-primary/30 transition-colors overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{strategy.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              by {strategy.author.displayName}
              {strategy.forkedFrom && (
                <span className="ml-1 text-muted-foreground/60">
                  (forked from {strategy.forkedFrom.authorName})
                </span>
              )}
            </p>
          </div>

          {/* Sport badge */}
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
            {strategy.sport}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {strategy.description}
        </p>
      </div>

      {/* Sparkline + performance */}
      <div className="px-4 py-2 flex items-end gap-3">
        {/* Mini sparkline */}
        {strategy.equitySparkline.length >= 3 && (
          <MiniSparkline data={strategy.equitySparkline} />
        )}

        {/* Performance stats */}
        <div className="flex items-center gap-3 ml-auto text-[10px]">
          {hitRate != null && (
            <div className="text-center">
              <p className="text-muted-foreground uppercase">Hit</p>
              <p className={`font-bold ${hitRate >= 55 ? 'text-emerald-400' : hitRate >= 48 ? 'text-foreground' : 'text-red-400'}`}>
                {hitRate}%
              </p>
            </div>
          )}
          {roi != null && (
            <div className="text-center">
              <p className="text-muted-foreground uppercase">ROI</p>
              <p className={`font-bold ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi > 0 ? '+' : ''}{(roi * 100).toFixed(1)}%
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-muted-foreground uppercase">Games</p>
            <p className="font-bold text-foreground">{strategy.backtest.totalGames}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {badges.map(b => (
            <span
              key={b.type}
              className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400"
              title={b.description}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {strategy.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {strategy.tags.map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Social bar */}
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-3 text-[10px] text-muted-foreground">
        <button
          onClick={(e) => { e.preventDefault(); onVote?.(1) }}
          className={`flex items-center gap-0.5 hover:text-emerald-400 transition-colors ${strategy.userVote === 1 ? 'text-emerald-400' : ''}`}
        >
          <ThumbsUp className="h-3 w-3" />
        </button>
        <span className={`font-semibold ${strategy.voteScore > 0 ? 'text-emerald-400' : strategy.voteScore < 0 ? 'text-red-400' : ''}`}>
          {strategy.voteScore}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); onVote?.(-1) }}
          className={`flex items-center gap-0.5 hover:text-red-400 transition-colors ${strategy.userVote === -1 ? 'text-red-400' : ''}`}
        >
          <ThumbsDown className="h-3 w-3" />
        </button>

        <span className="ml-auto flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {strategy.followerCount}
        </span>
        <span className="flex items-center gap-0.5">
          <GitFork className="h-3 w-3" />
          {strategy.forkCount}
        </span>
        <span className="flex items-center gap-0.5">
          <MessageSquare className="h-3 w-3" />
          {strategy.commentCount}
        </span>
      </div>
    </Link>
  )
}

function MiniSparkline({ data }: { data: Array<{ date: string; value: number }> }) {
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 80
  const h = 24

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  const isPositive = values[values.length - 1] >= values[0]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#34d399' : '#f87171'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
