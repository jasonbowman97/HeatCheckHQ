// ============================================================
// app/what-if/page.tsx — What-If Simulator
// ============================================================
// Pro-only scenario modeler. Lets users adjust convergence
// inputs and see before/after impact on a prop's score.

"use client"

import { useState, useCallback } from "react"
import { ScenarioControls } from "@/components/what-if/scenario-controls"
import { DiffView } from "@/components/what-if/diff-view"
import { DashboardShell } from "@/components/dashboard-shell"
import { Search, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WhatIfModification, WhatIfResult } from "@/types/innovation-playbook"

export default function WhatIfPage() {
  const [playerName, setPlayerName] = useState("")
  const [stat, setStat] = useState("")
  const [line, setLine] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WhatIfResult | null>(null)

  const handleLoadProp = useCallback(() => {
    if (!playerName.trim() || !stat.trim() || line <= 0) return
    setLoaded(true)
    setResult(null)
  }, [playerName, stat, line])

  const handleModificationsChange = useCallback(async (mods: WhatIfModification[]) => {
    if (mods.length === 0) {
      setResult(null)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          stat,
          line,
          sport: "nba",
          modifications: mods,
        }),
      })

      if (!res.ok) throw new Error("Simulation failed")
      const data = await res.json()
      setResult(data)
    } catch {
      // Error handled by empty result state
    } finally {
      setLoading(false)
    }
  }, [playerName, stat, line])

  return (
    <DashboardShell subtitle="Scenario simulator">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            What-If Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Adjust scenario inputs and see how they impact convergence scores.
          </p>
        </div>

        {/* Prop selector */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary" />
            Select a Prop
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Player name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Stat (pts, reb, ast...)"
              value={stat}
              onChange={e => setStat(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Line"
              value={line || ""}
              onChange={e => setLine(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" className="text-xs gap-1" onClick={handleLoadProp}>
              Load Prop
            </Button>
          </div>
        </div>

        {/* Controls + Diff side by side */}
        {loaded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScenarioControls
              originalLine={line}
              onModificationsChange={handleModificationsChange}
            />
            <DiffView result={result} loading={loading} />
          </div>
        )}

        {!loaded && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FlaskConical className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Enter a player, stat, and line above to start simulating.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
