// ============================================================
// app/bet-board/page.tsx — Bet Board Lobby
// ============================================================
// Lists user's boards with create-new-board form. Pro-only.

"use client"

import { useState, useEffect, useCallback } from "react"
import { InviteModal } from "@/components/bet-board/invite-modal"
import { DashboardShell } from "@/components/dashboard-shell"
import { Users, Plus, Loader2, Link2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { BetBoard } from "@/types/innovation-playbook"

export default function BetBoardLobbyPage() {
  const [boards, setBoards] = useState<BetBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [inviteBoard, setInviteBoard] = useState<BetBoard | null>(null)

  const loadBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/bet-boards')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setBoards(data.boards ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBoards() }, [loadBoards])

  return (
    <DashboardShell subtitle="Collaborative boards">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Bet Boards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Collaborate on picks with your crew. Vote, track results, and find consensus.
            </p>
          </div>
          <Button size="sm" className="text-xs gap-1" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Board
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <CreateBoardForm
            onCreated={(board) => { setBoards(prev => [board, ...prev]); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Board list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : boards.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No boards yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a board and invite your friends to start collaborating on picks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {boards.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                onInvite={() => setInviteBoard(board)}
              />
            ))}
          </div>
        )}

        {/* Invite modal */}
        {inviteBoard && (
          <InviteModal
            boardId={inviteBoard.id}
            boardName={inviteBoard.name}
            onClose={() => setInviteBoard(null)}
          />
        )}
      </div>
    </DashboardShell>
  )
}

function BoardCard({ board, onInvite }: { board: BetBoard; onInvite: () => void }) {
  const resolved = board.props.filter(p => p.result)
  const hits = resolved.filter(p => p.result === 'hit').length
  const hitRate = resolved.length > 0 ? Math.round((hits / resolved.length) * 100) : 0

  return (
    <Link
      href={`/bet-board/${board.id}`}
      className="block rounded-xl border border-border bg-card hover:border-primary/30 transition-colors overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground truncate">{board.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {board.sport?.toUpperCase() ?? 'All Sports'} &middot; {board.date}
            &middot; {board.members.length} member{board.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick stats */}
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              {board.props.length} props
            </span>
            {resolved.length > 0 && (
              <span className={`font-semibold ${hitRate >= 55 ? 'text-emerald-400' : hitRate >= 45 ? 'text-foreground' : 'text-red-400'}`}>
                {hitRate}%
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.preventDefault(); onInvite() }}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Invite"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  )
}

function CreateBoardForm({ onCreated, onCancel }: {
  onCreated: (board: BetBoard) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('nba')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/bet-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), sport }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onCreated(data.board)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }, [name, sport, onCreated])

  const sports = ['nba', 'nfl', 'mlb', 'nhl', 'ncaab', 'ncaaf']

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
      <p className="text-xs font-semibold text-foreground">Create a Board</p>
      <input
        type="text"
        placeholder="Board name (e.g. Friday Night Locks)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex flex-wrap gap-1.5">
        {sports.map(s => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium uppercase ${
              sport === s ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="text-xs gap-1" onClick={handleSubmit} disabled={submitting || !name.trim()}>
          {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
          Create
        </Button>
        <Button size="sm" variant="ghost" className="text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
