// ============================================================
// app/graveyard/page.tsx — The Graveyard
// ============================================================
// Pro-only bad beat autopsy system. Users log missed bets,
// get root cause analysis, and track loss patterns over time.

"use client"

import { useState, useEffect, useCallback } from "react"
import { TombstoneCard } from "@/components/graveyard/tombstone-card"
import { AutopsyView } from "@/components/graveyard/autopsy-view"
import { LossPatternsView } from "@/components/graveyard/loss-patterns"
import { analyzeLossPatterns } from "@/lib/graveyard-service"
import { DashboardShell } from "@/components/dashboard-shell"
import { Skull, Plus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GraveyardEntry, BetAutopsy } from "@/types/innovation-playbook"

export default function GraveyardPage() {
  const [entries, setEntries] = useState<GraveyardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<GraveyardEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Load entries
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/graveyard')
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setEntries(data.entries ?? [])
      } catch {
        // Error state handled by empty list
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/graveyard?id=${id}`, { method: 'DELETE' })
      setEntries(prev => prev.filter(e => e.id !== id))
      if (selectedEntry?.id === id) setSelectedEntry(null)
    } catch {
      // Silent fail
    }
  }, [selectedEntry])

  const handleAdd = useCallback(async (entry: Omit<GraveyardEntry, 'id' | 'userId' | 'result' | 'autopsy'> & { autopsy?: BetAutopsy }) => {
    try {
      const res = await fetch('/api/graveyard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setEntries(prev => [data.entry, ...prev])
      setShowAddForm(false)
    } catch {
      // Error handling
    }
  }, [])

  const patterns = analyzeLossPatterns(entries)

  return (
    <DashboardShell subtitle="Bad beat autopsy">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Skull className="h-6 w-6 text-red-400" />
              The Graveyard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Learn from your losses. Log missed bets and get process-focused autopsies.
            </p>
          </div>
          <Button
            size="sm"
            className="text-xs gap-1"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddForm ? 'Cancel' : 'Log a Loss'}
          </Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <AddEntryForm onSubmit={handleAdd} />
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entry list */}
            <div className="lg:col-span-2 space-y-3">
              {entries.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Skull className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No entries yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Log your first missed bet to start tracking patterns.
                  </p>
                </div>
              ) : selectedEntry ? (
                <div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-xs text-primary hover:underline mb-3"
                  >
                    &larr; Back to list
                  </button>
                  <AutopsyView entry={selectedEntry} />
                </div>
              ) : (
                entries.map(entry => (
                  <TombstoneCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onSelect={setSelectedEntry}
                  />
                ))
              )}
            </div>

            {/* Patterns sidebar */}
            <div>
              <LossPatternsView patterns={patterns} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

// ── Inline add form ──

function AddEntryForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [playerName, setPlayerName] = useState('')
  const [stat, setStat] = useState('')
  const [line, setLine] = useState<number>(0)
  const [direction, setDirection] = useState<'over' | 'under'>('over')
  const [actualValue, setActualValue] = useState<number>(0)
  const [convergence, setConvergence] = useState<number>(4)
  const [generating, setGenerating] = useState(false)

  const handleSubmit = async () => {
    if (!playerName || !stat || !line) return

    setGenerating(true)
    try {
      // Generate autopsy first
      const autopsyRes = await fetch('/api/graveyard/autopsy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          stat,
          line,
          direction,
          actualValue,
          convergenceAtTimeOfBet: convergence,
        }),
      })

      let autopsy: BetAutopsy | undefined
      if (autopsyRes.ok) {
        const data = await autopsyRes.json()
        autopsy = data.autopsy
      }

      onSubmit({
        playerName,
        stat,
        line,
        direction,
        actualValue,
        convergenceAtTimeOfBet: convergence,
        sport: 'nba',
        date: new Date().toISOString().slice(0, 10),
        playerId: '',
        margin: direction === 'over' ? actualValue - line : line - actualValue,
        autopsy,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6">
      <p className="text-xs font-semibold text-foreground mb-3">Log a Missed Bet</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <input
          type="text"
          placeholder="Player name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Stat (pts, reb...)"
          value={stat}
          onChange={e => setStat(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Line"
          value={line || ''}
          onChange={e => setLine(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Actual value"
          value={actualValue || ''}
          onChange={e => setActualValue(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1.5">
          {(['over', 'under'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                direction === d ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
              }`}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Convergence:</label>
          <input
            type="range"
            min={0}
            max={7}
            step={1}
            value={convergence}
            onChange={e => setConvergence(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <span className="text-xs font-bold text-foreground">{convergence}/7</span>
        </div>
      </div>
      <Button size="sm" className="text-xs gap-1" onClick={handleSubmit} disabled={generating}>
        {generating && <Loader2 className="h-3 w-3 animate-spin" />}
        {generating ? 'Generating Autopsy...' : 'Log & Analyze'}
      </Button>
    </div>
  )
}
