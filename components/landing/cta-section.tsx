import { FadeIn } from "@/components/ui/fade-in"
import { AuthCta } from "@/components/landing/auth-cta"

export function CtaSection() {
  return (
    <section className="py-16 md:py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center gap-4 sm:gap-6 px-4 md:px-8 py-12 sm:py-16 text-center md:py-24">
              <h2 className="max-w-2xl text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
                The edge is in the data. Are you using it?
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Join for free in 30 seconds. No credit card required. Get instant
                access to heatmaps, streaks, and matchup tools across all three sports.
              </p>
              <AuthCta />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
