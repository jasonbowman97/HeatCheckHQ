"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Crown, User, CreditCard, Users, Copy, Check } from "lucide-react"
import { Logo } from "@/components/logo"
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
  const [referral, setReferral] = useState<{ code: string; signups: number } | null>(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
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

      // Load referral data
      try {
        const refRes = await fetch("/api/referrals/me")
        if (refRes.ok) {
          const refData = await refRes.json()
          if (refData.affiliate) {
            setReferral({ code: refData.affiliate.code, signups: refData.affiliate.signups })
          }
        }
      } catch {
        // Silently fail — referral section will show "Generate" button
      }
    }

    loadAccount()
  }, [router])

  async function generateReferralLink() {
    setReferralLoading(true)
    setReferralError(null)
    try {
      const res = await fetch("/api/referrals/me", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.affiliate) {
        setReferral({ code: data.affiliate.code, signups: 0 })
      } else if (res.status === 409 && data.code) {
        // Already exists — just load it
        setReferral({ code: data.code, signups: 0 })
      } else {
        setReferralError(data.error || "Failed to generate referral link")
      }
    } catch {
      setReferralError("Failed to generate referral link")
    }
    setReferralLoading(false)
  }

  function copyReferralLink() {
    if (!referral) return
    navigator.clipboard.writeText(`https://heatcheckhq.io/join/${referral.code}`)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 2000)
  }

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
            <Logo className="h-6 w-6" />
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
                    Upgrade to Pro for unlimited data, all filters, and zero gates across every dashboard.
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

          {/* Refer a Friend Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Refer a Friend</h2>
            </div>

            {referral ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Share your referral link and give friends a free 14-day Pro trial when they sign up.
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground select-all overflow-hidden text-ellipsis whitespace-nowrap">
                    heatcheckhq.io/join/{referral.code}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-border text-muted-foreground hover:text-foreground"
                    onClick={copyReferralLink}
                  >
                    {referralCopied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Friends referred</span>
                  <span className="text-sm font-semibold text-foreground">{referral.signups}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Generate a personal referral link to share with friends. They get a free 14-day Pro trial when they sign up.
                </p>

                {referralError && (
                  <p className="text-sm text-destructive">{referralError}</p>
                )}

                <Button
                  size="sm"
                  className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={generateReferralLink}
                  disabled={referralLoading}
                >
                  {referralLoading ? "Generating..." : "Generate Referral Link"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
