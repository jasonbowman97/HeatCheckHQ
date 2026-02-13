import Link from "next/link"
import { Logo } from "@/components/logo"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import { nbaTrends, nbaCategories } from "@/lib/nba-trends-data"
import { getNBAStreakTrends } from "@/lib/nba-streaks"

export const revalidate = 43200

async function getLiveTrends() {
  try {
    const trends = await getNBAStreakTrends()
    return trends.length > 0 ? trends : null
  } catch {
    return null
  }
}

export default async function NBATrendsPage() {
  const liveTrends = await getLiveTrends()
  const trends = liveTrends ?? nbaTrends
  const isLive = !!liveTrends
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Logo className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">NBA Trends</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              First Basket
            </Link>
            <Link href="/nba/head-to-head" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              H2H
            </Link>
            <Link href="/nba/defense-vs-position" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Def vs Pos
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Trends
            </span>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 flex flex-col gap-6">
        <TrendsDashboard
          trends={trends}
          categories={nbaCategories}
          title="NBA Active Streaks"
          subtitle="Players on active hot and cold streaks based on recent game-by-game performance. Identifies patterns like '7 straight games with 25+ points' or '5 straight double-doubles' to spot current form."
          isLive={isLive}
        />
        <ProUpsellBanner
          headline="Unlock Head-to-Head, Matchups & more with Pro"
          description="Full access to all 12 dashboards across MLB, NBA, and NFL — $12/mo"
        />
      </main>
    </div>
  )
}
