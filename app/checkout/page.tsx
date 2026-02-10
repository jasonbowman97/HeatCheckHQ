"use client"

import { useCallback, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import Link from "next/link"
import { BarChart3, ArrowLeft } from "lucide-react"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export default function CheckoutPage() {
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      const { clientSecret } = await createCheckoutSession()
      if (!clientSecret) throw new Error("No client secret returned")
      return clientSecret
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout")
      throw err
    }
  }, [])

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
