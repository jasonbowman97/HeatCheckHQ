"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Logo } from "@/components/logo"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useState, useEffect } from "react"
import { WelcomeModal, isOnboarded } from "@/components/welcome-modal"
import { hydrateOnboardingState } from "@/lib/onboarding"
import { useUserTier } from "@/components/user-tier-provider"
import { analytics } from "@/lib/analytics"

/* ─── Navigation types ─── */

type Tier = "public" | "free" | "pro"

interface NavLink {
  href: string
  label: string
  tier: Tier
  ariaLabel?: string
}

/* ─── Sport navigation config ─── */

const MLB_NAV: NavLink[] = [
  { href: "/mlb/hot-hitters", label: "Hot Hitters", tier: "pro" },
  { href: "/mlb/hitting-stats", label: "Hitter vs Pitcher", tier: "pro" },
  { href: "/mlb/pitching-stats", label: "Pitching Stats", tier: "pro" },
  { href: "/mlb/nrfi", label: "NRFI", tier: "free", ariaLabel: "No Run First Inning" },
  { href: "/mlb/weather", label: "Weather", tier: "free" },
  { href: "/mlb/due-for-hr", label: "Due for HR", tier: "free", ariaLabel: "Due for Home Run" },
  { href: "/mlb/streaks", label: "Streak Tracker", tier: "pro" },
]

const NBA_NAV: NavLink[] = [
  { href: "/nba/first-basket", label: "First Basket", tier: "free" },
  { href: "/nba/head-to-head", label: "H2H", tier: "free", ariaLabel: "Head to Head" },
  { href: "/nba/defense-vs-position", label: "Def vs Pos", tier: "free", ariaLabel: "Defense vs Position" },
  { href: "/nba/streaks", label: "Streak Tracker", tier: "free" },
]

const NFL_NAV: NavLink[] = [
  { href: "/nfl/matchup", label: "Matchup", tier: "pro" },
  { href: "/nfl/defense-vs-position", label: "Def vs Pos", tier: "free", ariaLabel: "Defense vs Position" },
  { href: "/nfl/streaks", label: "Streak Tracker", tier: "pro" },
]

const SPORT_CONFIG: Record<string, { nav: NavLink[]; subtitle: string }> = {
  mlb: { nav: MLB_NAV, subtitle: "MLB" },
  nba: { nav: NBA_NAV, subtitle: "NBA" },
  nfl: { nav: NFL_NAV, subtitle: "NFL" },
}

/* ─── Human-readable page names for breadcrumbs ─── */

const PAGE_NAMES: Record<string, string> = {
  "hot-hitters": "Hot Hitters",
  "hitting-stats": "Hitter vs Pitcher",
  "pitching-stats": "Pitching Stats",
  nrfi: "NRFI",
  weather: "Weather",
  "due-for-hr": "Due for HR",
  trends: "Trends",
  "first-basket": "First Basket",
  "head-to-head": "Head-to-Head",
  "defense-vs-position": "Defense vs Position",
  matchup: "Matchup",
  streaks: "Streak Tracker",
  check: "Prop Analyzer",
}

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "public") return null
  if (tier === "pro") {
    return (
      <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
        Pro
      </span>
    )
  }
  return null
}

/* ─── Shared class constants ─── */

const SPORT_TAB_ACTIVE = "text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1.5 rounded-md"
const SPORT_TAB_INACTIVE = "text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
const SUB_NAV_ACTIVE = "text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md"
const SUB_NAV_INACTIVE = "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"

/* ─── Component ─── */

interface DashboardShellProps {
  children: React.ReactNode
  subtitle?: string
}

export function DashboardShell({ children, subtitle }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const userTier = useUserTier()

  useEffect(() => {
    if (userTier !== "anonymous") {
      hydrateOnboardingState().then((alreadyOnboarded) => {
        if (!alreadyOnboarded && !isOnboarded()) {
          const timer = setTimeout(() => setShowWelcome(true), 500)
          return () => clearTimeout(timer)
        }
      })
    }
  }, [userTier])

  // Derive sport and page from pathname
  const segments = pathname.split("/").filter(Boolean)
  const sport = segments[0] ?? ""
  const page = segments[1] ?? ""

  // Fire dashboard_viewed analytics event on every page navigation
  useEffect(() => {
    const dashboard = page || sport || segments[0] || "home"
    analytics.dashboardViewed(dashboard, sport)
  }, [pathname, sport, page, segments])

  const sportConfig = SPORT_CONFIG[sport]
  const isSportPage = !!sportConfig

  const headerSubtitle = subtitle ?? (
    isSportPage
      ? `${sportConfig.subtitle} ${PAGE_NAMES[page] ?? page}`
      : PAGE_NAMES[segments[0]] ?? ""
  )

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                {headerSubtitle && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{headerSubtitle}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop: Persistent sport tabs */}
          <div className="hidden md:flex items-center gap-1.5">
            {Object.entries(SPORT_CONFIG).map(([slug, cfg]) => {
              const isActive = pathname.startsWith(`/${slug}`)
              const firstDash = cfg.nav[0]?.href ?? `/${slug}`
              return (
                <Link
                  key={slug}
                  href={firstDash}
                  className={isActive ? SPORT_TAB_ACTIVE : SPORT_TAB_INACTIVE}
                >
                  {cfg.subtitle}
                </Link>
              )
            })}
          </div>

          {/* Mobile hamburger menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-80 bg-background overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <Logo className="h-4 w-4" />
                  </div>
                  HeatCheck HQ
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-5">
                {/* Sport tabs for quick switching */}
                <div className="flex items-center gap-1.5 px-3">
                  {Object.entries(SPORT_CONFIG).map(([slug, cfg]) => {
                    const isActive = pathname.startsWith(`/${slug}`)
                    const firstDash = cfg.nav[0]?.href ?? `/${slug}`
                    return (
                      <Link
                        key={slug}
                        href={firstDash}
                        onClick={() => setMobileOpen(false)}
                        className={`flex-1 text-center py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {cfg.subtitle}
                      </Link>
                    )
                  })}
                </div>

                {/* Sport dashboards */}
                {Object.entries(SPORT_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="border-t border-border pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1 px-3">
                      {cfg.subtitle}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {cfg.nav.map(link => {
                        const isActive = pathname === link.href
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            aria-label={link.ariaLabel}
                            className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? "text-primary bg-primary/10 font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            <span className="flex-1">{link.label}</span>
                            <TierBadge tier={link.tier} />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Home */}
                <div className="border-t border-border pt-4">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Sub-nav: sport-specific dashboards ── */}
        {isSportPage && (
          <div className="border-t border-border/50 bg-muted/20">
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
              {sportConfig.nav.map((link) => {
                const isActive = pathname === link.href
                return isActive ? (
                  <span key={link.href} className={`${SUB_NAV_ACTIVE} flex-shrink-0`} aria-label={link.ariaLabel}>
                    {link.label}
                  </span>
                ) : (
                  <Link key={link.href} href={link.href} className={`${SUB_NAV_INACTIVE} flex-shrink-0`} aria-label={link.ariaLabel}>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Breadcrumbs ── */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-3 sm:pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {isSportPage ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={sportConfig.nav[0]?.href ?? `/${sport}`}>{sportConfig.subtitle}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {page && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{PAGE_NAMES[page] ?? page}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {PAGE_NAMES[segments[0]] ?? segments[0]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Welcome modal for first-time authenticated users ── */}
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />

      {/* ── Page content ── */}
      <div id="main-content">{children}</div>
    </div>
  )
}
