import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { AppShell } from "@/components/app-shell"

const MLB_DASHBOARDS = [
  {
    name: "NRFI",
    href: "/mlb/nrfi",
    description: "No Run First Inning records, streaks, and opponent rankings",
    tier: "free" as const,
  },
  {
    name: "Weather",
    href: "/mlb/weather",
    description: "Ballpark temps, wind direction & speed, altitude impact",
    tier: "free" as const,
  },
  {
    name: "Due for HR",
    href: "/mlb/due-for-hr",
    description: "Statcast barrel rate, exit velocity, and xSLG gap — find hitters due for more homers",
    tier: "free" as const,
  },
  {
    name: "Streak Tracker",
    href: "/mlb/streaks",
    description: "Set custom stat thresholds for H, HR, RBI, R, SB, TB, K — see which batters and pitchers consistently hit your lines",
    tier: "pro" as const,
  },
  {
    name: "Hot Hitters",
    href: "/mlb/hot-hitters",
    description: "Active hitting, XBH, and HR streaks across all players",
    tier: "pro" as const,
  },
  {
    name: "Hitter vs Pitcher",
    href: "/mlb/hitting-stats",
    description: "Batter vs pitcher matchups, exit velo, barrel rates, platoon splits",
    tier: "pro" as const,
  },
  {
    name: "Pitching Stats",
    href: "/mlb/pitching-stats",
    description: "ERA, K%, CSW%, pitch arsenal breakdowns",
    tier: "pro" as const,
  },
]

export default function MLBHubPage() {
  return (
    <AppShell subtitle="MLB Dashboards">
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">MLB Dashboards</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pitcher arsenals, batter vs. pitcher matchups, NRFI probabilities, weather impact, and active streaks.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MLB_DASHBOARDS.map((d) => (
            <Link
              key={d.name}
              href={d.href}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {d.name}
                </h3>
                {d.tier === "pro" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                    <Lock className="h-2.5 w-2.5" />
                    Pro
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                    Free
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {d.description}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open dashboard
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
