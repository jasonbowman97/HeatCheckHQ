import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const planId = body.planId || "pro-monthly"

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 })
    }

    const product = PRODUCTS.find((p) => p.id === planId) ?? PRODUCTS[0]

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

    // Create Stripe customer if doesn't exist
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.io"
    const returnUrl = `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[Stripe Checkout API] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
