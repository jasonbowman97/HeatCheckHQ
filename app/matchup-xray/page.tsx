// ============================================================
// app/matchup-xray/page.tsx — Matchup X-Ray game picker
// ============================================================
// Entry page — user picks a game from today's schedule,
// then navigates to /matchup-xray/[gameId] for deep analysis.

"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Crosshair, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Sport } from "@/types/shared"

interface GameCard {
  id: string
  homeAbbrev: string
  awayAbbrev: string
  homeLogo: string
  awayLogo: string
  homeName: string
  awayName: string
  time: string
  venue: string
  total?: number
  spread?: string
}

export default function MatchupXRayPickerPage() {
  const [sport, setSport] = useState<Sport>("nba")
  const [games, setGames] = useState<GameCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGames() {
      setLoading(true)
      try {
        const res = await fetch(`/api/situation-room?sport=${sport}`)
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        const list: GameCard[] = (data.games ?? []).map((g: any) => {
          const game = g.game ?? g
          return {
            id: game.id ?? "",
            homeAbbrev: game.homeTeam?.abbrev ?? "???",
            awayAbbrev: game.awayTeam?.abbrev ?? "???",
            homeLogo: game.homeTeam?.logo ?? "",
            awayLogo: game.awayTeam?.logo ?? "",
            homeName: game.homeTeam?.name ?? "",
            awayName: game.awayTeam?.name ?? "",
            time: game.date ? new Date(game.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
            venue: game.venue ?? "",
            total: game.total,
            spread: game.spread ? `${game.spread > 0 ? "+" : ""}${game.spread}` : undefined,
          }
        })
        setGames(list)
      } catch {
        setGames([])
      } finally {
        setLoading(false)
      }
    }
    loadGames()
  }, [sport])

  return (
    <DashboardShell subtitle="Deep matchup analysis">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-primary" />
            Matchup X-Ray
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a game to view team profiles, key matchups, pace projections, and H2H history.
          </p>
        </div>

        {/* Sport tabs */}
        <div className="flex gap-1.5 rounded-lg border border-border p-1 bg-muted/20 w-fit mb-6">
          {(["nba", "mlb", "nfl"] as Sport[]).map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                sport === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* No games */}
        {!loading && games.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Crosshair className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No {sport.toUpperCase()} games scheduled today.
            </p>
          </div>
        )}

        {/* Game cards */}
        {!loading && games.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/matchup-xray/${g.id}?sport=${sport}`}
                className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Away team */}
                    <div className="text-center w-14">
                      {g.awayLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.awayLogo} alt={g.awayAbbrev} className="h-8 w-8 mx-auto mb-0.5 object-contain" />
                      )}
                      <p className="text-xs font-bold text-foreground">{g.awayAbbrev}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">@</p>
                    </div>

                    {/* Home team */}
                    <div className="text-center w-14">
                      {g.homeLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.homeLogo} alt={g.homeAbbrev} className="h-8 w-8 mx-auto mb-0.5 object-contain" />
                      )}
                      <p className="text-xs font-bold text-foreground">{g.homeAbbrev}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Game meta */}
                <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
                  {g.time && <span>{g.time}</span>}
                  {g.total && (
                    <>
                      <span>·</span>
                      <span>O/U {g.total}</span>
                    </>
                  )}
                  {g.spread && (
                    <>
                      <span>·</span>
                      <span>{g.homeAbbrev} {g.spread}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
