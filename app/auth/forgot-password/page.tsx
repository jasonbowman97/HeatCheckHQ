"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`
        : `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
          <p className="mt-2 text-sm text-muted-foreground">Reset your password</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-foreground">
              Check your email for a password reset link. It may take a minute to arrive.
            </p>
            <Link
              href="/auth/login"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-1 text-primary hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
