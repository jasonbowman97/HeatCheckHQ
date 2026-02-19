import { FadeIn } from "@/components/ui/fade-in"
import { CountUp } from "@/components/ui/count-up"

export function SocialProof() {
  return (
    <section className="border-y border-border bg-card/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
          <FadeIn delay={0.1}>
            <div className="text-center">
              <CountUp value={14} className="text-3xl font-bold text-foreground font-mono" />
              <p className="mt-1 text-sm text-muted-foreground">Dashboards live</p>
            </div>
          </FadeIn>
          <div className="hidden h-8 w-px bg-border md:block" />
          <FadeIn delay={0.2}>
            <div className="text-center">
              <CountUp value={3} className="text-3xl font-bold text-foreground font-mono" />
              <p className="mt-1 text-sm text-muted-foreground">Sports covered</p>
            </div>
          </FadeIn>
          <div className="hidden h-8 w-px bg-border md:block" />
          <FadeIn delay={0.3}>
            <div className="text-center">
              <CountUp value={100} suffix="+" className="text-3xl font-bold text-foreground font-mono" />
              <p className="mt-1 text-sm text-muted-foreground">Metrics tracked</p>
            </div>
          </FadeIn>
          <div className="hidden h-8 w-px bg-border md:block" />
          <FadeIn delay={0.4}>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary font-mono">Daily</p>
              <p className="mt-1 text-sm text-muted-foreground">Data updates</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
