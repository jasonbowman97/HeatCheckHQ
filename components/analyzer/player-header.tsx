"use client"

import type { Player, Game } from "@/types/shared"
import { getStatLabel } from "@/lib/design-tokens"
import { CORE_STATS } from "@/lib/prop-lines"

interface PlayerHeaderProps {
  player: Player
  nextGame: Game | null
  seasonAverages: Record<string, number>
  gamesPlayed: number
}

export function PlayerHeader({ player, nextGame, seasonAverages, gamesPlayed }: PlayerHeaderProps) {
  const isHome = nextGame ? nextGame.homeTeam.id === player.team.id : false
  const opponent = nextGame
    ? (isHome ? nextGame.awayTeam : nextGame.homeTeam)
    : null

  // Show core stats + minutes as the quick stats bar
  const coreStats = CORE_STATS[player.sport] || []
  const displayStats = [...coreStats]
  if (player.sport === "nba" && !displayStats.includes("minutes")) {
    displayStats.push("minutes")
  }

  // Format game time
  const gameTime = nextGame?.startTime
    ? new Date(nextGame.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {/* Player Photo */}
        {player.headshotUrl ? (
          <img
            src={player.headshotUrl}
            alt={player.name}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground border-2 border-border">
            {player.name.charAt(0)}
          </div>
        )}

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
            {player.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
            {player.team.logo && (
              <img src={player.team.logo} alt={player.team.abbrev} className="h-4 w-4" />
            )}
            <span className="font-medium">{player.team.abbrev}</span>
            <span>·</span>
            <span>{player.position}</span>
            <span>·</span>
            <span>{gamesPlayed} GP</span>
          </div>

          {/* Next Game Info */}
          {nextGame && opponent && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-foreground">
                {isHome ? "vs" : "@"} {opponent.abbrev}
              </span>
              {gameTime && <span>· {gameTime}</span>}
              {nextGame.venue && <span className="hidden sm:inline">· {nextGame.venue}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Season Averages Bar */}
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
        {displayStats.map((stat) => {
          const avg = seasonAverages[stat]
          if (avg === undefined || avg === 0) return null
          return (
            <div
              key={stat}
              className="flex flex-col items-center rounded-lg bg-secondary/50 px-2 py-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {getStatLabel(stat, player.sport).replace(/^(\w+).*/, "$1").slice(0, 6)}
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
