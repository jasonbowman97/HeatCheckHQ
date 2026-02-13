import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"
import { BaseballIcon, BasketballIcon, FootballIcon } from "@/components/ui/sport-icons"

const dashboardPreviews = [
  {
    sport: "MLB",
    label: "NRFI",
    icon: BaseballIcon,
    description: "No Run First Inning probabilities, pitcher matchups, and streak data.",
    href: "/mlb/nrfi",
  },
  {
    sport: "NBA",
    label: "First Basket",
    icon: BasketballIcon,
    description: "Tip-off win rates, first shot percentages, and player rankings.",
    href: "/nba/first-basket",
  },
  {
    sport: "NFL",
    label: "Matchup",
    icon: FootballIcon,
    description: "Side-by-side team stats, positional splits, and game log trends.",
    href: "/nfl/matchup",
  },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <FadeIn delay={0.1}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                Live for the 2025-26 season — data updated daily
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground text-balance md:text-6xl lg:text-7xl">
              Spot winning edges{" "}
              <span className="text-primary">before the line moves</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              Heatmaps, streaks, matchup breakdowns, and prop research tools across
              MLB, NBA, and NFL. Updated daily so you never miss an edge.
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base" asChild>
                <Link href="/auth/sign-up">
                  Start free — no credit card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent h-12 px-8 text-base border-border text-foreground hover:bg-secondary" asChild>
                <Link href="#pricing">View pricing</Link>
              </Button>
            </div>
          </FadeIn>

          {/* Three sport preview cards */}
          <div className="mt-20 w-full grid gap-4 md:grid-cols-3">
            {dashboardPreviews.map((preview, index) => (
              <FadeIn key={preview.label} delay={0.5 + index * 0.1}>
                <Link
                  href={preview.href}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <preview.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {preview.sport}
                        </span>
                        <p className="text-sm font-semibold text-foreground">{preview.label}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {preview.description}
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
