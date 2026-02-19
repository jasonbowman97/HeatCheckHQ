// ============================================================
// components/graveyard/autopsy-view.tsx — Detailed autopsy
// ============================================================
// Shows full root cause breakdown, process assessment,
// luck analysis, and lessons learned.

"use client"

import { AlertTriangle, Lightbulb, ThumbsUp, ThumbsDown, Dice5 } from "lucide-react"
import { ProcessGrade } from "./process-grade"
import type { GraveyardEntry } from "@/types/innovation-playbook"

interface AutopsyViewProps {
  entry: GraveyardEntry
}

export function AutopsyView({ entry }: AutopsyViewProps) {
  const { autopsy } = entry

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">
            {entry.playerName} — {entry.direction.toUpperCase()} {entry.line} {entry.stat}
          </p>
          <p className="text-xs text-muted-foreground">
            Actual: {entry.actualValue} &middot; Missed by {Math.abs(entry.margin).toFixed(1)} &middot; {entry.date}
          </p>
        </div>
        <ProcessGrade grade={autopsy.processGrade} size="md" />
      </div>

      <div className="p-4 space-y-4">
        {/* Process Assessment */}
        <div className="rounded-lg border border-border p-3 bg-muted/10">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {autopsy.processAssessment}
          </p>
        </div>

        {/* Root Causes */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            Root Causes
          </p>
          <div className="space-y-2">
            {autopsy.rootCauses.map((cause, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{cause.label}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    cause.severity === 'primary' ? 'bg-red-500/15 text-red-400' :
                    cause.severity === 'contributing' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {cause.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{cause.detail}</p>
                <p className="text-[10px] mt-1">
                  {cause.wasKnowable ? (
                    <span className="text-amber-400">Could have been anticipated</span>
                  ) : (
                    <span className="text-muted-foreground/60">Not knowable before the game</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Luck Analysis */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <Dice5 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Unluck Score</p>
            <p className="text-xl font-bold text-foreground">{autopsy.unluckScore}</p>
            <p className="text-[10px] text-muted-foreground">
              {autopsy.unluckScore >= 70 ? 'Mostly bad luck' :
               autopsy.unluckScore >= 50 ? 'Mixed factors' :
               'Mostly bad process'}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            {autopsy.wouldBetAgain ? (
              <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
            ) : (
              <ThumbsDown className="h-5 w-5 mx-auto mb-1 text-red-400" />
            )}
            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Would Bet Again?</p>
            <p className={`text-xl font-bold ${autopsy.wouldBetAgain ? 'text-emerald-400' : 'text-red-400'}`}>
              {autopsy.wouldBetAgain ? 'Yes' : 'No'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {autopsy.wouldBetAgain ? 'Good process, bad result' : 'Process needs improvement'}
            </p>
          </div>
        </div>

        {/* Lessons Learned */}
        {autopsy.lessonsLearned.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              Lessons Learned
            </p>
            <ul className="space-y-1.5">
              {autopsy.lessonsLearned.map((lesson, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary flex-shrink-0 mt-0.5">&bull;</span>
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
