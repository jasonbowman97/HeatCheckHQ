"use client"

import type { PropCheckResult } from "@/types/check-prop"
import { getDefenseQualityLabel } from "@/lib/matchup-service"

interface MatchupContextProps {
  matchup: PropCheckResult["matchup"]
  playerName: string
}

export function MatchupContext({ matchup, playerName }: MatchupContextProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Matchup Context
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Defense Ranking */}
        <ContextCard
          label="Opponent Defense"
          value={`#${matchup.opponentDefRank}`}
          detail={matchup.opponentDefLabel}
          color={matchup.opponentDefRank >= 21 ? "emerald" : matchup.opponentDefRank <= 10 ? "red" : "gray"}
        />

        {/* Venue */}
        <ContextCard
          label="Venue"
          value={matchup.isHome ? "Home" : "Away"}
          detail={matchup.venue}
          color={matchup.isHome ? "emerald" : "gray"}
        />

        {/* Rest */}
        <ContextCard
          label="Rest"
          value={matchup.isBackToBack ? "B2B" : `${matchup.restDays}d rest`}
          detail={matchup.isBackToBack ? "Back-to-back game" : `${matchup.restDays} days since last game`}
          color={matchup.isBackToBack ? "red" : matchup.restDays >= 2 ? "emerald" : "gray"}
        />

        {/* Team Spread */}
        {matchup.teamSpread != null && (
          <ContextCard
            label="Team Spread"
            value={`${matchup.teamSpread > 0 ? '+' : ''}${matchup.teamSpread}`}
            detail={matchup.teamSpread < 0 ? "Favored" : matchup.teamSpread > 0 ? "Underdog" : "Pick 'em"}
            color="gray"
          />
        )}

        {/* Game Total */}
        {matchup.gameTotal != null && (
          <ContextCard
            label="Game Total"
            value={matchup.gameTotal.toString()}
            detail={matchup.teamImpliedTotal ? `Team implied: ${matchup.teamImpliedTotal}` : undefined}
            color="gray"
          />
        )}

        {/* Defense Stats Allowed */}
        <ContextCard
          label="Stats Allowed"
          value={matchup.opponentDefStatsAllowed.toFixed(1)}
          detail={`Avg allowed per game at this position`}
          color={matchup.opponentDefStatsAllowed > 0 ? "gray" : "gray"}
        />

        {/* Opposing Pitcher (MLB) */}
        {matchup.opposingPitcher && (
          <ContextCard
            label="Opposing Pitcher"
            value={matchup.opposingPitcher.name}
            detail={`${matchup.opposingPitcher.hand}HP · ERA: ${matchup.opposingPitcher.era.toFixed(2)} · WHIP: ${matchup.opposingPitcher.whip.toFixed(2)}`}
            color={matchup.opposingPitcher.era > 4.5 ? "emerald" : matchup.opposingPitcher.era < 3.5 ? "red" : "gray"}
          />
        )}

        {/* Weather (MLB) */}
        {matchup.weather && (
          <ContextCard
            label="Weather"
            value={`${matchup.weather.temp}F`}
            detail={`Wind: ${matchup.weather.windSpeed}mph ${matchup.weather.windDirection} · ${matchup.weather.humidity}% humidity`}
            color="gray"
          />
        )}
      </div>

      {/* Injuries */}
      {matchup.injuries.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Injury Watch
          </h4>
          <div className="space-y-2">
            {matchup.injuries.map((inj, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-bold ${
                  inj.status === 'Out' ? 'bg-red-500/15 text-red-400' :
                  inj.status === 'Day-to-Day' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-gray-500/15 text-gray-400'
                }`}>
                  {inj.status}
                </span>
                <span className="font-medium text-foreground">{inj.playerName}</span>
                <span className="text-muted-foreground">({inj.team})</span>
                {inj.relevance && (
                  <span className="text-muted-foreground">· {inj.relevance}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContextCard({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail?: string
  color: "emerald" | "red" | "gray"
}) {
  const borderColor = color === "emerald"
    ? "border-emerald-500/30"
    : color === "red"
    ? "border-red-500/30"
    : "border-border"

  const valueColor = color === "emerald"
    ? "text-emerald-400"
    : color === "red"
    ? "text-red-400"
    : "text-foreground"

  return (
    <div className={`rounded-lg border p-3 ${borderColor}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono ${valueColor}`}>{value}</p>
      {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
    </div>
  )
}
