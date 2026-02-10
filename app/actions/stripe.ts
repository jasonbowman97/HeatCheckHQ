"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

export async function createCheckoutSession(planId: string = "pro-monthly") {
  try {
    console.log("[Stripe] Starting checkout session creation for plan:", planId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[Stripe] No user found")
      throw new Error("You must be logged in to subscribe")
    }

    console.log("[Stripe] User found:", user.email)

    const product = PRODUCTS.find((p) => p.id === planId) ?? PRODUCTS[0]
    console.log("[Stripe] Product selected:", product.name, product.stripePriceId)

  // Check if user already has a profile and Stripe customer ID
  console.log("[Stripe] Checking for existing profile...")
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  console.log("[Stripe] Profile query result:", { profile, profileError })

  // If profile doesn't exist, create it first
  if (profileError || !profile) {
    console.log("[Stripe] Creating new profile...")
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
      console.error("[Stripe] Failed to create profile:", insertError)
      throw new Error(`Failed to create user profile: ${insertError.message}`)
    }

    console.log("[Stripe] Profile created:", newProfile)
    profile = newProfile
  }

  let customerId = profile?.stripe_customer_id
  console.log("[Stripe] Customer ID from profile:", customerId)

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    console.log("[Stripe] Creating new Stripe customer...")
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    console.log("[Stripe] Stripe customer created:", customerId)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Stripe] Failed to update profile with Stripe customer ID:", updateError)
      // Continue anyway since we have the customerId
    } else {
      console.log("[Stripe] Profile updated with Stripe customer ID")
    }
  }

  // Build return URL - prefer VERCEL_URL (auto-set by Vercel to the correct deployment domain)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.com"

  const returnUrl = `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
  console.log("[Stripe] Return URL:", returnUrl)

  console.log("[Stripe] Creating checkout session...")
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

  console.log("[Stripe] Checkout session created successfully:", session.id)
  return { clientSecret: session.client_secret }
  } catch (error) {
    console.error("[Stripe] Error in createCheckoutSession:", error)
    // Re-throw with more details
    if (error instanceof Error) {
      throw new Error(`Checkout failed: ${error.message}`)
    }
    throw error
  }
}
