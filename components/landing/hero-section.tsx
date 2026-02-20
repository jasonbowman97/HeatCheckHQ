import Link from "next/link"
import { ArrowRight, Search, BarChart3, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"
import { BaseballIcon, BasketballIcon, FootballIcon } from "@/components/ui/sport-icons"
import { AuthCta } from "@/components/landing/auth-cta"

const dashboardPreviews = [
  {
    tag: "Tool",
    label: "Prop Analyzer",
    icon: Search,
    description: "See every prop for any player at a glance. 7-factor convergence analysis with full game log.",
    href: "/check",
    accent: true,
  },
  {
    tag: "Tool",
    label: "Custom Alerts",
    icon: Bell,
    description: "Set research criteria and get notified when props match your edge — never miss a play.",
    href: "/alerts",
    accent: true,
  },
  {
    tag: "MLB · NBA · NFL",
    label: "14 Dashboards",
    icon: BarChart3,
    description: "Heatmaps, streaks, matchup breakdowns, and more across all three sports.",
    href: "#dashboards",
    accent: false,
  },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
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
              Research tools &amp; dashboards{" "}
              <span className="text-primary">for every edge</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground text-pretty md:text-xl">
              Prop validation, full-slate research, heatmaps, streaks, and matchup
              breakdowns across MLB, NBA, and NFL. Updated daily so you never miss an edge.
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

          {/* Three preview cards — tools first, then dashboards */}
          <div className="mt-10 sm:mt-14 w-full grid gap-3 sm:gap-4 md:grid-cols-3">
            {dashboardPreviews.map((preview, index) => (
              <FadeIn key={preview.label} delay={0.3 + index * 0.05}>
                <Link
                  href={preview.href}
                  className={`group flex h-full flex-col rounded-xl border p-4 sm:p-5 transition-colors hover:border-primary/30 ${
                    preview.accent
                      ? "border-primary/20 bg-card shadow-sm shadow-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        preview.accent ? "bg-primary/15" : "bg-primary/10"
                      }`}>
                        <preview.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          preview.accent ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {preview.tag}
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
