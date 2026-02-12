import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { TrendsDashboard } from "@/components/trends/trends-dashboard"
import { mlbTrends, mlbCategories } from "@/lib/mlb-trends-data"
import { getMLBStreakTrends } from "@/lib/mlb-streaks"

export const revalidate = 43200

export const metadata = {
  title: "HeatCheck HQ - MLB Active Streaks",
  description: "Active hitting and pitching streaks for MLB players. Identify hot hands and cold slumps based on recent game-by-game performance.",
}

async function getLiveTrends() {
  try {
    const trends = await getMLBStreakTrends()
    return trends.length > 0 ? trends : null
  } catch {
    return null
  }
}

export default async function MLBTrendsPage() {
  const liveTrends = await getLiveTrends()
  const trends = liveTrends ?? mlbTrends
  const isLive = !!liveTrends
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">MLB Trends</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb/hot-hitters" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hot Hitters
            </Link>
            <Link href="/mlb/hitting-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Hitter vs Pitcher
            </Link>
            <Link href="/mlb/pitching-stats" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Pitching Stats
            </Link>
            <Link href="/mlb/nrfi" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NRFI
            </Link>
            <Link href="/mlb/weather" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Weather
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Trends
            </span>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NBA
            </Link>
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <TrendsDashboard
          trends={trends}
          categories={mlbCategories}
          title="MLB Active Streaks"
          subtitle="Players on active hot and cold streaks based on recent game-by-game performance. Identifies patterns like '9 hits in last 10 games' or '5 straight quality starts' to spot current form, not just season totals."
          isLive={isLive}
        />
      </main>
    </div>
  )
}
