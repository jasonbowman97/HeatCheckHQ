import Link from "next/link"
import { HeatCheckLogo } from "@/components/ui/sport-icons"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import { nflTrends, nflCategories } from "@/lib/nfl-trends-data"
import { getNFLStreakTrends } from "@/lib/nfl-streaks"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: "HeatCheck HQ - NFL Active Streaks",
  description: "Active passing, rushing, and receiving streaks for NFL players based on recent game-by-game performance.",
}

async function getLiveTrends() {
  try {
    const trends = await getNFLStreakTrends()
    return trends.length > 0 ? trends : null
  } catch {
    return null
  }
}

export default async function NFLTrendsPage() {
  const liveTrends = await getLiveTrends()
  const trends = liveTrends ?? nflTrends
  const isLive = !!liveTrends
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <HeatCheckLogo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">NFL Trends</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Matchup
            </Link>
            <Link href="/nfl/redzone" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Redzone
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Trends
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <TrendsDashboard
          trends={trends}
          categories={nflCategories}
          title="NFL Active Streaks"
          subtitle="Players on active hot and cold streaks based on recent game-by-game performance. Identifies patterns like '3 straight games with 300+ pass yards' or '5 straight games with a rushing TD' to spot current form."
          isLive={isLive}
        />
      </main>
    </div>
  )
}
