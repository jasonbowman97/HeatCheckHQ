"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { PitcherStats, PitchArsenalEntry } from "@/lib/pitching-data"
import { getHeatmapColorInverted } from "@/lib/pitching-data"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface PitcherArsenalProps {
  pitcher: PitcherStats
  onBack: () => void
}

function getBounds(entries: PitchArsenalEntry[], field: keyof PitchArsenalEntry) {
  const vals = entries.map((e) => e[field] as number)
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

export function PitcherArsenal({ pitcher, onBack }: PitcherArsenalProps) {
  const arsenal = pitcher.arsenal
  const avgBounds = getBounds(arsenal, "avg")
  const slgBounds = getBounds(arsenal, "slg")
  const isoBounds = getBounds(arsenal, "iso")
  const barrelBounds = getBounds(arsenal, "barrelPct")
  const hardHitBounds = getBounds(arsenal, "hardHitPct")

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
          { label: "HR/9", value: pitcher.hr9.toFixed(2) },
          { label: "Barrel%", value: `${pitcher.barrelPct.toFixed(1)}%` },
          { label: "Hard-Hit%", value: `${pitcher.hardHitPct.toFixed(1)}%` },
          { label: "HR/FB%", value: `${pitcher.hrFbPct.toFixed(1)}%` },
          { label: "Fly Ball%", value: `${pitcher.flyBallPct.toFixed(1)}%` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-foreground font-mono tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pitch arsenal table */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Pitch Arsenal</h3>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pitch</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Usage%</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">AVG</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">SLG</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">ISO</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">HR</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Barrel%</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Hard-Hit%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arsenal.map((pitch) => (
                  <TableRow key={pitch.pitch} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <TableCell className="py-3">
                      <span className="text-sm font-semibold text-foreground">{pitch.pitch}</span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pitch.usagePct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono tabular-nums w-8 text-right">{pitch.usagePct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(pitch.avg, avgBounds.min, avgBounds.max)}`}>
                        {pitch.avg.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(pitch.slg, slgBounds.min, slgBounds.max)}`}>
                        {pitch.slg.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(pitch.iso, isoBounds.min, isoBounds.max)}`}>
                        {pitch.iso.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className="text-sm text-muted-foreground font-mono tabular-nums">{pitch.hr}</span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(pitch.barrelPct, barrelBounds.min, barrelBounds.max)}`}>
                        {pitch.barrelPct}%
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${getHeatmapColorInverted(pitch.hardHitPct, hardHitBounds.min, hardHitBounds.max)}`}>
                        {pitch.hardHitPct}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
