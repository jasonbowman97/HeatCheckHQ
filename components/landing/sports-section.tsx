"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { FadeIn } from "@/components/ui/fade-in"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BaseballIcon, BasketballIcon, FootballIcon } from "@/components/ui/sport-icons"

const sports = [
  {
    name: "MLB",
    label: "Baseball",
    icon: BaseballIcon,
    description:
      "Pitcher arsenals, batter vs. pitcher matchups, NRFI probabilities, and strikeout projections. Drill into every pitch type with heatmap-colored stat breakdowns.",
    /** Set to a real path (e.g. "/screenshots/sports/mlb.png") once captured */
    screenshotSrc: null as string | null,
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
    description:
      "First basket probabilities, team head-to-head history, defensive position rankings, betting metrics, injury tracking, and momentum indicators.",
    screenshotSrc: null as string | null,
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
    description:
      "Full team stat comparisons with league rankings, side-by-side passing, rushing, and receiving breakdowns with recent game log chips.",
    screenshotSrc: null as string | null,
    dashboards: [
      { name: "Matchup", href: "/nfl/matchup", description: "Team stats, positional splits, game log trends" },
      { name: "Def vs Position", href: "/nfl/defense-vs-position", description: "Which defenses give up the most to QBs, RBs, and WRs" },
      { name: "Streak Tracker", href: "/nfl/streaks", description: "Custom stat thresholds for QBs, RBs, and WRs" },
    ],
  },
]

/* ── Screenshot preview or styled placeholder ── */
function SportScreenshotPreview({
  screenshotSrc,
  icon: Icon,
  sportName,
}: {
  screenshotSrc: string | null
  icon: typeof BaseballIcon
  sportName: string
}) {
  if (screenshotSrc) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <Image
          src={screenshotSrc}
          alt={`${sportName} dashboard preview`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </div>
    )
  }

  // Placeholder with sport icon and fake dashboard lines
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-muted/20 to-card shadow-lg">
      {/* Decorative fake table rows */}
      <div className="absolute inset-0 flex flex-col px-6 pt-10 gap-3 opacity-[0.06]">
        {/* Header row */}
        <div className="flex gap-3">
          <div className="h-2.5 w-20 rounded bg-foreground" />
          <div className="h-2.5 w-14 rounded bg-foreground" />
          <div className="h-2.5 w-16 rounded bg-foreground" />
          <div className="h-2.5 w-10 rounded bg-foreground" />
          <div className="h-2.5 w-14 rounded bg-foreground" />
        </div>
        {/* Data rows */}
        {[80, 65, 90, 55, 75, 60, 85, 50].map((w, i) => (
          <div key={i} className="flex gap-3" style={{ opacity: 1 - i * 0.08 }}>
            <div className="h-2 w-5 rounded bg-foreground" />
            {[w, w * 0.7, w * 0.85, w * 0.5, w * 0.75].map((cw, j) => (
              <div key={j} className="h-2 rounded bg-foreground" style={{ width: `${cw * 0.2}%` }} />
            ))}
          </div>
        ))}
      </div>

      {/* Centered sport icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
        <span className="text-xs font-medium text-muted-foreground/60">Dashboard Preview</span>
      </div>
    </div>
  )
}

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

        <FadeIn delay={0.1}>
          <Tabs defaultValue="MLB" className="w-full">
            {/* Tab triggers */}
            <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-3 bg-muted/50 h-12 rounded-xl p-1">
              {sports.map((sport) => (
                <TabsTrigger
                  key={sport.name}
                  value={sport.name}
                  className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                >
                  <sport.icon className="h-4 w-4" />
                  {sport.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab panels */}
            {sports.map((sport) => (
              <TabsContent key={sport.name} value={sport.name} className="mt-0">
                <div className="grid gap-6 lg:grid-cols-5">
                  {/* Left: sport info + dashboard links */}
                  <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                    {/* Sport header */}
                    <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-primary bg-primary/10">
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

                  {/* Right: screenshot preview */}
                  <div className="lg:col-span-3 flex items-center">
                    <SportScreenshotPreview
                      screenshotSrc={sport.screenshotSrc}
                      icon={sport.icon}
                      sportName={sport.name}
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </FadeIn>
      </div>
    </section>
  )
}
