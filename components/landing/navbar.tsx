"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  ChevronDown,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { AuthButtons, MobileAuthButtons } from "@/components/auth-buttons"

type Tier = "public" | "free" | "pro"

const sportLinks = [
  {
    sport: "MLB",
    pages: [
      { name: "Hot Hitters", href: "/mlb/hot-hitters", tier: "pro" as Tier },
      { name: "Hitter vs Pitcher", href: "/mlb/hitting-stats", tier: "pro" as Tier },
      { name: "Pitching Stats", href: "/mlb/pitching-stats", tier: "pro" as Tier },
      { name: "NRFI", href: "/mlb/nrfi", tier: "free" as Tier },
      { name: "Weather", href: "/mlb/weather", tier: "free" as Tier },
      { name: "Due for HR", href: "/mlb/due-for-hr", tier: "free" as Tier },
      { name: "Streak Tracker", href: "/mlb/streaks", tier: "pro" as Tier },
    ],
  },
  {
    sport: "NBA",
    pages: [
      { name: "First Basket", href: "/nba/first-basket", tier: "free" as Tier },
      { name: "Head-to-Head", href: "/nba/head-to-head", tier: "free" as Tier },
      { name: "Def vs Pos", href: "/nba/defense-vs-position", tier: "free" as Tier },
      { name: "Streak Tracker", href: "/nba/streaks", tier: "free" as Tier },
    ],
  },
  {
    sport: "NFL",
    pages: [
      { name: "Matchup", href: "/nfl/matchup", tier: "pro" as Tier },
      { name: "Def vs Pos", href: "/nfl/defense-vs-position", tier: "free" as Tier },
      { name: "Streak Tracker", href: "/nfl/streaks", tier: "pro" as Tier },
    ],
  },
]

function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "public") return null
  if (tier === "pro") {
    return (
      <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
        Pro
      </span>
    )
  }
  return (
    <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      Free
    </span>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback((key: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setOpenDropdown(key)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
      closeTimeoutRef.current = null
    }, 150)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Logo className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            HeatCheck HQ
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Prop Analyzer — direct link, highlighted */}
          <Link
            href="/check"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Prop Analyzer
          </Link>

          <a href="#dashboards" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboards
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Sport dropdowns */}
          {sportLinks.map((sport) => (
            <div
              key={sport.sport}
              className="relative"
              onMouseEnter={() => handleMouseEnter(sport.sport)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpenDropdown(openDropdown === sport.sport ? null : sport.sport)}
              >
                {sport.sport}
                <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === sport.sport ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === sport.sport && (
                <div className="absolute top-full left-0 pt-2 w-40 md:w-48">
                  <div className="rounded-lg border border-border bg-card p-1.5 shadow-xl shadow-background/50">
                    {sport.pages.map((page) => (
                      <Link
                        key={page.href}
                        href={page.href}
                        className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {page.name}
                        <TierBadge tier={page.tier} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden items-center md:flex">
          <AuthButtons />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 sm:px-6 py-5 sm:py-6 md:hidden max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <Link href="/check" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-primary">Prop Analyzer</Link>
            <a href="#dashboards" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Dashboards</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Pricing</a>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Blog</Link>

            {/* Sport sections */}
            {sportLinks.map((sport) => (
              <div key={sport.sport} className="border-t border-border/50 pt-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  {sport.sport}
                </p>
                <div className="flex flex-col gap-1.5 pl-2">
                  {sport.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <MobileAuthButtons />
          </div>
        </div>
      )}
    </header>
  )
}
