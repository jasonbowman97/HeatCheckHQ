"use client"

import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import { DashboardShell } from "@/components/dashboard-shell"
import { TeamStatsComparison } from "@/components/nfl/team-stats-comparison"
import { PassingSection, RushingSection, ReceivingSection } from "@/components/nfl/positional-tables"
import { getAllMatchups, type NFLMatchup } from "@/lib/nfl-matchup-data"
import type { LiveMatchup } from "@/lib/nfl-api"
import Image from "next/image"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/* ------------------------------------------------------------------ */
/*  Convert live ESPN data → existing component shapes                 */
/* ------------------------------------------------------------------ */

function liveToMatchup(live: LiveMatchup): NFLMatchup {
  function buildPassers(team: LiveMatchup["awayTeam"]) {
    return team.passers.map((p) => {
      const gp = p.gamesPlayed || 1
      return {
        name: p.name,
        position: p.position || "QB",
        yardsPerGame: Math.round(((p.passing?.yards ?? 0) / gp) * 10) / 10,
        tdsPerGame: Math.round(((p.passing?.touchdowns ?? 0) / gp) * 10) / 10,
        gameLogs: [] as { yards: number; secondary: number }[],
      }
    })
  }

  function buildRushers(team: LiveMatchup["awayTeam"]) {
    return team.rushers.map((p) => {
      const gp = p.gamesPlayed || 1
      return {
        name: p.name,
        position: p.position || "RB",
        yardsPerGame: Math.round(((p.rushing?.yards ?? 0) / gp) * 10) / 10,
        attemptsPerGame: Math.round(((p.rushing?.attempts ?? 0) / gp) * 10) / 10,
        gameLogs: [] as { yards: number; secondary: number }[],
      }
    })
  }

  function buildReceivers(team: LiveMatchup["awayTeam"]) {
    return team.receivers.map((p) => {
      const gp = p.gamesPlayed || 1
      return {
        name: p.name,
        position: p.position || "WR",
        yardsPerGame: Math.round(((p.receiving?.yards ?? 0) / gp) * 10) / 10,
        targetsPerGame: Math.round(((p.receiving?.targets ?? 0) / gp) * 10) / 10,
        gameLogs: [] as { yards: number; secondary: number }[],
      }
    })
  }

  const fallbackStats = {
    pointsScored: 0, pointsScoredRank: 0,
    pointsAllowed: 0, pointsAllowedRank: 0,
    passYards: 0, passYardsRank: 0,
    passYardsAllowed: 0, passYardsAllowedRank: 0,
    rushingYards: 0, rushingYardsRank: 0,
    rushingYardsAllowed: 0, rushingYardsAllowedRank: 0,
  }

  return {
    id: live.gameId,
    dateTime: "Current Season",
    week: live.week,
    away: {
      name: live.awayTeam.name,
      abbreviation: live.awayTeam.abbreviation,
      spread: "--",
      stats: live.awayTeam.teamStats ?? fallbackStats,
      passing: buildPassers(live.awayTeam),
      rushing: buildRushers(live.awayTeam),
      receiving: buildReceivers(live.awayTeam),
    },
    home: {
      name: live.homeTeam.name,
      abbreviation: live.homeTeam.abbreviation,
      spread: "--",
      stats: live.homeTeam.teamStats ?? fallbackStats,
      passing: buildPassers(live.homeTeam),
      rushing: buildRushers(live.homeTeam),
      receiving: buildReceivers(live.homeTeam),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Game selector chip data                                            */
/* ------------------------------------------------------------------ */

interface GameOption {
  id: string
  away: string
  awayFull: string
  awayLogo?: string
  home: string
  homeFull: string
  homeLogo?: string
  week: string
  venue: string
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function NFLMatchupPage() {
  const staticMatchups = getAllMatchups()

  // Fetch live schedule
  const { data: scheduleData, isLoading: scheduleLoading } = useSWR<{ games: GameOption[] }>(
    "/api/nfl/schedule",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const liveGames = useMemo<GameOption[]>(() => scheduleData?.games ?? [], [scheduleData])
  const hasLiveGames = liveGames.length > 0

  // Selected game ID — default to first live game when available
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedStaticIdx, setSelectedStaticIdx] = useState(0)
  const effectiveGameId = selectedGameId ?? (hasLiveGames ? liveGames[0].id : null)

  // Fetch matchup data for selected game
  const matchupUrl = effectiveGameId ? `/api/nfl/matchup?gameId=${effectiveGameId}` : null
  const { data: matchupData, isLoading: matchupLoading } = useSWR<{ matchup: LiveMatchup | null }>(
    hasLiveGames ? matchupUrl : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  // Determine which matchup to display
  const liveMatchup = matchupData?.matchup ? liveToMatchup(matchupData.matchup) : null
  const isLive = !!liveMatchup
  const displayMatchup = liveMatchup ?? staticMatchups[selectedStaticIdx]

  const selectGame = useCallback((gameId: string) => {
    setSelectedGameId(gameId)
  }, [])

  return (
    <DashboardShell>

      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Game Selector */}
        <div className="flex flex-col gap-4">
          {/* Live games */}
          {hasLiveGames && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 mr-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                  Live
                </span>
                {liveGames[0]?.week && (
                  <span className="text-xs text-muted-foreground">{liveGames[0].week}</span>
                )}
              </div>
              {liveGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectGame(g.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    effectiveGameId === g.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {g.awayLogo && <Image src={g.awayLogo} alt={g.away} width={16} height={16} className="rounded" />}
                  {g.away} @ {g.home}
                  {g.homeLogo && <Image src={g.homeLogo} alt={g.home} width={16} height={16} className="rounded" />}
                </button>
              ))}
            </div>
          )}

          {/* Static fallback selector (only if no live games) */}
          {!hasLiveGames && !scheduleLoading && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mr-1">Games</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                Sample Data
              </span>
              {staticMatchups.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedStaticIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStaticIdx === i && !hasLiveGames
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {m.away.abbreviation} @ {m.home.abbreviation}
                </button>
              ))}
            </div>
          )}

          {scheduleLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading live schedule...</span>
            </div>
          )}
        </div>

        {/* Matchup Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            {(() => {
              const game = liveGames.find((g) => g.id === effectiveGameId)
              return game?.awayLogo ? (
                <Image src={game.awayLogo} alt={displayMatchup.away.abbreviation} width={32} height={32} className="rounded" />
              ) : null
            })()}
            <h2 className="text-xl font-bold text-foreground text-balance">
              {displayMatchup.away.name}{" "}
              <span className="text-muted-foreground font-normal">@</span>{" "}
              {displayMatchup.home.name}
            </h2>
            {(() => {
              const game = liveGames.find((g) => g.id === effectiveGameId)
              return game?.homeLogo ? (
                <Image src={game.homeLogo} alt={displayMatchup.home.abbreviation} width={32} height={32} className="rounded" />
              ) : null
            })()}
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
            {matchupLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {displayMatchup.week}
            {!isLive && " — Sample data (no live games available)"}
          </p>
        </div>

        {/* Team Stats Comparison */}
        <TeamStatsComparison
          away={displayMatchup.away}
          home={displayMatchup.home}
        />

        {/* Loading state for matchup data */}
        {matchupLoading && (
          <div className="flex items-center justify-center py-12 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Fetching live roster and player stats...</span>
            </div>
          </div>
        )}

        {/* Positional Breakdowns */}
        {!matchupLoading && (
          <>
            <PassingSection
              awayPlayers={displayMatchup.away.passing}
              homePlayers={displayMatchup.home.passing}
              awayTeam={displayMatchup.away.abbreviation}
              homeTeam={displayMatchup.home.abbreviation}
            />

            <RushingSection
              awayPlayers={displayMatchup.away.rushing}
              homePlayers={displayMatchup.home.rushing}
              awayTeam={displayMatchup.away.abbreviation}
              homeTeam={displayMatchup.home.abbreviation}
            />

            <ReceivingSection
              awayPlayers={displayMatchup.away.receiving}
              homePlayers={displayMatchup.home.receiving}
              awayTeam={displayMatchup.away.abbreviation}
              homeTeam={displayMatchup.home.abbreviation}
            />
          </>
        )}
      </main>
    </DashboardShell>
  )
}
