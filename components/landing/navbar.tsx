"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  SearchCheck,
  Radio,
  Bell,
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

const toolLinks = [
  {
    category: "Analyze",
    pages: [
      { name: "Check My Prop", href: "/check", tier: "free" as Tier, icon: SearchCheck, desc: "Validate any prop bet" },
    ],
  },
  {
    category: "Game Day",
    pages: [
      { name: "Situation Room", href: "/situation-room", tier: "pro" as Tier, icon: Radio, desc: "Live command center" },
    ],
  },
  {
    category: "Track",
    pages: [
      { name: "Alerts", href: "/alerts", tier: "pro" as Tier, icon: Bell, desc: "Research-based alerts" },
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
          <a href="#dashboards" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboards
          </a>
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Blog
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Tools mega-dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("tools")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              onClick={() => setOpenDropdown(openDropdown === "tools" ? null : "tools")}
            >
              <SearchCheck className="h-3.5 w-3.5" />
              Tools
              <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === "tools" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "tools" && (
              <div className="absolute top-full right-0 pt-2 w-[480px]">
                <div className="rounded-xl border border-border bg-card p-4 shadow-xl shadow-background/50">
                  {/* Free tier CTA */}
                  <Link
                    href="/check"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 mb-3 group hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                      <SearchCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Check My Prop</p>
                      <p className="text-[11px] text-muted-foreground">Validate any prop bet — free</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>

                  {/* Categories */}
                  <div className="grid grid-cols-3 gap-3">
                    {toolLinks.map(cat => (
                      <div key={cat.category}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-1">
                          {cat.category}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {cat.pages.filter(p => p.href !== "/check").map(page => {
                            const Icon = page.icon
                            return (
                              <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground group"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Icon className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors flex-shrink-0" />
                                <span className="truncate">{page.name}</span>
                                {page.tier === "pro" && (
                                  <span className="ml-auto text-[8px] font-bold uppercase text-primary/60">Pro</span>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
            <a href="#dashboards" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Dashboards</a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Pricing</a>
            <Link href="/blog" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Blog</Link>

            {/* Tools section */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                Tools
              </p>
              {toolLinks.map(cat => (
                <div key={cat.category} className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 pl-2">
                    {cat.category}
                  </p>
                  <div className="flex flex-col gap-1 pl-2">
                    {cat.pages.map(page => {
                      const Icon = page.icon
                      return (
                        <Link
                          key={page.href}
                          href={page.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                          {page.name}
                          {page.tier === "pro" && (
                            <span className="ml-auto text-[9px] font-bold uppercase text-primary/60">Pro</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

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
