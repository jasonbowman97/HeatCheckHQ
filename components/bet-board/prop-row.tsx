// ============================================================
// components/bet-board/prop-row.tsx — Prop with vote buttons
// ============================================================
// Shows a prop with convergence badge, vote buttons, and result.

"use client"

import { ThumbsUp, ThumbsDown, Check, X, Minus } from "lucide-react"
import { getVoteSummary } from "@/lib/bet-board-service"
import type { BetBoardProp } from "@/types/innovation-playbook"

interface PropRowProps {
  prop: BetBoardProp
  currentUserId: string
  isEditor: boolean
  onVote: (propId: string, vote: 'agree' | 'disagree') => void
  onMarkResult: (propId: string, result: 'hit' | 'miss' | 'push', actualValue: number) => void
}

export function PropRow({ prop, currentUserId, isEditor, onVote, onMarkResult }: PropRowProps) {
  const voteSummary = getVoteSummary(prop)
  const userVote = prop.votes.find(v => v.userId === currentUserId)

  const resultStyles = {
    hit: 'bg-emerald-500/15 text-emerald-400',
    miss: 'bg-red-500/15 text-red-400',
    push: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Convergence badge */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
          (prop.convergenceScore ?? 0) >= 6 ? 'bg-emerald-500/15 text-emerald-400' :
          (prop.convergenceScore ?? 0) >= 5 ? 'bg-amber-500/15 text-amber-400' :
          'bg-muted text-muted-foreground'
        }`}>
          {prop.convergenceScore ?? '—'}
        </div>

        {/* Prop info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {prop.playerName}
                <span className="text-muted-foreground ml-1.5">
                  {prop.direction.toUpperCase()} {prop.line} {prop.stat}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                {prop.team} &middot; Added by {prop.addedByName}
              </p>
            </div>

            {/* Result badge */}
            {prop.result && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${resultStyles[prop.result]}`}>
                {prop.result.toUpperCase()} {prop.actualValue != null ? `(${prop.actualValue})` : ''}
              </span>
            )}
          </div>

          {prop.note && (
            <p className="text-xs text-muted-foreground/80 mt-1 italic">&ldquo;{prop.note}&rdquo;</p>
          )}

          {/* Vote buttons + result actions */}
          <div className="flex items-center gap-3 mt-2">
            {/* Vote buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onVote(prop.id, 'agree')}
                className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] transition-all ${
                  userVote?.vote === 'agree'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-muted-foreground hover:text-emerald-400'
                }`}
              >
                <ThumbsUp className="h-3 w-3" />
                {voteSummary.agrees}
              </button>
              <button
                onClick={() => onVote(prop.id, 'disagree')}
                className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] transition-all ${
                  userVote?.vote === 'disagree'
                    ? 'bg-red-500/15 text-red-400'
                    : 'text-muted-foreground hover:text-red-400'
                }`}
              >
                <ThumbsDown className="h-3 w-3" />
                {voteSummary.disagrees}
              </button>
            </div>

            {/* Result actions (editor only, no result yet) */}
            {isEditor && !prop.result && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => onMarkResult(prop.id, 'hit', 0)}
                  className="text-muted-foreground/40 hover:text-emerald-400 transition-colors"
                  title="Mark as Hit"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onMarkResult(prop.id, 'miss', 0)}
                  className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                  title="Mark as Miss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onMarkResult(prop.id, 'push', 0)}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  title="Mark as Push"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
