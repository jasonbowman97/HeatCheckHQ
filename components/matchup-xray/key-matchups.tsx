// ============================================================
// components/matchup-xray/key-matchups.tsx — Player vs player cards
// ============================================================
// Shows key individual matchups within the game with
// advantage indicators and matchup type badges.

"use client"

import { Swords, ArrowRight } from "lucide-react"
import type { KeyMatchup } from "@/types/innovation-playbook"

interface KeyMatchupsProps {
  matchups: KeyMatchup[]
}

export function KeyMatchups({ matchups }: KeyMatchupsProps) {
  if (matchups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Swords className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No key matchup data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Swords className="h-3.5 w-3.5 text-primary" />
          Key Matchups
        </p>
      </div>

      <div className="divide-y divide-border">
        {matchups.map((matchup, i) => (
          <MatchupCard key={i} matchup={matchup} />
        ))}
      </div>
    </div>
  )
}

function MatchupCard({ matchup }: { matchup: KeyMatchup }) {
  const advantageColor = matchup.advantage === 'playerA' ? 'text-emerald-400' :
    matchup.advantage === 'playerB' ? 'text-red-400' : 'text-muted-foreground'

  const typeLabel = matchup.matchupType === 'offensive_vs_defensive' ? 'Off vs Def' :
    matchup.matchupType === 'pace_mismatch' ? 'Pace Mismatch' : 'Position Battle'

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Player A */}
        <div className="flex-1 text-right">
          <p className={`text-sm font-bold ${matchup.advantage === 'playerA' ? 'text-emerald-400' : 'text-foreground'}`}>
            {matchup.playerA.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {matchup.playerA.team} &middot; {matchup.playerA.position}
          </p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <ArrowRight className={`h-4 w-4 ${advantageColor}`} />
          <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
            {typeLabel}
          </span>
        </div>

        {/* Player B */}
        <div className="flex-1">
          <p className={`text-sm font-bold ${matchup.advantage === 'playerB' ? 'text-emerald-400' : 'text-foreground'}`}>
            {matchup.playerB.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {matchup.playerB.team} &middot; {matchup.playerB.position}
          </p>
        </div>
      </div>

      {matchup.detail && (
        <p className="text-xs text-muted-foreground mt-1.5 text-center">{matchup.detail}</p>
      )}
    </div>
  )
}
