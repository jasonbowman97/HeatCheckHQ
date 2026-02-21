import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"
import { AuthCta } from "@/components/landing/auth-cta"

/** Set to a real path (e.g. "/screenshots/hero-dashboard.png") once a screenshot is captured */
const HERO_IMAGE_SRC: string | null = null

/* ── Placeholder skeleton that mimics a dashboard UI ── */
function HeroDashboardPlaceholder() {
  return (
    <div className="relative aspect-[16/9] bg-gradient-to-br from-card via-muted/30 to-card p-4 sm:p-8">
      {/* Fake toolbar row */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="h-3 w-16 rounded bg-primary/25" />
        <div className="h-3 w-12 rounded bg-muted-foreground/10" />
        <div className="h-3 w-14 rounded bg-muted-foreground/10" />
        <div className="ml-auto h-3 w-20 rounded bg-muted-foreground/8" />
      </div>

      {/* Fake table header */}
      <div className="flex gap-3 mb-3 px-1">
        <div className="h-2 w-24 rounded bg-primary/20" />
        <div className="h-2 w-16 rounded bg-primary/15" />
        <div className="h-2 w-20 rounded bg-primary/15" />
        <div className="h-2 w-12 rounded bg-primary/15" />
        <div className="h-2 w-16 rounded bg-primary/15" />
      </div>

      {/* Fake data rows with heatmap-style coloring */}
      <div className="space-y-2.5">
        {[
          { widths: [28, 14, 22, 10, 14], colors: ["bg-emerald-500/25", "bg-emerald-400/20", "bg-emerald-500/20", "bg-primary/15", "bg-emerald-400/25"] },
          { widths: [24, 16, 18, 12, 16], colors: ["bg-emerald-400/20", "bg-emerald-500/25", "bg-amber-400/20", "bg-emerald-400/15", "bg-emerald-500/20"] },
          { widths: [30, 12, 20, 14, 12], colors: ["bg-amber-400/15", "bg-red-400/15", "bg-emerald-400/20", "bg-amber-400/20", "bg-emerald-400/15"] },
          { widths: [22, 18, 16, 10, 18], colors: ["bg-emerald-500/20", "bg-amber-400/20", "bg-red-400/15", "bg-emerald-400/20", "bg-primary/15"] },
          { widths: [26, 14, 24, 12, 14], colors: ["bg-red-400/15", "bg-emerald-400/20", "bg-emerald-500/25", "bg-amber-400/15", "bg-emerald-400/20"] },
          { widths: [20, 16, 18, 14, 16], colors: ["bg-emerald-400/15", "bg-primary/15", "bg-amber-400/20", "bg-red-400/15", "bg-amber-400/15"] },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-1" style={{ opacity: 1 - i * 0.08 }}>
            <div className="h-5 w-5 rounded bg-muted-foreground/10 shrink-0" />
            {row.widths.map((w, j) => (
              <div
                key={j}
                className={`h-3 rounded ${row.colors[j]}`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-visible pt-28 pb-0 md:pt-36 md:pb-0">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <FadeIn delay={0.1}>
            <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 sm:px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                Live for the 2025–26 season — updated daily
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="max-w-4xl text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground text-balance md:text-6xl lg:text-7xl">
              Your daily heat check{" "}
              <span className="text-primary">for every edge</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              The research platform built for sports bettors. Prop validation,
              heatmaps, streaks, and matchup breakdowns across MLB, NBA, and NFL
              — updated daily.
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <AuthCta location="hero" />
              <Button size="lg" variant="outline" className="bg-transparent h-12 px-8 text-base border-border text-foreground hover:bg-secondary" asChild>
                <Link href="#pricing">View pricing</Link>
              </Button>
            </div>
          </FadeIn>

          {/* Hero product screenshot — overlaps into the section below */}
          <FadeIn delay={0.5}>
            <div className="mt-12 sm:mt-16 relative mx-auto max-w-5xl translate-y-16 md:translate-y-24">
              {/* Glow effect */}
              <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />

              {/* Browser-style frame */}
              <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/10">
                {/* Browser chrome bar */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-card">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/40" />
                  <div className="ml-3 flex-1 h-5 rounded-md bg-muted/50 max-w-xs flex items-center px-2.5">
                    <span className="text-[9px] text-muted-foreground/50 truncate">heatcheckhq.io</span>
                  </div>
                </div>

                {/* Dashboard image or placeholder */}
                {HERO_IMAGE_SRC ? (
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={HERO_IMAGE_SRC}
                      alt="HeatCheck HQ dashboard showing heatmap-colored player stats"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                ) : (
                  <HeroDashboardPlaceholder />
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
