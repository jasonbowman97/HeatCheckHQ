import { Filter, BarChart3, TrendingUp, Shield, Users, AlertTriangle, Search } from "lucide-react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"

const tools = [
  {
    icon: Search,
    title: "Prop Analyzer",
    description:
      "Search any player and instantly see all their props analyzed — hit rates, trends, and a 7-factor convergence score for every stat line. Full game log with convergence signals inline.",
    href: "/check",
    cta: "Try it free",
  },
]

const dashboardFeatures = [
  {
    icon: BarChart3,
    title: "Heatmap-Colored Stat Tables",
    description:
      "Every stat cell is color-coded from red to green so you can instantly see who's elite and who's struggling.",
  },
  {
    icon: TrendingUp,
    title: "Hot & Cold Trend Detection",
    description:
      "Automatically surfaces players on multi-game streaks. Catches cold slumps too, so you know who to fade.",
  },
  {
    icon: Filter,
    title: "Deep Filtering & Custom Alerts",
    description:
      "Slice data by pitcher hand, time range, matchup, and slate. Set thresholds and get notified when criteria hit.",
  },
  {
    icon: Users,
    title: "Head-to-Head Breakdowns",
    description:
      "Team vs team history, momentum indicators, win/loss streaks, ATS records, and defense vs position rankings.",
  },
  {
    icon: Shield,
    title: "Pitch Arsenal Drill-Downs",
    description:
      "Click any pitcher to see their full arsenal — usage %, AVG, SLG, ISO, barrel rate, and hard-hit rate per pitch.",
  },
  {
    icon: AlertTriangle,
    title: "Injury & Availability Tracking",
    description:
      "Live injury reports with Day-to-Day and Out status badges for both teams. Know who's missing before committing.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Tools & Features
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              Research tools built for finding edges
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
              From prop validation to full-slate research — every tool, filter,
              and heatmap is designed to surface actionable edges faster.
            </p>
          </div>
        </FadeIn>

        {/* Featured tool — single card */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 max-w-2xl mx-auto mb-6">
          {tools.map((tool, index) => (
            <FadeIn key={tool.title} delay={0.1 + index * 0.05}>
              <Link
                href={tool.href}
                className="group flex flex-col gap-4 rounded-xl border border-primary/20 bg-card p-5 sm:p-8 transition-colors hover:border-primary/40 hover:bg-primary/[0.02] h-full shadow-sm shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Tool
                    </span>
                    <h3 className="text-lg font-semibold text-foreground">
                      {tool.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                  {tool.description}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  {tool.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* Dashboard features — compact grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardFeatures.map((feature, index) => (
            <FadeIn key={feature.title} delay={0.2 + index * 0.05}>
              <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-6 transition-colors hover:border-primary/30 h-full">
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
