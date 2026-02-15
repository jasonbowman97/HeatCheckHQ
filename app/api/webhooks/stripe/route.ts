import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Use service role key for webhook (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const subscriptionId = session.subscription as string

      if (userId && subscriptionId) {
        // Upgrade to paid Pro — clear trial_expires_at so getUserTier
        // treats this as a real paid subscription, not a trial
        await supabase
          .from("profiles")
          .update({
            subscription_tier: "pro",
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            trial_expires_at: null, // Clear trial — now a paid subscriber
          })
          .eq("id", userId)

        // Track affiliate conversion if this user was referred
        await trackAffiliateConversion(userId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const tier =
        subscription.status === "active" || subscription.status === "trialing"
          ? "pro"
          : "free"

      await supabase
        .from("profiles")
        .update({ subscription_tier: tier })
        .eq("stripe_customer_id", customerId)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

/**
 * When a referred user converts to paid, mark the affiliate_referrals record
 * so the affiliate can be paid their commission.
 */
async function trackAffiliateConversion(userId: string) {
  try {
    const { data: referral } = await supabase
      .from("affiliate_referrals")
      .select("id, converted_at")
      .eq("user_id", userId)
      .single()

    // Only mark conversion if the user was referred AND hasn't already been counted
    if (referral && !referral.converted_at) {
      await supabase
        .from("affiliate_referrals")
        .update({ converted_at: new Date().toISOString() })
        .eq("id", referral.id)

      console.log(`[Affiliate] Conversion tracked for user ${userId}, referral ${referral.id}`)
    }
  } catch {
    // Non-critical — don't fail the webhook
    console.error(`[Affiliate] Failed to track conversion for user ${userId}`)
  }
}
