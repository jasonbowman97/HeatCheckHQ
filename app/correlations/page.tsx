// ============================================================
// app/correlations/page.tsx — Correlation Matrix page
// ============================================================
// Pro-only page showing prop correlations for a selected game.
// Users pick a game from today's schedule to see the matrix.

"use client"

import { useState, useEffect, useCallback } from "react"
import { MatrixHeatmap } from "@/components/correlations/matrix-heatmap"
import { ParlaySuggestions } from "@/components/correlations/parlay-suggestions"
import { DashboardShell } from "@/components/dashboard-shell"
import { GitBranch, Loader2, ChevronDown } from "lucide-react"
import type { CorrelationMatrix } from "@/types/innovation-playbook"
import type { Sport } from "@/types/shared"

interface GameOption {
  id: string
  label: string
  homeAbbrev: string
  awayAbbrev: string
}

export default function CorrelationsPage() {
  const [sport, setSport] = useState<Sport>('nba')
  const [games, setGames] = useState<GameOption[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [matrix, setMatrix] = useState<CorrelationMatrix | null>(null)
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingMatrix, setLoadingMatrix] = useState(false)

  // Fetch today's games for the sport selector
  useEffect(() => {
    async function loadGames() {
      setLoadingGames(true)
      try {
        const res = await fetch(`/api/situation-room?sport=${sport}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const gameList: GameOption[] = (data.games ?? []).map((g: any) => ({
          id: g.game?.id ?? g.id ?? '',
          label: `${g.game?.awayTeam?.abbrev ?? '???'} @ ${g.game?.homeTeam?.abbrev ?? '???'}`,
          homeAbbrev: g.game?.homeTeam?.abbrev ?? '',
          awayAbbrev: g.game?.awayTeam?.abbrev ?? '',
        }))
        setGames(gameList)
        setSelectedGameId(null)
        setMatrix(null)
      } catch {
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }
    loadGames()
  }, [sport])

  // Fetch correlation matrix for selected game
  const loadMatrix = useCallback(async (gameId: string) => {
    setSelectedGameId(gameId)
    setLoadingMatrix(true)
    try {
      const res = await fetch(`/api/correlations/${gameId}?sport=${sport}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMatrix(data)
    } catch {
      setMatrix(null)
    } finally {
      setLoadingMatrix(false)
    }
  }, [sport])

  return (
    <DashboardShell subtitle="Prop correlation matrix">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Prop Correlations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover which player props move together for smarter parlay construction.
          </p>
        </div>

        {/* Sport + Game selectors */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Sport tabs */}
          <div className="flex gap-1.5 rounded-lg border border-border p-1 bg-muted/20">
            {(['nba', 'mlb', 'nfl'] as Sport[]).map(s => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  sport === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Game dropdown */}
          <div className="relative">
            <select
              value={selectedGameId ?? ''}
              onChange={e => e.target.value && loadMatrix(e.target.value)}
              disabled={loadingGames || games.length === 0}
              className="appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {loadingGames ? 'Loading games...' : games.length === 0 ? 'No games today' : 'Select a game'}
              </option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Loading */}
        {loadingMatrix && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* Matrix + Insights */}
        {matrix && !loadingMatrix && (
          <div className="space-y-6">
            <MatrixHeatmap
              players={matrix.players}
              correlations={matrix.correlations}
            />
            <ParlaySuggestions insights={matrix.parlayInsights} />
          </div>
        )}

        {/* Empty state */}
        {!selectedGameId && !loadingGames && games.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Select a game above to view prop correlations.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
