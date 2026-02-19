// ============================================================
// components/bet-board/board-view.tsx — Main board with prop list
// ============================================================
// Shows board name, stats, member bar, and list of prop rows.

"use client"

import { useState, useCallback } from "react"
import { Plus, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropRow } from "./prop-row"
import { MemberBar } from "./member-bar"
import { computeBoardStats } from "@/lib/bet-board-service"
import type { BetBoard } from "@/types/innovation-playbook"

interface BoardViewProps {
  board: BetBoard
  currentUserId: string
  onAddProp: (data: any) => void
  onVote: (propId: string, vote: 'agree' | 'disagree') => void
  onMarkResult: (propId: string, result: 'hit' | 'miss' | 'push', actualValue: number) => void
}

export function BoardView({ board, currentUserId, onAddProp, onVote, onMarkResult }: BoardViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const stats = computeBoardStats(board)

  const isEditor = board.members.some(
    m => m.userId === currentUserId && (m.role === 'owner' || m.role === 'editor')
  )

  return (
    <div className="space-y-4">
      {/* Board header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{board.name}</h2>
          <p className="text-xs text-muted-foreground">
            {board.sport?.toUpperCase() ?? 'All Sports'} &middot; {board.date}
          </p>
        </div>
        {isEditor && (
          <Button size="sm" className="text-xs gap-1" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-3.5 w-3.5" />
            Add Prop
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-2">
        <StatChip label="Props" value={String(stats.totalProps)} />
        <StatChip label="Hit Rate" value={`${stats.hitRate}%`} color={stats.hitRate >= 55 ? 'text-emerald-400' : undefined} />
        <StatChip label="Miss Rate" value={`${stats.missRate}%`} color={stats.missRate >= 55 ? 'text-red-400' : undefined} />
        <StatChip label="Pending" value={String(stats.pending)} />
        <StatChip label="Avg Conv." value={`${stats.avgConvergence}/7`} />
      </div>

      {/* Member bar */}
      <MemberBar members={board.members} />

      {/* Add prop form */}
      {showAddForm && (
        <AddPropForm
          onSubmit={(data) => { onAddProp(data); setShowAddForm(false) }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Props list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Board Picks
            <span className="ml-auto text-muted-foreground font-normal">{board.props.length}</span>
          </p>
        </div>

        {board.props.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No props added yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {board.props.map(prop => (
              <PropRow
                key={prop.id}
                prop={prop}
                currentUserId={currentUserId}
                isEditor={isEditor}
                onVote={onVote}
                onMarkResult={onMarkResult}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border p-2 text-center">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-bold ${color ?? 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function AddPropForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [playerName, setPlayerName] = useState('')
  const [stat, setStat] = useState('')
  const [line, setLine] = useState<number>(0)
  const [direction, setDirection] = useState<'over' | 'under'>('over')
  const [note, setNote] = useState('')

  const handleSubmit = useCallback(() => {
    if (!playerName || !stat || !line) return
    onSubmit({ playerName, stat, line, direction, note })
  }, [playerName, stat, line, direction, note, onSubmit])

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-foreground">Add a Prop</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Player name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Stat"
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
        <div className="flex gap-1.5">
          {(['over', 'under'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                direction === d ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
              }`}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex gap-2">
        <Button size="sm" className="text-xs" onClick={handleSubmit}>Add</Button>
        <Button size="sm" variant="ghost" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
