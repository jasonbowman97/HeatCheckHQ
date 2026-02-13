"use client"

import Link from "next/link"
import { Zap, ArrowRight } from "lucide-react"
import { useUserTier } from "@/components/user-tier-provider"

interface ProUpsellBannerProps {
  /** Headline text for the upsell */
  headline?: string
  /** Description text */
  description?: string
}

export function ProUpsellBanner({
  headline = "Unlock Hot Hitters, Pitching Stats & NFL Matchup with Pro",
  description = "Full access to every dashboard across MLB, NBA, and NFL — $12/mo",
}: ProUpsellBannerProps) {
  const userTier = useUserTier()

  if (userTier !== "free") return null

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{headline}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Link
        href="/checkout"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Go Pro
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
