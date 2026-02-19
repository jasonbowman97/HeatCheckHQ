"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { analytics } from "@/lib/analytics"

/**
 * Smart CTA button that shows "Create free account" for anonymous visitors
 * and "Go to dashboards" for logged-in users.
 */
export function AuthCta({ size = "lg", className, location = "unknown" }: { size?: "default" | "lg"; className?: string; location?: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
    })
  }, [])

  // Show nothing while checking (prevents layout shift)
  if (loggedIn === null) {
    return (
      <Button size={size} className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base ${className ?? ""}`} disabled>
        <span className="opacity-0">Loading</span>
      </Button>
    )
  }

  if (loggedIn) {
    return (
      <Button size={size} className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base ${className ?? ""}`} asChild>
        <Link href="/nba" onClick={() => analytics.ctaClicked(location, "Go to dashboards")}>
          Go to dashboards
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  return (
    <Button size={size} className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base ${className ?? ""}`} asChild>
      <Link href="/auth/sign-up" onClick={() => analytics.ctaClicked(location, "Create free account")}>
        Create free account
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  )
}
