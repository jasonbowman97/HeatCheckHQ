import Link from "next/link"
import { ArrowRight, BarChart3, TrendingUp, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"
import { CountUp } from "@/components/ui/count-up"

const dashboardPreviews = [
  {
    sport: "MLB",
    label: "Pitching Stats",
    cols: ["Pitcher", "ERA", "K%", "CSW%", "HR/9", "Barrel%"],
    href: "/mlb/pitching-stats",
  },
  {
    sport: "NBA",
    label: "First Basket",
    cols: ["Player", "Tip Win%", "1st Shot%", "1st Bsk Made", "Rank"],
    href: "/nba/first-basket",
  },
  {
    sport: "NFL",
    label: "Matchup",
    cols: ["Stat", "Away", "Rank", "Home", "Rank"],
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
                12 dashboards across MLB, NBA, and NFL
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground text-balance md:text-6xl lg:text-7xl">
              Spot the edge{" "}
              <span className="text-primary">before the line moves</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              NRFI probabilities, first basket rankings, pitcher arsenals,
              head-to-head breakdowns, and hot/cold trend alerts -- all updated
              daily and built for sharps who need data, not noise.
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base" asChild>
                <Link href="/mlb/hitting-stats">
                  Explore dashboards
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent h-12 px-8 text-base border-border text-foreground hover:bg-secondary" asChild>
                <Link href="#dashboards">See all dashboards</Link>
              </Button>
            </div>
          </FadeIn>

          {/* Three mini dashboard previews */}
          <div className="mt-20 w-full grid gap-4 md:grid-cols-3">
            {dashboardPreviews.map((preview, index) => (
              <FadeIn key={preview.label} delay={0.5 + index * 0.1}>
                <Link
                  href={preview.href}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {preview.sport}
                    </span>
                    <span className="text-xs font-medium text-foreground">{preview.label}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${preview.cols.length}, 1fr)` }}>
                    {preview.cols.map((col, i) => (
                      <div key={`${col}-${i}`} className="h-2 rounded bg-secondary/80">
                        <span className="sr-only">{col}</span>
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`row-${preview.label}-${i}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${preview.cols.length}, 1fr)` }}>
                      {preview.cols.map((_, j) => (
                        <div
                          key={`cell-${preview.label}-${i}-${j}`}
                          className={`h-2 rounded ${
                            j === 0
                              ? "bg-secondary/50"
                              : i + j < 3
                                ? "bg-primary/25"
                                : i + j > 5
                                  ? "bg-destructive/20"
                                  : "bg-secondary/40"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* Stat highlights */}
          <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16">
            <FadeIn delay={0.8}>
              <div className="flex flex-col items-center gap-1">
                <BarChart3 className="h-5 w-5 text-primary mb-2" />
                <CountUp value={12} className="text-2xl font-bold text-foreground md:text-3xl" />
                <span className="text-xs text-muted-foreground md:text-sm">Dashboards</span>
              </div>
            </FadeIn>
            <FadeIn delay={0.9}>
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="h-5 w-5 text-accent mb-2" />
                <CountUp value={100} suffix="+" className="text-2xl font-bold text-foreground md:text-3xl" />
                <span className="text-xs text-muted-foreground md:text-sm">Tracked Metrics</span>
              </div>
            </FadeIn>
            <FadeIn delay={1.0}>
              <div className="flex flex-col items-center gap-1">
                <Flame className="h-5 w-5 text-primary mb-2" />
                <CountUp value={3} className="text-2xl font-bold text-foreground md:text-3xl" />
                <span className="text-xs text-muted-foreground md:text-sm">Trend Trackers</span>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}
