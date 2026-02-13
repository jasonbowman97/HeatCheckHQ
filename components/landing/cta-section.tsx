import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"

export function CtaSection() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center gap-6 px-8 py-16 text-center md:py-24">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
                The edge is in the data. Are you using it?
              </h2>
              <p className="max-w-lg text-muted-foreground">
                Join for free in 30 seconds. No credit card required. Get instant
                access to heatmaps, streaks, and matchup tools across all three sports.
              </p>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8"
                asChild
              >
                <Link href="/auth/sign-up">
                  Create your free account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
