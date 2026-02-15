"use client"

import { useCallback, useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import { PRODUCTS } from "@/lib/products"
import Link from "next/link"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("pro-monthly")
  const [checkoutStarted, setCheckoutStarted] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Define fetchClientSecret first (before any conditional returns)
  const fetchClientSecret = useCallback(async () => {
    console.log("[v0] Fetching client secret for plan:", selectedPlan)
    const result = await createCheckoutSession(selectedPlan)
    console.log("[v0] createCheckoutSession result:", JSON.stringify(result))

    if (result.error) {
      console.error("[v0] Server returned error:", result.error)
      setError(result.error)
      throw new Error(result.error)
    }

    if (!result.clientSecret) {
      console.error("[v0] No client secret returned")
      setError("No client secret returned from server")
      throw new Error("No client secret returned")
    }

    console.log("[v0] Client secret received successfully")
    return result.clientSecret
  }, [selectedPlan])

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()

        // First check session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session check:', session ? 'Found' : 'Not found')

        if (!session) {
          console.log('No session, redirecting to login')
          router.push('/auth/login?redirect=/checkout')
          return
        }

        // Double check user
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('User check:', user ? user.email : 'Not found', error)

        if (!user) {
          console.log('No user, redirecting to login')
          router.push('/auth/login?redirect=/checkout')
          return
        }

        console.log('Auth successful, showing checkout')
        setIsAuthenticated(true)
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth/login?redirect=/checkout')
      }
    }

    checkAuth()
  }, [router])

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render checkout if not authenticated (router.push will redirect)
  if (!isAuthenticated) {
    return null
  }

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
              <Logo className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">HeatCheck HQ Pro</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => { setError(null); setCheckoutStarted(false) }}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
              <Link
                href="/auth/login?redirect=/checkout"
                className="text-sm text-muted-foreground hover:underline"
              >
                Sign in again
              </Link>
            </div>
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
