import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/ui/fade-in"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "9 dashboards across MLB, NBA & NFL — no credit card, no trial.",
    cta: "Create free account",
    ctaVariant: "outline" as const,
    highlights: [
      { text: "First Basket picks with live tipoff data", included: true },
      { text: "NRFI matchups & stadium weather impact", included: true },
      { text: "Head-to-Head player comparisons", included: true },
      { text: "Defense vs Position rankings (NBA + NFL)", included: true },
      { text: "Active streak trends across all 3 sports", included: true },
      { text: "NBA dashboards free during launch promo", included: true },
    ],
  },
  {
    name: "Pro Monthly",
    price: "$12",
    period: "/month",
    description:
      "Every dashboard unlocked. Full MLB stats, NFL Matchup, and priority access to new features.",
    cta: "Unlock all dashboards",
    ctaVariant: "default" as const,
    popular: true,
    highlights: [
      { text: "Everything in Free", included: true },
      { text: "Hot Hitters — daily-updated heatmaps", included: true },
      { text: "Hitter vs Pitcher matchup breakdowns", included: true },
      { text: "Pitching Stats & arsenal analysis", included: true },
      { text: "NFL Matchup side-by-side comparison", included: true },
      { text: "New dashboards added first to Pro", included: true },
      { text: "Cancel anytime", included: true },
    ],
  },
  {
    name: "Pro Annual",
    price: "$100",
    period: "/year",
    description:
      "Full Pro access year-round — save 2 months vs. monthly billing.",
    cta: "Get 2 months free",
    ctaVariant: "default" as const,
    savings: "2 Months Free",
    highlights: [
      { text: "Everything in Pro Monthly", included: true },
      { text: "Just $8.33/mo — billed annually", included: true },
      { text: "All 13 dashboards across MLB, NBA, NFL", included: true },
      { text: "Save $44 vs. monthly", included: true },
      { text: "Priority access to new sports & features", included: true },
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
              Start free. Go Pro when you want the full edge.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Get instant access to 9 dashboards free — no credit card required.
              Upgrade to Pro for all 13 dashboards, advanced stats, and daily-updated data.
            </p>
            <p className="mx-auto mt-2 text-xs text-muted-foreground/70">
              NBA dashboards are free during our launch promotion. Real-time data across MLB, NBA, and NFL.
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
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
              {(plan as Record<string, unknown>).savings ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  {String((plan as Record<string, unknown>).savings)}
                </div>
              ) : null}

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
                  <Link href={plan.name === "Free" ? "/auth/sign-up" : "/checkout"}>{plan.cta}</Link>
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
