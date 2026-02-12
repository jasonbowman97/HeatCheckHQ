"use client"

import Image from "next/image"
import type { NBAGame } from "@/lib/nba-h2h-data"

interface Props {
  games: NBAGame[]
  selectedId: string
  onSelect: (id: string) => void
}

export function H2HMatchupSelector({ games, selectedId, onSelect }: Props) {
  const selected = games.find((g) => g.id === selectedId)!

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Game chips */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {"Today's Games"}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`flex items-center gap-2 shrink-0 rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                game.id === selectedId
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {game.awayLogo && <Image src={game.awayLogo} alt={game.awayTeam} width={16} height={16} className="rounded" unoptimized />}
              {game.awayTeam}
              <span className="text-muted-foreground font-normal">@</span>
              {game.homeTeam}
              {game.homeLogo && <Image src={game.homeLogo} alt={game.homeTeam} width={16} height={16} className="rounded" unoptimized />}
            </button>
          ))}
        </div>
      </div>

      {/* VS Header */}
      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 flex flex-col items-center gap-1">
            {selected.awayLogo && <Image src={selected.awayLogo} alt={selected.awayTeam} width={40} height={40} className="rounded" unoptimized />}
            <p className="text-2xl font-bold text-foreground tracking-tight">{selected.awayTeam}</p>
            <p className="text-xs text-muted-foreground">{selected.awayFull}</p>
          </div>
          <div className="text-center px-6">
            <p className="text-lg font-black text-primary">VS</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{selected.date} · {selected.time}</p>
            <p className="text-[10px] text-muted-foreground">{selected.venue}</p>
          </div>
          <div className="text-center flex-1 flex flex-col items-center gap-1">
            {selected.homeLogo && <Image src={selected.homeLogo} alt={selected.homeTeam} width={40} height={40} className="rounded" unoptimized />}
            <p className="text-2xl font-bold text-foreground tracking-tight">{selected.homeTeam}</p>
            <p className="text-xs text-muted-foreground">{selected.homeFull}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
