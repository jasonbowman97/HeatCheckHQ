// ============================================================
// app/api/auth/trial/route.ts — Auto-activate 7-day Pro trial
// ============================================================
// Called once after signup (from auth callback). Sets
// trial_expires_at = now + 7 days on the user's profile.
// Idempotent — skips if user already has Pro or a trial set.

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email"

const TRIAL_DAYS = 7

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, trial_expires_at, stripe_subscription_id")
      .eq("id", user.id)
      .single()

    // Skip if already paid Pro
    if (profile?.stripe_subscription_id) {
      return NextResponse.json({ status: "already_pro" })
    }

    // Skip if trial already set (active or expired)
    if (profile?.trial_expires_at) {
      return NextResponse.json({ status: "trial_already_set" })
    }

    // Activate 7-day trial
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "pro",
        trial_expires_at: trialEnd.toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("[Trial] Failed to activate trial:", error)
      return NextResponse.json({ error: "Failed to activate trial" }, { status: 500 })
    }

    // Send welcome email (non-blocking — don't fail the trial if email fails)
    if (user.email) {
      sendWelcomeEmail(user.email, user.user_metadata?.full_name).catch((err) =>
        console.error("[Trial] Welcome email failed:", err)
      )
    }

    return NextResponse.json({ status: "trial_activated", expires_at: trialEnd.toISOString() })
  } catch (err) {
    console.error("[Trial] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
