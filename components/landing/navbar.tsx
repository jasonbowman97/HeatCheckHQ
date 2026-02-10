"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const sportLinks = [
  {
    sport: "MLB",
    pages: [
      { name: "Hitting Stats", href: "/mlb/hitting-stats" },
      { name: "NRFI", href: "/mlb/nrfi" },
      { name: "Pitching Stats", href: "/mlb/pitching-stats" },
      { name: "Trends", href: "/mlb/trends" },
    ],
  },
  {
    sport: "NBA",
    pages: [
      { name: "First Basket", href: "/nba/first-basket" },
      { name: "Head-to-Head", href: "/nba/head-to-head" },
      { name: "Trends", href: "/nba/trends" },
    ],
  },
  {
    sport: "NFL",
    pages: [
      { name: "Matchup", href: "/nfl/matchup" },
      { name: "Trends", href: "/nfl/trends" },
    ],
  },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
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

          <div className="h-4 w-px bg-border" />

          {/* Sport dropdowns */}
          {sportLinks.map((sport) => (
            <div
              key={sport.sport}
              className="relative"
              onMouseEnter={() => setOpenDropdown(sport.sport)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpenDropdown(openDropdown === sport.sport ? null : sport.sport)}
              >
                {sport.sport}
                <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === sport.sport ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === sport.sport && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-border bg-card p-1.5 shadow-xl shadow-background/50">
                  {sport.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {page.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
            <Link href="/mlb/hitting-stats">Log in</Link>
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/mlb/hitting-stats">Sign up free</Link>
          </Button>
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
        <div className="border-t border-border bg-background px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="#dashboards" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Dashboards</a>
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Pricing</a>

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

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" asChild>
                <Link href="/mlb/hitting-stats">Log in</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                <Link href="/mlb/hitting-stats">Sign up free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
