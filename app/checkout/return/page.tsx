"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

/** Validate the return path is a safe internal route */
function getSafeReturnPath(raw: string | null): string {
  if (!raw) return "/situation-room"
  // Only allow relative paths starting with /
  if (!raw.startsWith("/")) return "/situation-room"
  // Block protocol-relative URLs and external redirects
  if (raw.startsWith("//")) return "/situation-room"
  return raw
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  )
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const returnTo = getSafeReturnPath(searchParams.get("return"))

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const isGuest = isAuthenticated === false

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">HeatCheck HQ</span>
          </Link>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">Welcome to Pro</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Your subscription is active. You now have full access to every dashboard, insight, and tool across MLB, NBA, and NFL.
        </p>

        {isGuest && (
          <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex justify-center mb-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Check your email</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              We sent a link to set your password and access your account.
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>
        )}

        <Button
          className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <Link href={returnTo}>
            {returnTo === "/situation-room" ? "Open Situation Room" : "Continue to dashboard"}
          </Link>
        </Button>

        {isGuest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Already set your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
