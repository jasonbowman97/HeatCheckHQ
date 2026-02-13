import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

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
    name: "Trends",
    href: "/nba/trends",
    description: "Active streaks plus O/U consistency — who's hitting over or under key stat thresholds",
    tier: "free" as const,
  },
]

export default function NBAHubPage() {
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
                <p className="text-xs text-muted-foreground">NBA Dashboards</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/mlb" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <Link href="/nfl" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">NBA Dashboards</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            First basket probabilities, team head-to-head history, defensive position rankings, and active player streaks.
          </p>
          <p className="mt-1 text-xs text-primary font-medium">All NBA dashboards are free during our launch promotion.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  )
}
