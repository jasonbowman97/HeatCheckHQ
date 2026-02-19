import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { sendProUpgradeEmail, sendWelcomeEmail } from "@/lib/email"

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
      const isGuestCheckout = session.metadata?.source === "guest_checkout"

      if (userId && subscriptionId) {
        // ── Authenticated user checkout ──
        // Upgrade to paid Pro — clear trial_expires_at so getUserTier
        // treats this as a real paid subscription, not a trial
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "pro",
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            trial_expires_at: null, // Clear trial — now a paid subscriber
          })
          .eq("id", userId)

        if (error) {
          console.error("[Stripe Webhook] Failed to upgrade user:", userId, error)
          return NextResponse.json({ error: "DB write failed" }, { status: 500 })
        }

        // Send Pro upgrade email (non-blocking)
        const customer = await stripe.customers.retrieve(session.customer as string)
        if (!("deleted" in customer && customer.deleted) && customer.email) {
          const plan = session.metadata?.plan || "Pro"
          sendProUpgradeEmail(customer.email, plan).catch((err) =>
            console.error("[Stripe Webhook] Upgrade email failed:", err)
          )
        }

        // Track affiliate conversion if this user was referred
        await trackAffiliateConversion(userId)
      } else if (isGuestCheckout && subscriptionId) {
        // ── Guest checkout — create Supabase account ──
        await handleGuestCheckout(session, subscriptionId)
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

      const { error } = await supabase
        .from("profiles")
        .update({ subscription_tier: tier })
        .eq("stripe_customer_id", customerId)

      if (error) {
        console.error("[Stripe Webhook] Failed to update subscription tier:", customerId, error)
        return NextResponse.json({ error: "DB write failed" }, { status: 500 })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId)

      if (error) {
        console.error("[Stripe Webhook] Failed to downgrade subscription:", customerId, error)
        return NextResponse.json({ error: "DB write failed" }, { status: 500 })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle guest checkout: create a Supabase user account from the Stripe customer
 * email, create a profile, and upgrade to Pro. Sends a password reset email so
 * the user can set their password and log in.
 */
async function handleGuestCheckout(
  session: Stripe.Checkout.Session,
  subscriptionId: string
) {
  try {
    // Get customer email from Stripe
    const customerId = session.customer as string
    const customer = await stripe.customers.retrieve(customerId)

    if (customer.deleted) {
      console.error("[Guest Checkout] Customer was deleted:", customerId)
      return
    }

    const email = customer.email
    if (!email) {
      console.error("[Guest Checkout] No email on Stripe customer:", customerId)
      return
    }

    // Check if a Supabase user with this email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      // User exists — just link Stripe and upgrade to Pro
      await supabase
        .from("profiles")
        .upsert({
          id: existingUser.id,
          email,
          subscription_tier: "pro",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          trial_expires_at: null,
        })

      await trackAffiliateConversion(existingUser.id)
      return
    }

    // Create a new Supabase user (auto-confirmed, no email verification needed)
    const tempPassword = crypto.randomUUID()
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm — they already verified email with Stripe
    })

    if (createError || !newUser.user) {
      console.error("[Guest Checkout] Failed to create Supabase user:", createError)
      return
    }

    // Create profile with Pro tier
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email,
        subscription_tier: "pro",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        trial_expires_at: null,
      })

    if (profileError) {
      console.error("[Guest Checkout] Failed to create profile:", profileError)
      return
    }

    // Update Stripe customer with Supabase user ID for future webhook lookups
    await stripe.customers.update(customerId, {
      metadata: { supabase_user_id: newUser.user.id },
    })

    // Send password reset email so the user can set their password
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.io"
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?next=/account`,
      },
    })

    // Also send a proper recovery email the user can click
    // This uses Supabase's built-in email template
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback?next=/account`,
    })

    // Send welcome email via Resend (non-blocking)
    sendWelcomeEmail(email).catch((err) =>
      console.error("[Guest Checkout] Welcome email failed:", err)
    )

    await trackAffiliateConversion(newUser.user.id)
  } catch (error) {
    console.error("[Guest Checkout] Error:", error)
  }
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

      // Conversion tracked successfully
    }
  } catch {
    // Non-critical — don't fail the webhook
    console.error(`[Affiliate] Failed to track conversion for user ${userId}`)
  }
}
