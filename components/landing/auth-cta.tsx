"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

/**
 * Smart CTA button that shows "Create free account" for anonymous visitors
 * and "Go to dashboards" for logged-in users.
 */
export function AuthCta({ size = "lg", className }: { size?: "default" | "lg"; className?: string }) {
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
        <Link href="/nba">
          Go to dashboards
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  return (
    <Button size={size} className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base ${className ?? ""}`} asChild>
      <Link href="/auth/sign-up">
        Create free account
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  )
}
