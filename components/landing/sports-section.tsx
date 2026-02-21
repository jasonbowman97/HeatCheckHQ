import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { FadeIn } from "@/components/ui/fade-in"
import { BaseballIcon, BasketballIcon, FootballIcon } from "@/components/ui/sport-icons"

const sports = [
  {
    name: "MLB",
    label: "Baseball",
    icon: BaseballIcon,
    accentClass: "text-primary bg-primary/10",
    description:
      "Pitcher arsenals, batter vs. pitcher matchups, NRFI probabilities, and strikeout projections. Drill into every pitch type with heatmap-colored stat breakdowns.",
    dashboards: [
      { name: "Hot Hitters", href: "/mlb/hot-hitters", description: "Active hitting, XBH, and HR streaks across all players" },
      { name: "Hitter vs Pitcher", href: "/mlb/hitting-stats", description: "Batter vs pitcher matchups, exit velo, barrel rates, platoon splits" },
      { name: "Pitching Stats", href: "/mlb/pitching-stats", description: "ERA, K%, CSW%, pitch arsenal breakdowns" },
      { name: "NRFI", href: "/mlb/nrfi", description: "No Run First Inning records, streaks, opponent ranks" },
      { name: "Weather", href: "/mlb/weather", description: "Ballpark temps, wind direction & speed, altitude" },
      { name: "Due for HR", href: "/mlb/due-for-hr", description: "Statcast barrel rate, exit velo, xSLG gap — hitters due for homers" },
      { name: "Streak Tracker", href: "/mlb/streaks", description: "Custom stat thresholds for batters and pitchers" },
    ],
  },
  {
    name: "NBA",
    label: "Basketball",
    icon: BasketballIcon,
    accentClass: "text-primary bg-primary/10",
    description:
      "First basket probabilities, team head-to-head history, defensive position rankings, betting metrics, injury tracking, and momentum indicators.",
    dashboards: [
      { name: "First Basket", href: "/nba/first-basket", description: "Tip-off win %, 1st shot %, basket rank — includes team first FG tab" },
      { name: "2H First Basket & Team FG", href: "/nba/second-half", description: "Second half first scorer and team first field goal rates from Q3 play-by-play" },
      { name: "First 3 Min Scoring", href: "/nba/first-3min", description: "Points scored in the first 3 minutes of Q1 — hit rates at every threshold" },
      { name: "Head-to-Head", href: "/nba/head-to-head", description: "Team H2H, momentum, defense vs position, injuries" },
      { name: "Def vs Position", href: "/nba/defense-vs-position", description: "Which teams give up the most stats to each position" },
      { name: "Streak Tracker", href: "/nba/streaks", description: "Custom stat thresholds — see who consistently hits your lines" },
    ],
  },
  {
    name: "NFL",
    label: "Football",
    icon: FootballIcon,
    accentClass: "text-primary bg-primary/10",
    description:
      "Full team stat comparisons with league rankings, side-by-side passing, rushing, and receiving breakdowns with recent game log chips.",
    dashboards: [
      { name: "Matchup", href: "/nfl/matchup", description: "Team stats, positional splits, game log trends" },
      { name: "Def vs Position", href: "/nfl/defense-vs-position", description: "Which defenses give up the most to QBs, RBs, and WRs" },
      { name: "Streak Tracker", href: "/nfl/streaks", description: "Custom stat thresholds for QBs, RBs, and WRs" },
    ],
  },
]

export function SportsSection() {
  return (
    <section id="dashboards" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Dashboards
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              16 dashboards across every sport
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
              Each sport gets its own set of analytics dashboards tailored to the data points and
              prop markets that matter most.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport, index) => (
            <FadeIn key={sport.name} delay={0.1 + index * 0.1}>
              <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden h-full">
              {/* Sport header */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${sport.accentClass}`}>
                    <sport.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{sport.name}</h3>
                    <p className="text-xs text-muted-foreground">{sport.label}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {sport.description}
                </p>
              </div>

              {/* Dashboard links */}
              <div className="mt-auto border-t border-border">
                {sport.dashboards.map((dashboard, i) => (
                  <Link
                    key={dashboard.name}
                    href={dashboard.href}
                    className={`group flex items-center justify-between px-4 py-3 sm:p-4 transition-colors hover:bg-secondary/50 ${
                      i < sport.dashboards.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {dashboard.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {dashboard.description}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
