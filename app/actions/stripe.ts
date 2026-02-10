"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

export async function createCheckoutSession(planId: string = "pro-monthly") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in to subscribe")
  }

  const product = PRODUCTS.find((p) => p.id === planId) ?? PRODUCTS[0]

  // Check if user already has a Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist, create it first
  if (profileError || !profile) {
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        subscription_tier: "free",
      })
      .select()
      .single()
  }

  let customerId = profile?.stripe_customer_id

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
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.com"}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    ui_mode: "embedded",
    metadata: {
      supabase_user_id: user.id,
    },
  })

  return { clientSecret: session.client_secret }
}
