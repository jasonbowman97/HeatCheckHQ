// ============================================================
// components/pro-gate.tsx — Per-component Pro gating overlay
// ============================================================
// Unlike the full-page Paywall, ProGate wraps individual sections
// within a page so free users see a blurred preview with a lock CTA.

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUserTier } from "@/components/user-tier-provider"
import { TrackEvent } from "@/components/track-event"

interface ProGateProps {
  /** Content to render — visible to Pro users, blurred for others */
  children: React.ReactNode
  /** Feature name for analytics tracking */
  feature: string
  /** Short headline displayed on the lock overlay */
  headline?: string
  /** Value proposition shown under the headline */
  teaser?: string
  /** Minimum height for the blurred preview (prevents tiny blurred blocks) */
  minHeight?: string
}

export function ProGate({
  children,
  feature,
  headline = "Pro Feature",
  teaser,
  minHeight = "120px",
}: ProGateProps) {
  const tier = useUserTier()
  const pathname = usePathname()

  // Pro users see content directly — no gate
  if (tier === "pro") {
    return <>{children}</>
  }

  const isAnonymous = tier === "anonymous"
  const checkoutHref = `/checkout${pathname ? `?return=${encodeURIComponent(pathname)}` : ""}`

  return (
    <div className="relative" style={{ minHeight }}>
      <TrackEvent event="pro_gate_hit" params={{ feature }} />

      {/* Blurred preview — enough to tease the content */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="blur-md opacity-25 overflow-hidden" style={{ maxHeight: "280px" }}>
          {children}
        </div>
        {/* Top fade gradient */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card to-transparent" />
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-4 max-w-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Lock className="h-4 w-4 text-primary" />
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">{headline}</p>
            {teaser && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{teaser}</p>
            )}
          </div>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            asChild
          >
            <Link href={checkoutHref}>
              <Sparkles className="h-3.5 w-3.5" />
              {isAnonymous ? "Get Pro" : "Upgrade to Pro"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <p className="text-[10px] text-muted-foreground">
            Starting at $8.33/mo &middot; Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
