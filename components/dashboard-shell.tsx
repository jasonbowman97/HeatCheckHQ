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
import { OnboardingTooltip } from "@/components/onboarding-tooltip"
import { WelcomeModal, isOnboarded } from "@/components/welcome-modal"
import { useUserTier } from "@/components/user-tier-provider"

/* ─── Navigation config per sport ─── */

type Tier = "public" | "free" | "pro"

interface NavLink {
  href: string
  label: string
  tier: Tier
}

const MLB_NAV: NavLink[] = [
  { href: "/mlb/hot-hitters", label: "Hot Hitters", tier: "pro" },
  { href: "/mlb/hitting-stats", label: "Hitter vs Pitcher", tier: "pro" },
  { href: "/mlb/pitching-stats", label: "Pitching Stats", tier: "pro" },
  { href: "/mlb/nrfi", label: "NRFI", tier: "free" },
  { href: "/mlb/weather", label: "Weather", tier: "free" },
  { href: "/mlb/trends", label: "Trends", tier: "free" },
]

const NBA_NAV: NavLink[] = [
  { href: "/nba/first-basket", label: "First Basket", tier: "free" },
  { href: "/nba/head-to-head", label: "H2H", tier: "free" },
  { href: "/nba/defense-vs-position", label: "Def vs Pos", tier: "free" },
  { href: "/nba/trends", label: "Trends", tier: "free" },
]

const NFL_NAV: NavLink[] = [
  { href: "/nfl/matchup", label: "Matchup", tier: "pro" },
  { href: "/nfl/defense-vs-position", label: "Def vs Pos", tier: "free" },
  { href: "/nfl/trends", label: "Trends", tier: "free" },
]

const SPORT_CONFIG: Record<string, { nav: NavLink[]; subtitle: string; otherSports: { href: string; label: string }[] }> = {
  mlb: {
    nav: MLB_NAV,
    subtitle: "MLB",
    otherSports: [
      { href: "/nba", label: "NBA" },
      { href: "/nfl", label: "NFL" },
    ],
  },
  nba: {
    nav: NBA_NAV,
    subtitle: "NBA",
    otherSports: [
      { href: "/mlb", label: "MLB" },
      { href: "/nfl", label: "NFL" },
    ],
  },
  nfl: {
    nav: NFL_NAV,
    subtitle: "NFL",
    otherSports: [
      { href: "/mlb", label: "MLB" },
      { href: "/nba", label: "NBA" },
    ],
  },
}

/* ─── Human-readable page names for breadcrumbs ─── */

const PAGE_NAMES: Record<string, string> = {
  "hot-hitters": "Hot Hitters",
  "hitting-stats": "Hitter vs Pitcher",
  "pitching-stats": "Pitching Stats",
  nrfi: "NRFI",
  weather: "Weather",
  trends: "Trends",
  "first-basket": "First Basket",
  "head-to-head": "Head-to-Head",
  "defense-vs-position": "Defense vs Position",
  matchup: "Matchup",
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

/* ─── Shared class constants (hoisted to avoid re-creation) ─── */

const NAV_ACTIVE_CLASS = "text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md"
const NAV_INACTIVE_CLASS = "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"

/* ─── Component ─── */

interface DashboardShellProps {
  children: React.ReactNode
  /** Override subtitle shown under "HeatCheck HQ", e.g. "MLB Hot Hitters" */
  subtitle?: string
}

export function DashboardShell({ children, subtitle }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const userTier = useUserTier()

  useEffect(() => {
    if (userTier !== "anonymous" && !isOnboarded()) {
      const timer = setTimeout(() => setShowWelcome(true), 500)
      return () => clearTimeout(timer)
    }
  }, [userTier])

  // Derive sport and page from pathname
  const segments = pathname.split("/").filter(Boolean)
  const sport = segments[0] ?? "mlb"
  const page = segments[1] ?? ""
  const config = SPORT_CONFIG[sport]

  if (!config) {
    // Fallback for non-sport pages
    return <>{children}</>
  }

  const activeClass = NAV_ACTIVE_CLASS
  const inactiveClass = NAV_INACTIVE_CLASS

  const headerSubtitle = subtitle ?? `${config.subtitle} ${PAGE_NAMES[page] ?? page}`

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
              </div>
            </Link>
          </div>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 flex-wrap justify-end">
            {/* Other sports */}
            {config.otherSports.map((s) => (
              <Link key={s.href} href={s.href} className={inactiveClass}>
                {s.label}
              </Link>
            ))}
            <div className="h-5 w-px bg-border mx-1" />
            {/* Current sport links */}
            {config.nav.map((link) => {
              const isActive = pathname === link.href
              return isActive ? (
                <span key={link.href} className={activeClass}>
                  {link.label}
                </span>
              ) : (
                <Link key={link.href} href={link.href} className={inactiveClass}>
                  {link.label}
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
            <SheetContent side="right" className="w-[85vw] sm:w-72 bg-background">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <Logo className="h-4 w-4" />
                  </div>
                  HeatCheck HQ
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-5">
                {/* Current sport nav */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                    {config.subtitle}
                  </p>
                  <div className="flex flex-col gap-1">
                    {config.nav.map((link) => {
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "text-primary bg-primary/10 font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {link.label}
                          <TierBadge tier={link.tier} />
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Other sports */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Other Sports
                  </p>
                  <div className="flex flex-col gap-1">
                    {config.otherSports.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                </div>

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
      </header>

      {/* ── Breadcrumbs ── */}
      <div className="mx-auto max-w-[1440px] px-6 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${sport}`}>{config.subtitle}</Link>
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
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Welcome modal for first-time authenticated users ── */}
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />

      {/* ── Onboarding tips for first-time visitors ── */}
      <OnboardingTooltip pathname={pathname} />

      {/* ── Page content ── */}
      {children}
    </div>
  )
}
