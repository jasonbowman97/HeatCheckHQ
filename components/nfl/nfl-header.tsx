"use client"

import { Logo } from "@/components/logo"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/nfl/matchup", label: "Matchup" },
  { href: "/nfl/defense-vs-position", label: "Def vs Pos" },
  { href: "/nfl/trends", label: "Trends" },
]

export function NFLHeader() {
  const pathname = usePathname()

  const activeClass = "text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md"
  const inactiveClass = "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                HeatCheck HQ
              </h1>
              <p className="text-xs text-muted-foreground">NFL Dashboard</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/mlb/hitting-stats"
            className={inactiveClass}
          >
            MLB
          </Link>
          <Link
            href="/nba/first-basket"
            className={inactiveClass}
          >
            NBA
          </Link>
          {NAV_LINKS.map((link) => {
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
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
            2025-26 Season
          </span>
        </div>
      </div>
    </header>
  )
}
