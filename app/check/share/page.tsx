// ============================================================
// app/check/share/page.tsx — Public share page for prop checks
// ============================================================
// Read-only version of a prop check result for non-users.
// URL: /check/share?player=X&stat=Y&line=Z
// Shows the verdict + key stats + CTA to create account.

import { type Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateSEO } from "@/lib/seo"

interface Props {
  searchParams: Promise<{
    player?: string
    stat?: string
    line?: string
    verdict?: string
    direction?: string
    score?: string
    confidence?: string
    team?: string
    opp?: string
    home?: string
    sport?: string
    statLabel?: string
    hitRate?: string
    margin?: string
    avg?: string
    heatHitRate?: string
    streak?: string
  }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const playerName = params.player ?? "Player"
  const statLabel = params.statLabel ?? params.stat ?? "Stat"
  const line = params.line ?? "0"
  const verdict = params.verdict ?? "TOSS-UP"

  const title = `${playerName} ${statLabel} ${line} — ${verdict} | HeatCheck HQ`
  const description = `9-factor convergence analysis: ${playerName} ${statLabel} ${line}. Verdict: ${verdict}. Check your props free on HeatCheck HQ.`

  // Build share image URL
  const imageParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) imageParams.set(key, value)
  }
  const ogImageUrl = `https://heatcheckhq.io/api/check-prop/share-image?${imageParams.toString()}`

  return {
    ...generateSEO({
      title,
      description,
      path: `/check/share?${imageParams.toString()}`,
      image: ogImageUrl,
    }),
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 675 }],
      type: "website",
      siteName: "HeatCheck HQ",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@HeatCheckIO",
      site: "@HeatCheckIO",
    },
  }
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams
  const playerName = params.player ?? "Player"
  const statLabel = params.statLabel ?? params.stat ?? "Stat"
  const line = params.line ?? "0"
  const verdict = params.verdict ?? "TOSS-UP"
  const direction = params.direction ?? "toss-up"
  const score = params.score ?? "0"
  const confidence = params.confidence ?? "50"
  const teamAbbrev = params.team ?? ""
  const oppAbbrev = params.opp ?? ""
  const isHome = params.home === "true"
  const hitRate = params.hitRate ? Math.round(Number(params.hitRate) * 100) : 50
  const avgMargin = params.margin ? Number(params.margin) : 0
  const seasonAvg = params.avg ? Number(params.avg) : 0
  const streak = params.streak ? Number(params.streak) : 0

  const verdictColor =
    direction === "over" ? "text-emerald-400" :
    direction === "under" ? "text-red-400" :
    "text-yellow-400"

  const matchup = isHome ? `vs ${oppAbbrev}` : `@ ${oppAbbrev}`

  // Deep link back to the full check page
  const checkUrl = `/check?player=${encodeURIComponent(params.player ?? "")}&stat=${params.stat ?? ""}&line=${line}`

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Brand header */}
        <div className="text-center mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Shared from</p>
          <h1 className="text-xl font-bold text-foreground">HeatCheck HQ</h1>
        </div>

        {/* Player + Stat */}
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{playerName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {teamAbbrev} {matchup} &middot; {statLabel} {line}
          </p>
        </div>

        {/* Verdict card */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center mb-6">
          <p className={`text-3xl font-bold ${verdictColor}`}>
            {verdict}
          </p>
          <div className="flex items-baseline justify-center gap-1 mt-4">
            <span className={`text-6xl font-bold font-mono ${verdictColor}`}>{score}</span>
            <span className="text-2xl text-muted-foreground font-semibold">/9</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Convergence Score</p>

          {/* Convergence bars */}
          <div className="flex justify-center gap-1.5 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full ${
                  i <= Number(score)
                    ? direction === "over" ? "bg-emerald-400"
                    : direction === "under" ? "bg-red-400"
                    : "bg-yellow-400"
                    : "bg-border"
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-3">{confidence}% confidence</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <MiniStat label="L10 Hit Rate" value={`${hitRate}%`} />
          <MiniStat label="Avg Margin" value={`${avgMargin > 0 ? "+" : ""}${avgMargin.toFixed(1)}`} />
          <MiniStat label="Season Avg" value={seasonAvg.toFixed(1)} />
          <MiniStat label="Streak" value={streak > 0 ? `${streak} over` : streak < 0 ? `${Math.abs(streak)} under` : "None"} />
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h3 className="text-lg font-bold text-foreground">
            Want the full breakdown?
          </h3>
          <p className="text-sm text-muted-foreground mt-2 mb-5">
            See convergence factors, prop spectrum, matchup context, game logs, and more — free.
          </p>

          <div className="flex flex-col gap-3 items-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href={checkUrl}>
                Check this prop
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/sign-up">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by 9-factor convergence analysis &middot;{" "}
          <Link href="/" className="text-primary hover:underline">heatcheckhq.io</Link>
        </p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
