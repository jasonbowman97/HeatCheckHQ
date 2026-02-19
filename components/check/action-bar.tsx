// ============================================================
// components/check/action-bar.tsx — Sticky bottom action bar
// ============================================================
// Shows share, bookmark, and re-check actions after a prop check.
// Sticks to the bottom of the viewport on mobile.

"use client"

import { useState, useCallback, useMemo } from "react"
import { Share2, Bookmark, RotateCcw, Check, Link2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PropCheckResult } from "@/types/check-prop"

interface ActionBarProps {
  result: PropCheckResult
  onRecheck?: () => void
}

export function ActionBar({ result, onRecheck }: ActionBarProps) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const { player, statLabel, line, verdict, heatRing, stat, game } = result

  // Build share URL params for the public share page
  const shareUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set("player", player.name)
    params.set("team", player.team.abbrev)
    params.set("stat", stat)
    params.set("statLabel", statLabel)
    params.set("line", line.toString())
    params.set("verdict", verdict.label)
    params.set("direction", verdict.direction)
    params.set("score", verdict.convergenceScore.toString())
    params.set("confidence", verdict.confidence.toString())
    params.set("hitRate", verdict.hitRateL10.toString())
    params.set("margin", verdict.avgMarginL10.toString())
    params.set("avg", verdict.seasonAvg.toString())
    params.set("heatHitRate", heatRing.aggregates.hitRate.toString())
    params.set("streak", heatRing.aggregates.streak.toString())
    params.set("sport", player.sport)
    const isHome = game.homeTeam.id === player.team.id
    params.set("home", isHome.toString())
    const opp = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev
    params.set("opp", opp)

    const origin = typeof window !== "undefined" ? window.location.origin : "https://heatcheckhq.io"
    return `${origin}/check/share?${params.toString()}`
  }, [player, stat, statLabel, line, verdict, heatRing, game])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }, [shareUrl])

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${player.name} ${statLabel} ${line} — ${verdict.label}`,
      text: `Check out my prop analysis for ${player.name} ${statLabel} ${line} on HeatCheck HQ`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink()
    }
  }, [player.name, statLabel, line, verdict.label, shareUrl, handleCopyLink])

  const handleSave = useCallback(() => {
    setSaved(s => !s)
    // TODO: Persist to Supabase user_saved_props table
  }, [])

  // Share image download URL
  const shareImageUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set("player", player.name)
    params.set("team", player.team.abbrev)
    params.set("stat", stat)
    params.set("statLabel", statLabel)
    params.set("line", line.toString())
    params.set("verdict", verdict.label)
    params.set("direction", verdict.direction)
    params.set("score", verdict.convergenceScore.toString())
    params.set("confidence", verdict.confidence.toString())
    params.set("hitRate", verdict.hitRateL10.toString())
    params.set("margin", verdict.avgMarginL10.toString())
    params.set("avg", verdict.seasonAvg.toString())
    params.set("heatHitRate", heatRing.aggregates.hitRate.toString())
    params.set("streak", heatRing.aggregates.streak.toString())
    params.set("sport", player.sport)
    const isHome = game.homeTeam.id === player.team.id
    params.set("home", isHome.toString())
    const opp = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev
    params.set("opp", opp)
    return `/api/check-prop/share-image?${params.toString()}`
  }, [player, stat, statLabel, line, verdict, heatRing, game])

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:relative sm:mt-6">
      <div className="border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 sm:rounded-xl sm:border sm:border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-2">
          {/* Left: Summary */}
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {player.name} &middot; {statLabel} {line} &middot; <span className="font-semibold text-foreground">{verdict.label}</span>
          </p>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs hidden sm:flex"
              asChild
            >
              <a href={shareImageUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
                Image
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 text-xs ${saved ? 'text-primary border-primary/30' : ''}`}
              onClick={handleSave}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-primary' : ''}`} />
              {saved ? "Saved" : "Save"}
            </Button>

            {onRecheck && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={onRecheck}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Check
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
