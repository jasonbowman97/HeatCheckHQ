import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const planId = body.planId || "pro-monthly"
    const returnPath = body.returnPath || ""
    const product = PRODUCTS.find((p) => p.id === planId) ?? PRODUCTS[0]

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.io"
    const returnParams = new URLSearchParams({ session_id: "{CHECKOUT_SESSION_ID}" })
    if (returnPath) returnParams.set("return", returnPath)
    const returnUrl = `${baseUrl}/checkout/return?${returnParams.toString()}`

    // Check if user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // ── Authenticated user checkout (existing flow) ──
    if (user) {
      // Check if user already has a profile and Stripe customer ID
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError || !profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            subscription_tier: "free",
          })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json({ error: `Failed to create profile: ${insertError.message}` }, { status: 500 })
        }
        profile = newProfile
      }

      let customerId = profile?.stripe_customer_id

      // Verify existing customer is valid in current Stripe mode, or create a new one
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId)
        } catch {
          // Customer doesn't exist in live mode (was a test mode customer) -- reset it
          customerId = null
        }
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        })
        customerId = customer.id

        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id)
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price: product.stripePriceId,
            quantity: 1,
          },
        ],
        return_url: returnUrl,
        ui_mode: "embedded",
        metadata: {
          supabase_user_id: user.id,
        },
      })

      return NextResponse.json({ clientSecret: session.client_secret })
    }

    // ── Guest checkout (no account yet) ──
    // In subscription mode, Stripe automatically creates a customer.
    // The checkout form collects email by default. Webhook creates
    // the Supabase account after payment succeeds.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      return_url: returnUrl,
      ui_mode: "embedded",
      metadata: {
        source: "guest_checkout",
      },
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[Stripe Checkout API] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
