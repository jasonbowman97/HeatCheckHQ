import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Service role for reading/writing affiliate data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Admin email(s) that can access affiliate management
const ADMIN_EMAILS = ["jasonbowman97@gmail.com"]

async function isAdmin(): Promise<boolean> {
  try {
    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    return !!user && ADMIN_EMAILS.includes(user.email || "")
  } catch {
    return false
  }
}

/**
 * GET /api/affiliates — List all affiliates with stats
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all affiliates
  const { data: affiliates, error } = await supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get referral stats for each affiliate
  const affiliateIds = affiliates.map((a) => a.id)

  const { data: referrals } = await supabase
    .from("affiliate_referrals")
    .select("affiliate_id, converted_at, commission_paid")
    .in("affiliate_id", affiliateIds.length > 0 ? affiliateIds : ["none"])

  // Build stats per affiliate
  const stats = new Map<string, { signups: number; conversions: number; unpaid: number }>()
  for (const ref of referrals || []) {
    const s = stats.get(ref.affiliate_id) || { signups: 0, conversions: 0, unpaid: 0 }
    s.signups++
    if (ref.converted_at) {
      s.conversions++
      if (!ref.commission_paid) s.unpaid++
    }
    stats.set(ref.affiliate_id, s)
  }

  const result = affiliates.map((a) => ({
    ...a,
    stats: stats.get(a.id) || { signups: 0, conversions: 0, unpaid: 0 },
  }))

  return NextResponse.json({ affiliates: result })
}

/**
 * POST /api/affiliates — Create a new affiliate
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, code, contact_email, discord_server, commission_cents, trial_days, notes } = body

  if (!name || !code) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
  }

  // Normalize code: lowercase, alphanumeric + hyphens only
  const normalizedCode = code.toLowerCase().replace(/[^a-z0-9-]/g, "")

  const { data, error } = await supabase
    .from("affiliates")
    .insert({
      name,
      code: normalizedCode,
      contact_email: contact_email || null,
      discord_server: discord_server || null,
      commission_cents: commission_cents || 500,
      trial_days: trial_days || 14,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ affiliate: data })
}
