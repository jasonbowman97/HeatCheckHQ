import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { AppShell } from "@/components/app-shell"

const NFL_DASHBOARDS = [
  {
    name: "Defense vs Position",
    href: "/nfl/defense-vs-position",
    description: "Which defenses give up the most to QBs, RBs, and WRs",
    tier: "free" as const,
  },
  {
    name: "Streak Tracker",
    href: "/nfl/streaks",
    description: "Set custom stat thresholds for passing, rushing, and receiving stats — see which QBs, RBs, and WRs consistently hit your lines",
    tier: "pro" as const,
  },
  {
    name: "Matchup",
    href: "/nfl/matchup",
    description: "Full team stat comparisons, positional splits, and game log trends",
    tier: "pro" as const,
  },
]

export default function NFLHubPage() {
  return (
    <AppShell subtitle="NFL Dashboards">
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">NFL Dashboards</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Full team stat comparisons, defensive position rankings, and active player streaks across the league.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NFL_DASHBOARDS.map((d) => (
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
