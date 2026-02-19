// ============================================================
// components/graveyard/tombstone-card.tsx — Loss summary card
// ============================================================
// Shows a missed bet with margin, causes, and process grade.

"use client"

import { Skull, Trash2 } from "lucide-react"
import { ProcessGrade } from "./process-grade"
import type { GraveyardEntry } from "@/types/innovation-playbook"

interface TombstoneCardProps {
  entry: GraveyardEntry
  onDelete?: (id: string) => void
  onSelect?: (entry: GraveyardEntry) => void
}

export function TombstoneCard({ entry, onDelete, onSelect }: TombstoneCardProps) {
  const marginAbs = Math.abs(entry.margin)
  const isClose = marginAbs <= 2

  return (
    <div
      className={`rounded-xl border bg-card overflow-hidden transition-all ${
        isClose ? 'border-amber-500/30' : 'border-border'
      } ${onSelect ? 'cursor-pointer hover:border-primary/50' : ''}`}
      onClick={() => onSelect?.(entry)}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Tombstone icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Skull className={`h-5 w-5 ${isClose ? 'text-amber-400' : 'text-red-400'}`} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground">
                {entry.playerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.direction.toUpperCase()} {entry.line} {entry.stat} &middot; Actual: {entry.actualValue}
              </p>
            </div>
            <ProcessGrade grade={entry.autopsy.processGrade} />
          </div>

          {/* Margin */}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className={`font-bold ${isClose ? 'text-amber-400' : 'text-red-400'}`}>
              Missed by {marginAbs.toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              Convergence: {entry.convergenceAtTimeOfBet}/7
            </span>
            <span className="text-muted-foreground">
              {entry.sport.toUpperCase()}
            </span>
          </div>

          {/* Primary cause */}
          {entry.autopsy.rootCauses.length > 0 && (
            <p className="text-xs text-muted-foreground/80 mt-1.5">
              {entry.autopsy.rootCauses[0].label}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2">
            {entry.autopsy.wasUnlucky && (
              <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded ring-1 ring-amber-500/30 font-semibold">
                UNLUCKY
              </span>
            )}
            {entry.autopsy.wouldBetAgain && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded ring-1 ring-emerald-500/30 font-semibold">
                WOULD BET AGAIN
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 ml-auto">
              {entry.date}
            </span>
          </div>
        </div>

        {/* Delete */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
            className="flex-shrink-0 text-muted-foreground/40 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
