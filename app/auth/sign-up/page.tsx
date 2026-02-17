"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/logo"
import { Shield, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { analytics } from "@/lib/analytics"

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const refCode = searchParams.get("ref")

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_BASE_URL
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
            : `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Apply affiliate referral if present (cookie from /join/[code] or ?ref= param)
    const affiliateCode = refCode || getCookie("hchq_ref")
    if (affiliateCode && data.user) {
      try {
        await fetch("/api/affiliates/apply-referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            affiliateCode,
          }),
        })
      } catch {
        // Non-blocking — don't prevent signup if referral fails
        console.error("[Affiliate] Failed to apply referral")
      }
    }

    analytics.signupCompleted(affiliateCode ? "affiliate" : "email")
    router.push("/auth/sign-up-success")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Logo className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">HeatCheck HQ</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Create your free account — takes 30 seconds</p>
        </div>

        {refCode && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-center text-sm text-green-400">
            <Gift className="h-4 w-4" />
            <span>You've been invited — 2 weeks of Pro access free!</span>
          </div>
        )}

        {redirect && !refCode && (
          <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-center text-sm text-primary">
            Create an account to continue to checkout
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient()
              // Apply affiliate code if present
              const affiliateCode = refCode || getCookie("hchq_ref")
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo:
                    (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin) +
                    "/auth/callback" +
                    (redirect ? `?next=${encodeURIComponent(redirect)}` : ""),
                },
              })
            }}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignUp} aria-label="Create account" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-describedby={error ? "signup-error" : undefined}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password" className="text-sm text-foreground">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <p id="signup-error" role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Creating account..." : refCode ? "Claim free Pro trial" : "Create free account — instant access"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>No credit card required. Cancel anytime.</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>12 dashboards</span>
          <span className="h-3 w-px bg-border" />
          <span>3 sports</span>
          <span className="h-3 w-px bg-border" />
          <span>Updated daily</span>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={redirect ? `/auth/login?redirect=${redirect}` : "/auth/login"} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
