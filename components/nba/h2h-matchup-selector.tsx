"use client"

import type { NBAGame } from "@/lib/nba-h2h-data"
import { AlertTriangle } from "lucide-react"

interface Props {
  games: NBAGame[]
  selectedId: string
  onSelect: (id: string) => void
}

export function H2HMatchupSelector({ games, selectedId, onSelect }: Props) {
  const selected = games.find((g) => g.id === selectedId)!

  return (
    <div className="flex flex-col gap-6">
      {/* Game chips */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Select Matchup</h2>
            <p className="text-xs text-muted-foreground">Choose a game to analyze</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`flex items-center gap-3 shrink-0 rounded-lg border px-5 py-3 transition-colors ${
                game.id === selectedId
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span className="text-sm font-bold">{game.awayTeam}</span>
              <span className="text-xs text-muted-foreground">@</span>
              <span className="text-sm font-bold">{game.homeTeam}</span>
              <span className="hidden sm:inline text-[10px] text-muted-foreground ml-1">
                {game.date}, {game.time}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* VS Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">{selected.awayTeam}</p>
            <p className="text-sm text-muted-foreground mt-1">{selected.awayFull}</p>
            {selected.awayInjuries.length > 0 && (
              <p className="text-xs text-amber-400 flex items-center justify-center gap-1 mt-2">
                <AlertTriangle className="h-3 w-3" />
                {selected.awayInjuries.length} key players out
              </p>
            )}
          </div>
          <div className="text-center px-8">
            <p className="text-2xl font-black text-primary">VS</p>
            <p className="text-xs text-muted-foreground mt-1">{selected.date}, {selected.time}</p>
            <p className="text-[10px] text-muted-foreground">{selected.venue}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">{selected.homeTeam}</p>
            <p className="text-sm text-muted-foreground mt-1">{selected.homeFull}</p>
            {selected.homeInjuries.length > 0 && (
              <p className="text-xs text-amber-400 flex items-center justify-center gap-1 mt-2">
                <AlertTriangle className="h-3 w-3" />
                {selected.homeInjuries.length} key players out
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
