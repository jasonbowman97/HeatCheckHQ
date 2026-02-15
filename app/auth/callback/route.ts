import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code is missing or exchange failed, send to login with a friendly message
  // instead of showing a scary error page
  return NextResponse.redirect(
    `${origin}/auth/login?message=${encodeURIComponent("Your link has expired or was already used. Please sign in below.")}`
  )
}
