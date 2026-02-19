// ============================================================
// app/matchup-xray/[gameId]/page.tsx — Matchup X-Ray page
// ============================================================
// Pro-only deep game-level analysis with team profiles,
// key matchups, pace projection, and H2H history.

"use client"

import { useState, useEffect, use } from "react"
import { TeamProfile } from "@/components/matchup-xray/team-profile"
import { KeyMatchups } from "@/components/matchup-xray/key-matchups"
import { PaceGauge } from "@/components/matchup-xray/pace-gauge"
import { H2HHistoryView } from "@/components/matchup-xray/h2h-history"
import { DashboardShell } from "@/components/dashboard-shell"
import { Crosshair, Loader2 } from "lucide-react"
import type { MatchupXRay } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

export default function MatchupXRayPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = use(params)
  const [data, setData] = useState<MatchupXRay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sport] = useState<Sport>('nba')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/matchup-xray/${gameId}?sport=${sport}`)
        if (!res.ok) throw new Error('Failed to load matchup data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId, sport])

  return (
    <DashboardShell subtitle="Deep matchup analysis">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crosshair className="h-6 w-6 text-primary" />
            Matchup X-Ray
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep analysis of team profiles, key matchups, and pace projection.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Game header */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.game.awayTeam.logo} alt={data.game.awayTeam.name} className="h-12 w-12 mx-auto mb-1 object-contain" />
                  <p className="text-sm font-bold text-foreground">{data.game.awayTeam.abbrev}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase">vs</p>
                  {data.game.total && (
                    <p className="text-xs text-muted-foreground mt-0.5">O/U {data.game.total}</p>
                  )}
                </div>
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.game.homeTeam.logo} alt={data.game.homeTeam.name} className="h-12 w-12 mx-auto mb-1 object-contain" />
                  <p className="text-sm font-bold text-foreground">{data.game.homeTeam.abbrev}</p>
                </div>
              </div>
            </div>

            {/* Team profiles side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TeamProfile
                profile={data.awayTeamProfile}
                teamName={data.game.awayTeam.name}
                teamLogo={data.game.awayTeam.logo}
                side="away"
              />
              <TeamProfile
                profile={data.homeTeamProfile}
                teamName={data.game.homeTeam.name}
                teamLogo={data.game.homeTeam.logo}
                side="home"
              />
            </div>

            {/* Key matchups + Pace projection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <KeyMatchups matchups={data.keyMatchups} />
              <PaceGauge projection={data.paceProjection} />
            </div>

            {/* H2H History */}
            <H2HHistoryView
              history={data.historicalH2H}
              homeTeam={data.game.homeTeam.abbrev}
              awayTeam={data.game.awayTeam.abbrev}
            />
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
