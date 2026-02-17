import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role for reading/writing affiliate data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get the currently logged-in user, or null.
 */
async function getUser() {
  try {
    const serverClient = await createServerClient()
    const {
      data: { user },
    } = await serverClient.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * Generate a short referral code from the user's email.
 * e.g. "jason.bowman34@gmail.com" -> "jasonbowman34"
 * If that's taken, append a random suffix.
 */
function generateCode(email: string): string {
  const local = email.split("@")[0] || "user"
  return local
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20)
}

/**
 * GET /api/referrals/me
 * Returns the current user's referral affiliate (if one exists)
 * along with a signup count.
 */
export async function GET() {
  const user = await getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Look up affiliate by contact_email matching the user's email
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, code, is_active, created_at")
    .eq("contact_email", user.email)
    .single()

  if (!affiliate) {
    return NextResponse.json({ affiliate: null })
  }

  // Count referral signups
  const { count } = await supabase
    .from("affiliate_referrals")
    .select("id", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id)

  return NextResponse.json({
    affiliate: {
      code: affiliate.code,
      is_active: affiliate.is_active,
      signups: count || 0,
      created_at: affiliate.created_at,
    },
  })
}

/**
 * POST /api/referrals/me
 * Creates a referral affiliate for the current user if one doesn't exist.
 */
export async function POST() {
  const user = await getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user already has an affiliate
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id, code")
    .eq("contact_email", user.email)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "You already have a referral link", code: existing.code },
      { status: 409 }
    )
  }

  // Generate a unique code
  let code = generateCode(user.email)

  // Check if the code is taken; if so, append random digits
  const { data: codeCheck } = await supabase
    .from("affiliates")
    .select("id")
    .eq("code", code)
    .single()

  if (codeCheck) {
    code = `${code}-${Math.random().toString(36).slice(2, 6)}`
  }

  // Derive a display name from the email
  const name = user.email.split("@")[0] || "User"

  const { data: affiliate, error } = await supabase
    .from("affiliates")
    .insert({
      name,
      code,
      contact_email: user.email,
      commission_cents: 0, // User referrals — no commission
      trial_days: 14,
      notes: "Self-service referral from account page",
    })
    .select("id, code, created_at")
    .single()

  if (error) {
    console.error("[Referral] Failed to create affiliate:", error)
    return NextResponse.json(
      { error: "Failed to create referral link" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    affiliate: {
      code: affiliate.code,
      is_active: true,
      signups: 0,
      created_at: affiliate.created_at,
    },
  })
}
