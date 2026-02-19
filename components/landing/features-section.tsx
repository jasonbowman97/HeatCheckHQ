import { Filter, BarChart3, TrendingUp, Shield, Users, AlertTriangle } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"

const features = [
  {
    icon: BarChart3,
    title: "Heatmap-Colored Stat Tables",
    description:
      "Every stat cell is color-coded from red to green so you can instantly see who's elite and who's struggling. Applied across ERA, K%, NRFI%, tip win rates, and more.",
  },
  {
    icon: TrendingUp,
    title: "Hot & Cold Trend Detection",
    description:
      "Automatically surfaces players on multi-game streaks -- hitting XBH, scoring 25+, or rushing 100+ yards. Catches cold slumps too, so you know who to fade.",
  },
  {
    icon: Filter,
    title: "Deep Filtering",
    description:
      "Slice data by pitcher hand (RHP/LHP), time range (L5, L10, season), date windows, matchup, and game slate. Built for granular analysis, not broad overviews.",
  },
  {
    icon: Users,
    title: "Head-to-Head Breakdowns",
    description:
      "Team vs team history, momentum indicators, win/loss streaks, ATS records, and defense vs position rankings. Know the matchup before you commit.",
  },
  {
    icon: Shield,
    title: "Pitch Arsenal Drill-Downs",
    description:
      "Click any pitcher to see their full arsenal -- usage %, AVG, SLG, ISO, barrel rate, and hard-hit rate per pitch. Color-coded so you spot the exploitable pitch instantly.",
  },
  {
    icon: AlertTriangle,
    title: "Injury & Availability Tracking",
    description:
      "Live injury reports with Day-to-Day and Out status badges for both teams. Know exactly which key players are missing before making any decisions.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Features
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              Built for the way serious bettors research
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
              Every filter, heatmap, and trend alert is designed to surface
              actionable edges faster — across MLB, NBA, and NFL.
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={0.1 + index * 0.05}>
              <div className="group flex flex-col gap-3 sm:gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 transition-colors hover:border-primary/30 h-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
