import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-foreground">HeatCheck HQ</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Data-driven insight tools for MLB, NBA, and NFL.
              Updated daily.
            </p>
          </div>

          {/* MLB */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">MLB</p>
            <div className="flex flex-col gap-2">
              <Link href="/mlb/hot-hitters" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Hot Hitters</Link>
              <Link href="/mlb/hitting-stats" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Hitter vs Pitcher</Link>
              <Link href="/mlb/pitching-stats" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pitching Stats</Link>
              <Link href="/mlb/nrfi" className="text-xs text-muted-foreground hover:text-foreground transition-colors">NRFI</Link>
              <Link href="/mlb/weather" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Weather</Link>
              <Link href="/mlb/due-for-hr" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Due for HR</Link>
              <Link href="/mlb/streaks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Streak Tracker</Link>
            </div>
          </div>

          {/* NBA */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">NBA</p>
            <div className="flex flex-col gap-2">
              <Link href="/nba/streaks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Streak Tracker</Link>
              <Link href="/nba/first-basket" className="text-xs text-muted-foreground hover:text-foreground transition-colors">First Basket</Link>
              <Link href="/nba/head-to-head" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Head-to-Head</Link>
              <Link href="/nba/defense-vs-position" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Def vs Position</Link>
            </div>
          </div>

          {/* NFL */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">NFL</p>
            <div className="flex flex-col gap-2">
              <Link href="/nfl/matchup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Matchup</Link>
              <Link href="/nfl/defense-vs-position" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Def vs Position</Link>
              <Link href="/nfl/streaks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Streak Tracker</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 HeatCheck HQ. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/#dashboards" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Dashboards</Link>
            <Link href="/#features" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Features</Link>
            <Link href="/#pricing" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            <Link href="/blog" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Blog</Link>
            <Link href="/#support" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Support</Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
