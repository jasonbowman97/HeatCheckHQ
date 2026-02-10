"use client"

import { useCallback, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import { PRODUCTS } from "@/lib/products"
import Link from "next/link"
import { BarChart3, ArrowLeft, Check } from "lucide-react"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("pro-monthly")
  const [checkoutStarted, setCheckoutStarted] = useState(false)

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-destructive mb-2">Stripe Not Configured</p>
          <p className="text-sm text-muted-foreground">
            Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your Vercel environment variables.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const fetchClientSecret = useCallback(async () => {
    try {
      const { clientSecret } = await createCheckoutSession(selectedPlan)
      if (!clientSecret) throw new Error("No client secret returned")
      return clientSecret
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout")
      throw err
    }
  }, [selectedPlan])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">HeatCheck HQ Pro</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Link
              href="/auth/login"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Sign in first
            </Link>
          </div>
        ) : !checkoutStarted ? (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Choose your plan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Full access to every dashboard across MLB, NBA, and NFL.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PRODUCTS.map((plan) => {
                const isSelected = selectedPlan === plan.id
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex flex-col rounded-xl border p-5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    {plan.savings && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-primary-foreground">
                        {plan.savings}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {plan.interval === "month" ? "Monthly" : "Annual"}
                      </span>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        ${(plan.priceInCents / 100).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {plan.interval}
                      </span>
                    </div>
                    {plan.interval === "year" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Just ${((plan.priceInCents / 100) / 12).toFixed(2)}/mo
                      </p>
                    )}
                  </button>
                )
              })}
            </div>

            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Hot Hitters, Hitting and Pitching Stats
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Head-to-Head and NFL Matchup
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                All dashboards across MLB, NBA, NFL
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Cancel anytime
              </li>
            </ul>

            <button
              onClick={() => setCheckoutStarted(true)}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue to payment
            </button>
          </div>
        ) : (
          <div id="checkout" className="rounded-xl overflow-hidden">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  )
}
