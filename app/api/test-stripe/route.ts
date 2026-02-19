import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  try {
    const key = process.env.STRIPE_SECRET_KEY || ''
    diagnostics.keyPrefix = key.substring(0, 8) || 'missing'
    diagnostics.keyLength = key.length
    diagnostics.hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    diagnostics.hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    diagnostics.hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
    diagnostics.vercelUrl = process.env.VERCEL_URL || 'NOT SET'

    if (!key) {
      diagnostics.error = 'STRIPE_SECRET_KEY is not set'
      return NextResponse.json(diagnostics, { status: 500 })
    }

    // Try initializing Stripe
    const stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' })

    // Try to retrieve the monthly price to verify key + price ID match
    const priceId = 'price_1T0VQJDuniHIJa3prCpquQ3q'
    diagnostics.testingPriceId = priceId

    const price = await stripe.prices.retrieve(priceId)
    diagnostics.priceFound = true
    diagnostics.priceActive = price.active
    diagnostics.priceAmount = price.unit_amount
    diagnostics.priceCurrency = price.currency
    diagnostics.priceMode = price.livemode ? 'LIVE' : 'TEST'

    return NextResponse.json(diagnostics)
  } catch (error: unknown) {
    const err = error as { type?: string; code?: string; message?: string; statusCode?: number }
    diagnostics.error = err.message || 'Unknown error'
    diagnostics.stripeErrorType = err.type || 'unknown'
    diagnostics.stripeErrorCode = err.code || 'unknown'
    diagnostics.stripeStatusCode = err.statusCode || 'unknown'
    return NextResponse.json(diagnostics, { status: 500 })
  }
}
