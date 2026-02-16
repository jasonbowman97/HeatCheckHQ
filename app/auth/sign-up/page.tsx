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
