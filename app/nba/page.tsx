import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AppShell } from "@/components/app-shell"

const NBA_DASHBOARDS = [
  {
    name: "First Basket",
    href: "/nba/first-basket",
    description: "Tip-off win %, first shot %, first basket rate — ranked by composite score",
    tier: "free" as const,
  },
  {
    name: "Head-to-Head",
    href: "/nba/head-to-head",
    description: "Team H2H history, momentum trends, and injury reports for today's matchups",
    tier: "free" as const,
  },
  {
    name: "Defense vs Position",
    href: "/nba/defense-vs-position",
    description: "Which teams give up the most points, rebounds, assists, and threes to each position",
    tier: "free" as const,
  },
  {
    name: "Streak Tracker",
    href: "/nba/streaks",
    description: "Set custom stat thresholds for PTS, REB, AST, 3PM, STL, BLK — see which players consistently hit your lines",
    tier: "free" as const,
  },
]

export default function NBAHubPage() {
  return (
    <AppShell subtitle="NBA Dashboards">
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">NBA Dashboards</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            First basket probabilities, team head-to-head history, defensive position rankings, and active player streaks.
          </p>
          <p className="mt-1 text-xs text-primary font-medium">All NBA dashboards are free during our launch promotion.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NBA_DASHBOARDS.map((d) => (
            <Link
              key={d.name}
              href={d.href}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {d.name}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                  Free
                </span>
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
