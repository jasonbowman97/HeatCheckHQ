// ============================================================
// app/situation-room/situation-room-content.tsx — Client content
// ============================================================
// Fetches Situation Room data by sport and renders game cards,
// alert feed, convergence grid, and weather panel.

"use client"

import { useState, useEffect, useCallback } from "react"
import { Radio, RefreshCw, Calendar, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameCard } from "@/components/situation-room/game-card"
import { AlertFeed } from "@/components/situation-room/alert-feed"
import { ConvergenceGrid } from "@/components/situation-room/convergence-grid"
import { WeatherPanel } from "@/components/situation-room/weather-panel"
import type { SituationRoomState, SituationRoomProp } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'nba', label: 'NBA', emoji: '' },
  { value: 'mlb', label: 'MLB', emoji: '' },
  { value: 'nfl', label: 'NFL', emoji: '' },
]

export function SituationRoomContent() {
  const [sport, setSport] = useState<Sport>('nba')
  const [data, setData] = useState<SituationRoomState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/situation-room?sport=${sport}`)
      if (!res.ok) throw new Error('Failed to load')
      const json: SituationRoomState = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to load Situation Room data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sport])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Collect all props from all games
  const allProps: SituationRoomProp[] = data?.games?.flatMap(g => g.topProps) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            Situation Room
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Game-day command center with live convergence alerts and analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sport tabs */}
      <div className="flex items-center gap-2">
        {SPORTS.map(s => (
          <button
            key={s.value}
            onClick={() => setSport(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sport === s.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}

        {data && (
          <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {data.games.length} game{data.games.length !== 1 ? 's' : ''} today
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Main content */}
      {data && (
        <>
          {data.games.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No {sport.toUpperCase()} games today</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check back on game day for live convergence data
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Games + Convergence Grid */}
              <div className="lg:col-span-2 space-y-6">
                {/* Game Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.games.map(g => (
                    <GameCard key={g.game.id} game={g} />
                  ))}
                </div>

                {/* Weather Panel (MLB only) */}
                {sport === 'mlb' && data.weatherAlerts.length > 0 && (
                  <WeatherPanel alerts={data.weatherAlerts} />
                )}

                {/* Convergence Grid */}
                <ConvergenceGrid props={allProps} />
              </div>

              {/* Right: Alert Feed */}
              <div className="space-y-6">
                <AlertFeed
                  initialAlerts={data.topPropAlerts}
                  sport={sport}
                />

                {/* Quick stats summary */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    Today&apos;s Snapshot
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Games"
                      value={data.games.length.toString()}
                    />
                    <StatBox
                      label="Top Props"
                      value={allProps.length.toString()}
                    />
                    <StatBox
                      label="High Conf"
                      value={allProps.filter(p => p.convergenceScore >= 5).length.toString()}
                    />
                    <StatBox
                      label="Alerts"
                      value={data.topPropAlerts.length.toString()}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
