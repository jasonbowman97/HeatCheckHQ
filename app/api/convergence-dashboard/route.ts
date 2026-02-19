// ============================================================
// app/api/convergence-dashboard/route.ts — Top convergence props
// ============================================================
// Returns highest-convergence props across all sports for today.

import { NextResponse } from 'next/server'
import { cacheHeader, CACHE } from '@/lib/cache'
import type { ConvergenceHighlight } from '@/types/innovation-playbook'
import type { Sport } from '@/types/shared'

const SPORTS: Sport[] = ['nba', 'nfl', 'mlb']

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sport = url.searchParams.get('sport') as Sport | null
  const minConvergence = Number(url.searchParams.get('minConvergence') ?? '4')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '30'), 100)

  const sportsToFetch = sport ? [sport] : SPORTS

  try {
    // Fetch top props from situation room for each sport
    const allProps: (ConvergenceHighlight & { sport: Sport })[] = []

    for (const s of sportsToFetch) {
      try {
        const apiBase = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
        const res = await fetch(`${apiBase}/api/situation-room?sport=${s}`, {
          next: { revalidate: 300 },
        })

        if (!res.ok) continue
        const data = await res.json()

        // Extract convergence highlights from situation room data
        const highlights: ConvergenceHighlight[] = data.convergenceHighlights ?? []
        for (const h of highlights) {
          if (h.convergenceScore >= minConvergence) {
            allProps.push({ ...h, sport: s })
          }
        }
      } catch {
        // Skip sport if fetch fails
      }
    }

    // Sort by convergence score descending
    allProps.sort((a, b) => b.convergenceScore - a.convergenceScore)

    // Group by sport for counts
    const sportCounts: Record<string, number> = {}
    for (const p of allProps) {
      sportCounts[p.sport] = (sportCounts[p.sport] ?? 0) + 1
    }

    return NextResponse.json({
      props: allProps.slice(0, limit),
      sportCounts,
      total: allProps.length,
    }, {
      headers: { 'Cache-Control': cacheHeader(CACHE.SEMI_LIVE) },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch convergence data' }, { status: 500 })
  }
}
