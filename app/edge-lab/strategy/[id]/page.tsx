// ============================================================
// app/edge-lab/strategy/[id]/page.tsx — Strategy detail page
// ============================================================
// Full strategy view with performance, conditions, comments,
// and social actions (vote, follow, fork).

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { getStrategyBadges } from "@/types/community"
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Users, GitFork,
  MessageSquare, Loader2, Star, Send, TrendingUp,
  BarChart3, Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { PublicStrategy, StrategyComment } from "@/types/community"

export default function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [strategy, setStrategy] = useState<PublicStrategy | null>(null)
  const [comments, setComments] = useState<StrategyComment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [stratRes, commentsRes] = await Promise.all([
        fetch(`/api/strategies?sort=relevance`),
        fetch(`/api/strategies/${id}/comments`),
      ])

      if (stratRes.ok) {
        const data = await stratRes.json()
        const found = (data.strategies ?? []).find((s: PublicStrategy) => s.id === id)
        if (found) setStrategy(found)
      }

      if (commentsRes.ok) {
        const commData = await commentsRes.json()
        setComments(commData.comments ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleSocial = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    try {
      await fetch(`/api/strategies/${id}/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      await loadData()
    } catch {
      // silent
    }
  }, [id, loadData])

  const handleComment = useCallback(async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await fetch(`/api/strategies/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentText }),
      })
      setCommentText('')
      await loadData()
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }, [id, commentText, loadData])

  if (loading) {
    return (
      <DashboardShell subtitle="Strategy detail">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    )
  }

  if (!strategy) {
    return (
      <DashboardShell subtitle="Strategy detail">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-sm text-red-400">Strategy not found</p>
          <Link href="/edge-lab/community" className="text-xs text-primary mt-2 inline-block">
            Back to library
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const badges = getStrategyBadges(strategy).filter(b => b.earned)
  const hitRate = Math.round(strategy.livePerformance.hitRate * 100)
  const btHitRate = Math.round(strategy.backtest.hitRate * 100)

  return (
    <DashboardShell subtitle="Strategy detail">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {/* Back */}
        <Link
          href="/edge-lab/community"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Community Library
        </Link>

        {/* Title block */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-foreground">{strategy.name}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by{' '}
                  <Link href={`/edge-lab/author/${strategy.author.id}`} className="text-primary hover:underline">
                    {strategy.author.displayName}
                  </Link>
                  <span className="mx-1.5">&middot;</span>
                  {strategy.sport.toUpperCase()}
                  {strategy.forkedFrom && (
                    <>
                      <span className="mx-1.5">&middot;</span>
                      <GitFork className="h-3 w-3 inline" />
                      {' '}forked from {strategy.forkedFrom.authorName}
                    </>
                  )}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/10 text-primary flex-shrink-0">
                {strategy.sport}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-3">{strategy.description}</p>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {badges.map(b => (
                  <span
                    key={b.type}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1"
                    title={b.description}
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tags */}
            {strategy.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {strategy.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Social actions */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSocial('vote', { vote: 1 })}
                className={`p-1 rounded hover:bg-emerald-500/10 transition-colors ${strategy.userVote === 1 ? 'text-emerald-400' : 'text-muted-foreground'}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <span className={`text-sm font-semibold ${strategy.voteScore > 0 ? 'text-emerald-400' : strategy.voteScore < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {strategy.voteScore}
              </span>
              <button
                onClick={() => handleSocial('vote', { vote: -1 })}
                className={`p-1 rounded hover:bg-red-500/10 transition-colors ${strategy.userVote === -1 ? 'text-red-400' : 'text-muted-foreground'}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant={strategy.userFollowing ? 'default' : 'outline'}
                className="text-xs gap-1"
                onClick={() => handleSocial(strategy.userFollowing ? 'unfollow' : 'follow')}
              >
                <Users className="h-3 w-3" />
                {strategy.userFollowing ? 'Following' : 'Follow'} ({strategy.followerCount})
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleSocial('fork')}>
                <GitFork className="h-3 w-3" />
                Fork ({strategy.forkCount})
              </Button>
            </div>
          </div>
        </div>

        {/* Performance grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Live performance */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Live Performance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Hit Rate" value={strategy.livePerformance.games >= 5 ? `${hitRate}%` : '—'} good={hitRate >= 55} />
              <StatBlock label="ROI" value={strategy.livePerformance.games >= 5 ? `${(strategy.livePerformance.roi * 100).toFixed(1)}%` : '—'} good={strategy.livePerformance.roi > 0} />
              <StatBlock label="Games" value={String(strategy.livePerformance.games)} />
              <StatBlock label="Hits" value={String(strategy.livePerformance.hits)} />
            </div>
          </div>

          {/* Backtest performance */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Backtest
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Hit Rate" value={`${btHitRate}%`} good={btHitRate >= 55} />
              <StatBlock label="ROI" value={`${(strategy.backtest.roi * 100).toFixed(1)}%`} good={strategy.backtest.roi > 0} />
              <StatBlock label="Sharpe" value={strategy.backtest.sharpeRatio.toFixed(2)} good={strategy.backtest.sharpeRatio > 0.5} />
              <StatBlock label="Max DD" value={`${(strategy.backtest.maxDrawdown * 100).toFixed(1)}%`} />
            </div>
          </div>
        </div>

        {/* Conditions */}
        {strategy.conditions.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" />
                Filter Conditions ({strategy.conditions.length})
              </p>
            </div>
            <div className="divide-y divide-border">
              {strategy.conditions.map((cond, i) => (
                <div key={cond.id ?? i} className="px-4 py-2 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{cond.fieldLabel ?? cond.field}</span>
                  <span className="font-mono text-primary">{cond.operator}</span>
                  <span className="text-foreground font-medium">{cond.valueLabel ?? String(cond.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Comments ({comments.length})
            </p>
          </div>

          {/* Add comment */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={e => { if (e.key === 'Enter') handleComment() }}
              />
              <Button size="sm" className="gap-1 text-xs" onClick={handleComment} disabled={submitting || !commentText.trim()}>
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Post
              </Button>
            </div>
          </div>

          {/* Comment list */}
          {comments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function StatBlock({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-sm font-bold ${good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}

function CommentItem({ comment }: { comment: StrategyComment }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-muted-foreground">
            {comment.authorDisplayName.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">{comment.authorDisplayName}</span>
            <span className="ml-1.5">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </p>
          <p className="text-xs text-foreground mt-0.5">{comment.body}</p>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 ml-2 pl-2 border-l border-border space-y-2">
              {comment.replies.map(reply => (
                <div key={reply.id}>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{reply.authorDisplayName}</span>
                    <span className="ml-1.5">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </p>
                  <p className="text-xs text-foreground mt-0.5">{reply.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
