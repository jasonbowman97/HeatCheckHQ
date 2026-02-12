"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { PitcherStats } from "@/lib/pitching-data"
import type { PitchArsenalEntry } from "@/lib/mlb-api"
import { getHeatmapColor, getHeatmapColorInverted } from "@/lib/pitching-data"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PitcherArsenalProps {
  pitcher: PitcherStats
  onBack: () => void
}

function UsageBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground font-mono tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}

export function PitcherArsenal({ pitcher, onBack }: PitcherArsenalProps) {
  // Fetch live arsenal data
  const { data, isLoading } = useSWR<{ arsenal: PitchArsenalEntry[] }>(
    `/api/mlb/pitcher-arsenal?pitcherId=${pitcher.id}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const arsenal = data?.arsenal ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">{pitcher.name}</h2>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pitcher.hand === "L" ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"}`}>
            {pitcher.hand}HP
          </span>
          <span className="text-sm text-muted-foreground">{pitcher.team}</span>
        </div>
      </div>

      {/* Pitcher profile stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "ERA", value: pitcher.era.toFixed(2) },
          { label: "WHIP", value: pitcher.whip.toFixed(2) },
          { label: "W-L", value: `${pitcher.wins}-${pitcher.losses}` },
          { label: "K/9", value: pitcher.kPer9.toFixed(1) },
          { label: "K%", value: `${pitcher.kPct.toFixed(1)}%` },
          { label: "Whiff%", value: pitcher.whiffPct > 0 ? `${pitcher.whiffPct.toFixed(1)}%` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground font-mono tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Statcast quality stats */}
      {(pitcher.barrelPct > 0 || pitcher.hardHitPct > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "IP", value: pitcher.inningsPitched.toFixed(1) },
            { label: "Barrel%", value: pitcher.barrelPct > 0 ? `${pitcher.barrelPct.toFixed(1)}%` : "—" },
            { label: "Hard-Hit%", value: pitcher.hardHitPct > 0 ? `${pitcher.hardHitPct.toFixed(1)}%` : "—" },
          ].filter(s => s.value !== "—").map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-foreground font-mono tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pitch arsenal table */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-base font-semibold text-foreground">Pitch Arsenal</h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isLoading && arsenal.length > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              Live
            </span>
          )}
        </div>

        {!isLoading && arsenal.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Arsenal data unavailable for this pitcher.</p>
          </div>
        )}

        {arsenal.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pitch</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Usage%</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Avg Velo</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arsenal.map((pitch) => {
                    // Compute velocity bounds for heatmap
                    const veloVals = arsenal.map((a) => a.avgVelocity).filter((v) => v > 0)
                    const veloBounds = veloVals.length > 0
                      ? { min: Math.min(...veloVals), max: Math.max(...veloVals) }
                      : { min: 0, max: 100 }

                    return (
                      <TableRow key={pitch.pitchCode} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{pitch.pitchName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{pitch.pitchCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <UsageBar pct={pitch.usagePct} />
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${pitch.avgVelocity > 0 ? getHeatmapColor(pitch.avgVelocity, veloBounds.min, veloBounds.max) : "bg-secondary text-muted-foreground"}`}>
                            {pitch.avgVelocity > 0 ? `${pitch.avgVelocity.toFixed(1)} mph` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <span className="text-sm text-muted-foreground font-mono tabular-nums">{pitch.count}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
