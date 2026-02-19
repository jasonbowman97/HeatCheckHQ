// ============================================================
// components/bet-board/invite-modal.tsx — Share link + invite
// ============================================================
// Simple invite UI with copy-link functionality.

"use client"

import { useState } from "react"
import { Link2, Copy, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InviteModalProps {
  boardId: string
  boardName: string
  onClose: () => void
}

export function InviteModal({ boardId, boardName, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/bet-board/${boardId}`
    : `/bet-board/${boardId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-xl border border-border bg-card w-full max-w-md mx-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-primary" />
            Invite to {boardName}
          </p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Share this link with your group
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <Button size="sm" className="gap-1 text-xs" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Anyone with this link can view the board. Members with Pro accounts can add props and vote.
          </p>
        </div>
      </div>
    </div>
  )
}
