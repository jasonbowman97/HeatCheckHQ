"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, ArrowLeft, Crown, User, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Profile {
  subscription_tier: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export default function AccountPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, stripe_customer_id, stripe_subscription_id, created_at")
        .eq("id", user.id)
        .single()

      setProfile(profile)
      setLoading(false)
    }

    loadAccount()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const tier = profile?.subscription_tier || "free"
  const isPro = tier === "pro"
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Your Account</h1>
            <p className="text-sm text-muted-foreground">Manage your subscription and profile</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Profile Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Profile</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member since</span>
                <span className="text-sm text-foreground">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Subscription</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current plan</span>
                <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  isPro
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isPro ? "Pro - $12/mo" : "Free"}
                </span>
              </div>

              {isPro ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    You have access to all dashboards across MLB, NBA, and NFL.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit border-border text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href="/api/stripe/portal">Manage billing</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro to unlock all dashboards including Hot Hitters, Hitter vs Pitcher, Pitching Stats, Head-to-Head, and NFL Matchup.
                  </p>
                  <Button
                    size="sm"
                    className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
                    asChild
                  >
                    <Link href="/checkout">Upgrade to Pro - $12/mo</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Access Overview Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Your Access</h2>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { name: "NRFI", available: true },
                { name: "Weather", available: true },
                { name: "First Basket", available: true },
                { name: "Defense vs Position", available: true },
                { name: "Trends (all sports)", available: true },
                { name: "Hot Hitters", available: isPro },
                { name: "Hitter vs Pitcher", available: isPro },
                { name: "Pitching Stats", available: isPro },
                { name: "Head-to-Head", available: isPro },
                { name: "NFL Matchup", available: isPro },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  {item.available ? (
                    <span className="text-xs font-medium text-primary">Unlocked</span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground/50">Pro only</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
