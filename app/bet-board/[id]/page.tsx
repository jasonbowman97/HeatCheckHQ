// ============================================================
// app/bet-board/[id]/page.tsx — Individual Board View
// ============================================================
// Fetches board data, props, and members, renders BoardView.

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { BoardView } from "@/components/bet-board/board-view"
import { InviteModal } from "@/components/bet-board/invite-modal"
import { DashboardShell } from "@/components/dashboard-shell"
import { Loader2, ArrowLeft, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { BetBoard, BetBoardMember, BetBoardProp } from "@/types/innovation-playbook"

export default function BetBoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [board, setBoard] = useState<BetBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')

  const loadBoard = useCallback(async () => {
    try {
      // Fetch board, props, and members in parallel
      const [boardRes, propsRes, membersRes] = await Promise.all([
        fetch(`/api/bet-boards?boardId=${id}`),
        fetch(`/api/bet-boards/${id}/props`),
        fetch(`/api/bet-boards/${id}/members`),
      ])

      if (!boardRes.ok) throw new Error('Board not found')

      const boardData = await boardRes.json()
      const propsData = propsRes.ok ? await propsRes.json() : { props: [] }
      const membersData = membersRes.ok ? await membersRes.json() : { members: [] }

      // Find current board from list response
      const boards: BetBoard[] = boardData.boards ?? []
      const found = boards.find((b: BetBoard) => b.id === id)

      if (!found) throw new Error('Board not found')

      // Merge fetched props and members into the board
      const fullBoard: BetBoard = {
        ...found,
        props: propsData.props ?? [],
        members: membersData.members ?? [],
      }

      setBoard(fullBoard)
      setCurrentUserId(boardData.userId ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadBoard() }, [loadBoard])

  const handleAddProp = useCallback(async (data: { playerName: string; stat: string; line: number; direction: 'over' | 'under'; note: string }) => {
    try {
      const res = await fetch(`/api/bet-boards/${id}/props`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      await loadBoard()
    } catch {
      // silent
    }
  }, [id, loadBoard])

  const handleVote = useCallback(async (propId: string, vote: 'agree' | 'disagree') => {
    try {
      const res = await fetch(`/api/bet-boards/${id}/props`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propId, action: 'vote', vote }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadBoard()
    } catch {
      // silent
    }
  }, [id, loadBoard])

  const handleMarkResult = useCallback(async (propId: string, result: 'hit' | 'miss' | 'push', actualValue: number) => {
    try {
      const res = await fetch(`/api/bet-boards/${id}/props`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propId, action: 'result', result, actualValue }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadBoard()
    } catch {
      // silent
    }
  }, [id, loadBoard])

  return (
    <ProtectedPage pathname="/bet-board">
      <DashboardShell subtitle="Board detail">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Back link + invite */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/bet-board"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All Boards
          </Link>
          {board && (
            <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setShowInvite(true)}>
              <Link2 className="h-3.5 w-3.5" />
              Invite
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Link href="/bet-board" className="text-xs text-primary mt-2 inline-block">
              Back to boards
            </Link>
          </div>
        ) : board ? (
          <BoardView
            board={board}
            currentUserId={currentUserId}
            onAddProp={handleAddProp}
            onVote={handleVote}
            onMarkResult={handleMarkResult}
          />
        ) : null}

        {/* Invite modal */}
        {showInvite && board && (
          <InviteModal
            boardId={board.id}
            boardName={board.name}
            onClose={() => setShowInvite(false)}
          />
        )}
      </div>
      </DashboardShell>
    </ProtectedPage>
  )
}
