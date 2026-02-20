"use client"

import { CheckCircle2, XCircle, MinusCircle } from "lucide-react"

interface VerdictCardProps {
  verdict: {
    direction: "over" | "under" | "toss-up"
    confidence: number
    label: string
    sublabel: string
    hitRateL10: number
    seasonAvg: number
  }
  stat: string
  line: number
}

export function VerdictCard({ verdict, stat, line }: VerdictCardProps) {
  const isOver = verdict.direction === "over"
  const isUnder = verdict.direction === "under"

  const bgClass = isOver
    ? "border-emerald-500/30 bg-emerald-500/5"
    : isUnder
      ? "border-red-500/30 bg-red-500/5"
      : "border-yellow-500/30 bg-yellow-500/5"

  const iconColor = isOver
    ? "text-emerald-400"
    : isUnder
      ? "text-red-400"
      : "text-yellow-400"

  const Icon = isOver ? CheckCircle2 : isUnder ? XCircle : MinusCircle

  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 ${iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold ${iconColor}`}>
              {verdict.label}
            </span>
            <span className="rounded-full bg-background/50 px-2 py-0.5 text-[10px] font-bold text-foreground tabular-nums">
              {verdict.confidence}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stat} {isOver ? "Over" : isUnder ? "Under" : "at"} {line} · Avg: {verdict.seasonAvg.toFixed(1)} · L10 hit: {Math.round(verdict.hitRateL10 * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}
