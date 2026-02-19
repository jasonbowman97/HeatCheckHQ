"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Copy, Check, Users, DollarSign, TrendingUp } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AffiliateStats {
  signups: number
  conversions: number
  unpaid: number
}

interface Affiliate {
  id: string
  name: string
  code: string
  contact_email: string | null
  discord_server: string | null
  commission_cents: number
  trial_days: number
  is_active: boolean
  notes: string | null
  created_at: string
  stats: AffiliateStats
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formDiscord, setFormDiscord] = useState("")
  const [formCommission, setFormCommission] = useState("500")
  const [formTrialDays, setFormTrialDays] = useState("14")
  const [formNotes, setFormNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  useEffect(() => {
    loadAffiliates()
  }, [])

  async function loadAffiliates() {
    try {
      const res = await fetch("/api/affiliates")
      if (!res.ok) {
        if (res.status === 401) {
          setError("Unauthorized — admin access required")
          setLoading(false)
          return
        }
        throw new Error("Failed to load")
      }
      const data = await res.json()
      setAffiliates(data.affiliates)
    } catch {
      setError("Failed to load affiliates")
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          code: formCode,
          contact_email: formEmail || undefined,
          discord_server: formDiscord || undefined,
          commission_cents: parseInt(formCommission) || 500,
          trial_days: parseInt(formTrialDays) || 14,
          notes: formNotes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create")
        setSubmitting(false)
        return
      }

      // Reset form and reload
      setFormName("")
      setFormCode("")
      setFormEmail("")
      setFormDiscord("")
      setFormCommission("500")
      setFormTrialDays("14")
      setFormNotes("")
      setShowForm(false)
      setError(null)
      await loadAffiliates()
    } catch {
      setError("Failed to create affiliate")
    }
    setSubmitting(false)
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`https://heatcheckhq.io/join/${code}`)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function handleMarkPaid(affiliateId: string, affiliateName: string, amount: string) {
    if (!confirm(`Mark all unpaid conversions for "${affiliateName}" as paid (${amount})?`)) return

    setPayingId(affiliateId)
    try {
      const res = await fetch("/api/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to mark as paid")
      } else {
        await loadAffiliates()
      }
    } catch {
      setError("Failed to mark as paid")
    }
    setPayingId(null)
  }

  // Totals
  const totalSignups = affiliates.reduce((sum, a) => sum + a.stats.signups, 0)
  const totalConversions = affiliates.reduce((sum, a) => sum + a.stats.conversions, 0)
  const totalOwed = affiliates.reduce(
    (sum, a) => sum + a.stats.unpaid * a.commission_cents,
    0
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Logo className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Affiliate Partners</h1>
              <p className="text-sm text-muted-foreground">Manage referral partners and track conversions</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" />
              Referred Signups
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSignups}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Paid Conversions
            </div>
            <p className="text-2xl font-bold text-foreground">{totalConversions}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Commission Owed
            </div>
            <p className="text-2xl font-bold text-foreground">${(totalOwed / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-lg border border-border bg-card p-6"
          >
            <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">New Partner</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Partner Name *</Label>
                <Input
                  id="name"
                  placeholder="BetSquad Discord"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="bg-background border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code" className="text-xs text-muted-foreground">Referral Code *</Label>
                <Input
                  id="code"
                  placeholder="betsquad"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  className="bg-background border-border font-mono"
                />
                {formCode && (
                  <p className="text-xs text-muted-foreground">
                    Link: heatcheckhq.io/join/{formCode}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@discord.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discord" className="text-xs text-muted-foreground">Discord Server</Label>
                <Input
                  id="discord"
                  placeholder="discord.gg/invite or server name"
                  value={formDiscord}
                  onChange={(e) => setFormDiscord(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="commission" className="text-xs text-muted-foreground">Commission (cents)</Label>
                <Input
                  id="commission"
                  type="number"
                  placeholder="500"
                  value={formCommission}
                  onChange={(e) => setFormCommission(e.target.value)}
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">${(parseInt(formCommission || "0") / 100).toFixed(2)} per conversion</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trial" className="text-xs text-muted-foreground">Trial Days</Label>
                <Input
                  id="trial"
                  type="number"
                  placeholder="14"
                  value={formTrialDays}
                  onChange={(e) => setFormTrialDays(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="notes" className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Internal notes about this partner"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? "Creating..." : "Create Partner"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Affiliate List */}
        {affiliates.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No affiliate partners yet. Click "Add Partner" to create one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {affiliates.map((affiliate) => (
              <div
                key={affiliate.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{affiliate.name}</h3>
                      {!affiliate.is_active && (
                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                          Inactive
                        </span>
                      )}
                    </div>
                    {affiliate.discord_server && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{affiliate.discord_server}</p>
                    )}
                  </div>
                  <button
                    onClick={() => copyLink(affiliate.code)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    {copiedCode === affiliate.code ? (
                      <>
                        <Check className="h-3 w-3 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  heatcheckhq.io/join/{affiliate.code}
                </div>

                <div className="mt-3 flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-muted-foreground">Signups: </span>
                    <span className="font-semibold text-foreground">{affiliate.stats.signups}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversions: </span>
                    <span className="font-semibold text-foreground">{affiliate.stats.conversions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unpaid: </span>
                    <span className="font-semibold text-primary">
                      ${((affiliate.stats.unpaid * affiliate.commission_cents) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commission: </span>
                    <span className="text-foreground">${(affiliate.commission_cents / 100).toFixed(2)}/conv</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trial: </span>
                    <span className="text-foreground">{affiliate.trial_days}d</span>
                  </div>
                </div>

                {affiliate.stats.unpaid > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() =>
                        handleMarkPaid(
                          affiliate.id,
                          affiliate.name,
                          `$${((affiliate.stats.unpaid * affiliate.commission_cents) / 100).toFixed(2)}`
                        )
                      }
                      disabled={payingId === affiliate.id}
                      className="flex items-center gap-1.5 rounded-md bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <DollarSign className="h-3 w-3" />
                      {payingId === affiliate.id
                        ? "Marking..."
                        : `Mark $${((affiliate.stats.unpaid * affiliate.commission_cents) / 100).toFixed(2)} as paid`}
                    </button>
                  </div>
                )}

                {affiliate.notes && (
                  <p className="mt-2 text-xs text-muted-foreground/70 italic">{affiliate.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
