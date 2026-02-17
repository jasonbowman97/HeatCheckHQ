import Link from "next/link"
import { Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AccessTier } from "@/lib/access-control"
import { TrackEvent } from "@/components/track-event"

interface PaywallProps {
  requiredTier: AccessTier
  userTier: "anonymous" | "free" | "pro"
  children: React.ReactNode
}

export function Paywall({ requiredTier, userTier, children }: PaywallProps) {
  const hasAccess =
    requiredTier === "public" ||
    (requiredTier === "free" && (userTier === "free" || userTier === "pro")) ||
    (requiredTier === "pro" && userTier === "pro")

  if (hasAccess) {
    return <>{children}</>
  }

  // Determine what to show:
  // 1. Anonymous on a FREE page -> "Create a free account"
  // 2. Anonymous on a PRO page -> "Subscribe to Pro" (NOT "free account")
  // 3. Free user on a PRO page -> "Upgrade to Pro"
  const isAnonymous = userTier === "anonymous"
  const isProPage = requiredTier === "pro"
  const isFreePage = requiredTier === "free"

  return (
    <div className="relative">
      <TrackEvent event="paywall_hit" params={{ required_tier: requiredTier, user_tier: userTier }} />
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="blur-sm opacity-40">
          {children}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>

          {isAnonymous && isFreePage ? (
            /* Anonymous user on a FREE-tier page */
            <>
              <h2 className="text-xl font-bold text-foreground">
                Create a free account
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Sign up for free to access this dashboard. It only takes a few seconds.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/auth/sign-up">
                    Sign up free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : isAnonymous && isProPage ? (
            /* Anonymous user on a PRO-tier page — go straight to checkout */
            <>
              <h2 className="text-xl font-bold text-foreground">
                Pro subscription required
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This dashboard is available with a Pro subscription.
                Get full access to every dashboard, trend, and insight starting at $8.33/mo.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/checkout">
                    Subscribe to Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  No account needed — we&apos;ll create one at checkout.
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-left text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Streak Trackers across MLB, NBA, NFL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Hot Hitters, Hitting and Pitching Stats
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    NFL Matchup and all Pro dashboards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Cancel anytime
                  </li>
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : !isAnonymous && isProPage ? (
            /* Free user on a PRO-tier page */
            <>
              <h2 className="text-xl font-bold text-foreground">
                Upgrade to Pro
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This dashboard requires a Pro subscription. Get full access to
                every dashboard, trend, and insight starting at $8.33/mo.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/checkout">
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <ul className="mt-2 flex flex-col gap-1 text-left text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    All dashboards across MLB, NBA, NFL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Real-time data and advanced filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Cancel anytime
                  </li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
