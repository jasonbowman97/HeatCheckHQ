import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Service role client — no user session needed, just validating the code exists
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Validate the affiliate code exists and is active
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, code, name, is_active")
    .eq("code", code.toLowerCase())
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://heatcheckhq.io"

  if (!affiliate || !affiliate.is_active) {
    // Invalid code — redirect to homepage
    return NextResponse.redirect(`${baseUrl}/?ref=invalid`)
  }

  // Set a cookie with the affiliate code so the sign-up flow can pick it up.
  // Cookie lasts 30 days — covers the case where user visits but signs up later.
  const response = NextResponse.redirect(
    `${baseUrl}/auth/sign-up?ref=${affiliate.code}`
  )

  response.cookies.set("hchq_ref", affiliate.code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return response
}
