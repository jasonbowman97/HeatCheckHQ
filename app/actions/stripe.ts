"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

export async function createCheckoutSession(planId: string = "pro-monthly") {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[Stripe] No authenticated user for checkout")
      throw new Error("You must be logged in to subscribe")
    }

    const product = PRODUCTS.find((p) => p.id === planId) ?? PRODUCTS[0]

  // Check if user already has a profile and Stripe customer ID
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist, create it first
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
      console.error("[Stripe] Failed to create profile:", insertError.message)
      throw new Error(`Failed to create user profile: ${insertError.message}`)
    }

    profile = newProfile
  }

  let customerId = profile?.stripe_customer_id

  // Verify existing customer is valid in current Stripe mode
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
    } catch {
      customerId = null
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Stripe] Failed to save customer ID:", updateError.message)
      // Continue anyway since we have the customerId
    }
  }

  // Build return URL - prefer VERCEL_URL (auto-set by Vercel to the correct deployment domain)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.io"

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

  return { clientSecret: session.client_secret }
  } catch (error) {
    console.error("[Stripe] Checkout error:", error instanceof Error ? error.message : "Unknown error")
    // Return error object instead of throwing -- thrown errors get redacted in production
    const message = error instanceof Error ? error.message : "Unknown error"
    return { clientSecret: null, error: message }
  }
}
