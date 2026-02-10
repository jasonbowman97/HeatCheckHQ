import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Preview the dashboards with limited data.",
    cta: "Get started free",
    ctaVariant: "outline" as const,
    highlights: [
      { text: "NRFI, Weather & First Basket (no account)", included: true },
      { text: "Defense vs Position & all Trends pages", included: true },
      { text: "Full dashboard access", included: false },
      { text: "Hot Hitters, Hitting & Pitching Stats", included: false },
      { text: "Head-to-Head & NFL Matchup", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description:
      "Gain the advantage with expert-curated insights, comprehensive analytics, and live data updates to power smarter, faster decisions and keep you ahead of the competition.",
    cta: "Get Pro",
    ctaVariant: "default" as const,
    popular: true,
    highlights: [
      { text: "Everything in Free", included: true },
      { text: "Hot Hitters, Hitting & Pitching Stats", included: true },
      { text: "Head-to-Head & NFL Matchup", included: true },
      { text: "All dashboards across MLB, NBA, NFL", included: true },
      { text: "Real-time data & advanced filtering", included: true },
      { text: "Cancel anytime", included: true },
    ],
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Pricing
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              Start free. Unlock everything for $12/mo.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Preview the data for free, then go Pro for full access to every dashboard, filter,
              and insight.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={0.1 + index * 0.1}>
              <div
                className={`relative flex flex-col rounded-xl border p-8 h-full ${
                  plan.popular
                    ? "border-primary bg-card shadow-lg shadow-primary/5"
                    : "border-border bg-card"
                }`}
              >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8 flex flex-col gap-3">
                {plan.highlights.map((item) => (
                  <div
                    key={item.text}
                    className={`flex items-start gap-3 text-sm ${item.included ? "text-foreground" : "text-muted-foreground/50"}`}
                  >
                    {item.included ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-transparent border-border text-foreground hover:bg-secondary"
                  }`}
                  variant={plan.ctaVariant}
                  size="lg"
                  asChild
                >
                  <Link href={plan.popular ? "/checkout" : "/auth/sign-up"}>{plan.cta}</Link>
                </Button>
              </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
