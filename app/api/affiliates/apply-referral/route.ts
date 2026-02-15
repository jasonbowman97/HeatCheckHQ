import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Service role — needs to write to affiliates tables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/affiliates/apply-referral
 * Called after a user signs up with an affiliate cookie.
 * Links the user to the affiliate and grants a Pro trial.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, affiliateCode } = await request.json()

    if (!userId || !affiliateCode) {
      return NextResponse.json({ error: "Missing userId or affiliateCode" }, { status: 400 })
    }

    // Look up the affiliate
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, trial_days, is_active")
      .eq("code", affiliateCode.toLowerCase())
      .single()

    if (!affiliate || !affiliate.is_active) {
      return NextResponse.json({ error: "Invalid affiliate code" }, { status: 404 })
    }

    // Check if user already has a referral (prevent double-counting)
    const { data: existing } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Already referred" }, { status: 200 })
    }

    // Calculate trial expiration
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + affiliate.trial_days)

    // Create the referral record
    await supabase.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      user_id: userId,
      trial_expires_at: trialExpiresAt.toISOString(),
    })

    // Update the user's profile with trial info
    await supabase
      .from("profiles")
      .update({
        referred_by_affiliate: affiliate.id,
        trial_expires_at: trialExpiresAt.toISOString(),
        subscription_tier: "pro", // Grant Pro access during trial
      })
      .eq("id", userId)

    return NextResponse.json({
      message: "Referral applied",
      trialDays: affiliate.trial_days,
      trialExpiresAt: trialExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error("[Affiliate Apply Referral]", error)
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 })
  }
}
