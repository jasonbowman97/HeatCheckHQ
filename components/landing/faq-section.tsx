"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FadeIn } from "@/components/ui/fade-in"

const faqs = [
  {
    question: "Is HeatCheck HQ really free?",
    answer:
      "Yes — 9 dashboards across MLB, NBA, and NFL are completely free. No credit card, no trial period. Create an account in 10 seconds and start researching immediately.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "All dashboards pull fresh data daily. Trends, streaks, and matchup stats refresh every time games are played so you're always working with the latest numbers.",
  },
  {
    question: "What do I get with Pro?",
    answer:
      "Pro unlocks all 13 dashboards including Hot Hitters heatmaps, Hitter vs Pitcher breakdowns, Pitching Stats with arsenal analysis, and NFL Matchup comparisons. You also get priority access to every new dashboard we ship.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Both monthly and annual plans can be cancelled with one click — no hoops, no emails. You keep access through the end of your billing period.",
  },
  {
    question: "Which sports and leagues are covered?",
    answer:
      "MLB, NBA, and NFL. Each sport has purpose-built dashboards tailored to the stats and props that matter most. We're actively building dashboards for additional sports.",
  },
  {
    question: "Is this a picks or tout service?",
    answer:
      "No. HeatCheck HQ is a research platform. We surface raw data, trends, matchups, and visualizations — you make your own decisions. No locks, no guarantees, no records to chase.",
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-16 md:py-24 border-t border-border">
      <div className="mx-auto max-w-3xl px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              FAQ
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
              Common questions
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {faqs.map((faq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                  <div
                    className={`grid transition-all duration-200 ${
                      open === i ? "grid-rows-[1fr] mt-2 opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground mt-0.5 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
