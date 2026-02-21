"use client"

import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Loader2, ChevronUp, ChevronDown, Flame, AlertCircle, RefreshCw } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import { SignupGate } from "@/components/signup-gate"
import { ProUpsellBanner } from "@/components/pro-upsell-banner"
import { useUserTier } from "@/components/user-tier-provider"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { CsvExport } from "@/components/ui/csv-export"
import type { SavantBatter } from "@/lib/savant"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PREVIEW_ROWS = 8

type SortKey =
  | "xSLGDiff"
  | "barrelPct"
  | "hardHitPct"
  | "avgEV"
  | "maxEV"
  | "sweetSpotPct"
  | "hr"
  | "pa"
  | "xSLG"
  | "slg"
  | "age"

type SortDir = "asc" | "desc"

const PA_FILTERS = [
  { label: "All", value: 0 },
  { label: "100+", value: 100 },
  { label: "200+", value: 200 },
  { label: "300+", value: 300 },
]

/* ─── Heatmap color helpers ─── */

function heatColor(value: number, min: number, max: number): string {
  if (max === min) return ""
  const pct = (value - min) / (max - min)
  if (pct >= 0.8) return "bg-emerald-500/20 text-emerald-300"
  if (pct >= 0.6) return "bg-emerald-500/10 text-emerald-400/80"
  if (pct <= 0.2) return "bg-red-500/15 text-red-400/80"
  if (pct <= 0.4) return "bg-red-500/8 text-red-400/60"
  return ""
}

function gapColor(value: number): string {
  if (value >= 0.06) return "bg-emerald-500/25 text-emerald-300 font-bold"
  if (value >= 0.03) return "bg-emerald-500/15 text-emerald-400"
  if (value >= 0.01) return "bg-emerald-500/8 text-emerald-400/70"
  if (value <= -0.03) return "bg-red-500/15 text-red-400"
  if (value <= -0.01) return "bg-red-500/8 text-red-400/70"
  return ""
}

/* ─── Column definitions ─── */

interface Column {
  key: SortKey | "rank" | "name"
  label: string
  shortLabel?: string
  sortable: boolean
  align?: "left" | "right"
  className?: string
}

const COLUMNS: Column[] = [
  { key: "rank", label: "#", sortable: false, align: "right", className: "w-8 sm:w-10" },
  { key: "name", label: "Player", sortable: false, align: "left", className: "min-w-[120px] sm:min-w-[160px]" },
  { key: "age", label: "Age", sortable: true, align: "right", className: "w-12 hidden sm:table-cell" },
  { key: "pa", label: "PA", sortable: true, align: "right", className: "w-12 hidden sm:table-cell" },
  { key: "hr", label: "HR", sortable: true, align: "right", className: "w-12 sm:w-14" },
  { key: "barrelPct", label: "Barrel%", shortLabel: "Brl%", sortable: true, align: "right", className: "w-16 sm:w-20" },
  { key: "hardHitPct", label: "Hard Hit%", shortLabel: "HH%", sortable: true, align: "right", className: "w-16 sm:w-20" },
  { key: "avgEV", label: "Avg EV", shortLabel: "EV", sortable: true, align: "right", className: "w-16 sm:w-20 hidden xs:table-cell" },
  { key: "xSLG", label: "xSLG", sortable: true, align: "right", className: "w-14 sm:w-16 hidden md:table-cell" },
  { key: "slg", label: "SLG", sortable: true, align: "right", className: "w-14 sm:w-16 hidden md:table-cell" },
  { key: "xSLGDiff", label: "xSLG Gap", shortLabel: "Gap", sortable: true, align: "right", className: "w-16 sm:w-20" },
]

/* ─── CSV export columns ─── */

const CSV_COLUMNS = [
  { key: "name", label: "Player" },
  { key: "age", label: "Age" },
  { key: "pa", label: "PA" },
  { key: "hr", label: "HR" },
  { key: "barrelPct", label: "Barrel%" },
  { key: "hardHitPct", label: "HardHit%" },
  { key: "avgEV", label: "AvgEV" },
  { key: "xSLG", label: "xSLG" },
  { key: "slg", label: "SLG" },
  { key: "xSLGDiff", label: "xSLG Gap" },
]

/* ─── Component ─── */

export default function DueForHRPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [sortKey, setSortKey] = useState<SortKey>("xSLGDiff")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [minPA, setMinPA] = useState(0)

  const { data, isLoading, error, mutate } = useSWR<{ players: SavantBatter[]; year: number; updatedAt?: string }>(
    "/api/mlb/due-for-hr",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const players = data?.players ?? []
  const year = data?.year ?? new Date().getFullYear()

  // Compute min/max for heatmap coloring
  const ranges = useMemo(() => {
    if (players.length === 0) return null
    return {
      barrelPct: { min: Math.min(...players.map((p) => p.barrelPct)), max: Math.max(...players.map((p) => p.barrelPct)) },
      hardHitPct: { min: Math.min(...players.map((p) => p.hardHitPct)), max: Math.max(...players.map((p) => p.hardHitPct)) },
      avgEV: { min: Math.min(...players.map((p) => p.avgEV)), max: Math.max(...players.map((p) => p.avgEV)) },
    }
  }, [players])

  // Filter & sort
  const sorted = useMemo(() => {
    let list = players
    if (minPA > 0) {
      list = list.filter((p) => p.pa >= minPA)
    }
    return [...list].sort((a, b) => {
      const aVal = a[sortKey] as number
      const bVal = b[sortKey] as number
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
  }, [players, sortKey, sortDir, minPA])

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"))
      } else {
        setSortKey(key)
        setSortDir("desc")
      }
    },
    [sortKey]
  )

  // Rows for display
  const previewRows = sorted.slice(0, PREVIEW_ROWS)
  const gatedRows = sorted.slice(PREVIEW_ROWS)

  const renderTable = (rows: SavantBatter[], startIndex: number) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {startIndex === 0 && (
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => {
                const isSortable = col.sortable && col.key !== "rank" && col.key !== "name"
                const isActive = col.key === sortKey
                return (
                  <th
                    key={col.key}
                    className={`px-2 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${
                      col.align === "left" ? "text-left" : "text-right"
                    } ${col.className ?? ""} ${isSortable ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                    onClick={isSortable ? () => handleSort(col.key as SortKey) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="hidden sm:inline">{col.label}</span>
                      <span className="sm:hidden">{col.shortLabel ?? col.label}</span>
                      {isActive && (
                        sortDir === "desc" ? (
                          <ChevronDown className="h-3 w-3 text-primary" />
                        ) : (
                          <ChevronUp className="h-3 w-3 text-primary" />
                        )
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((player, i) => {
            const rank = startIndex + i + 1
            return (
              <tr
                key={player.playerId}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs text-muted-foreground tabular-nums">{rank}</td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-left">
                  <div className="flex items-center gap-2">
                    <Image
                      src={player.image}
                      alt={player.name}
                      width={28}
                      height={28}
                      className="rounded-full bg-secondary shrink-0 sm:w-8 sm:h-8"
                      unoptimized
                    />
                    <span className="text-[11px] sm:text-sm font-medium text-foreground truncate max-w-[100px] sm:max-w-[140px]">
                      {player.name}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums text-muted-foreground hidden sm:table-cell">{player.age}</td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums text-muted-foreground hidden sm:table-cell">{player.pa}</td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums font-semibold text-foreground">{player.hr}</td>
                <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums rounded-sm ${ranges ? heatColor(player.barrelPct, ranges.barrelPct.min, ranges.barrelPct.max) : ""}`}>
                  {player.barrelPct.toFixed(1)}
                </td>
                <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums rounded-sm ${ranges ? heatColor(player.hardHitPct, ranges.hardHitPct.min, ranges.hardHitPct.max) : ""}`}>
                  {player.hardHitPct.toFixed(1)}
                </td>
                <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums rounded-sm hidden xs:table-cell ${ranges ? heatColor(player.avgEV, ranges.avgEV.min, ranges.avgEV.max) : ""}`}>
                  {player.avgEV.toFixed(1)}
                </td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums text-muted-foreground hidden md:table-cell">{player.xSLG.toFixed(3)}</td>
                <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums text-muted-foreground hidden md:table-cell">{player.slg.toFixed(3)}</td>
                <td className={`px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs tabular-nums rounded-sm ${gapColor(player.xSLGDiff)}`}>
                  {player.xSLGDiff > 0 ? "+" : ""}{player.xSLGDiff.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">Due for a Homer</h1>
            <SectionInfoTip page="/mlb/due-for-hr" />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!isLoading && players.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                {year} Statcast
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Hitters making elite contact (high barrel rate, exit velo) whose actual slugging lags behind expected — they&apos;re due for more homers.
          </p>
          <LastUpdated timestamp={data?.updatedAt} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Min PA:</span>
            <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Minimum plate appearances">
              {PA_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setMinPA(f.value)}
                  aria-pressed={minPA === f.value}
                  aria-label={f.value === 0 ? "All plate appearances" : `Minimum ${f.value} plate appearances`}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    minPA === f.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {sorted.length} qualified batters
            </span>
          )}

          {!isLoading && sorted.length > 0 && (
            <CsvExport
              data={sorted as unknown as Record<string, unknown>[]}
              filename={`due-for-hr-${year}`}
              columns={CSV_COLUMNS}
            />
          )}
        </div>

        {/* Pro upsell for free users */}
        <ProUpsellBanner
          headline="Go Pro for full Statcast access and every dashboard"
          description="Unlimited data across MLB, NBA, and NFL streak trackers, matchup tools, and more"
        />

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={11} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">Failed to load Statcast data</p>
            <p className="text-xs text-muted-foreground">
              The season may not have started yet, or Baseball Savant may be temporarily unavailable.
            </p>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Flame className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No batters match this filter. Try lowering the minimum PA.
            </p>
          </div>
        ) : isAnonymous ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <SignupGate
              preview={renderTable(previewRows, 0)}
              gated={renderTable(gatedRows, PREVIEW_ROWS)}
              headline="Create a free account to see all batters"
              countLabel={`${gatedRows.length} more players`}
              teaser={
                sorted.length > 0
                  ? `Top pick: ${sorted[0].name} — ${sorted[0].barrelPct.toFixed(1)}% barrel rate`
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {renderTable(sorted, 0)}
          </div>
        )}

        {/* Glossary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Understanding the Metrics</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs text-muted-foreground leading-relaxed">
            <div>
              <span className="font-semibold text-foreground">Barrel%</span> — Percentage of batted balls with ideal exit velocity (&ge;98 mph) and launch angle for extra-base hits.
            </div>
            <div>
              <span className="font-semibold text-foreground">Hard Hit%</span> — Percentage of batted balls hit at 95+ mph exit velocity.
            </div>
            <div>
              <span className="font-semibold text-foreground">Avg EV</span> — Average exit velocity on the player&apos;s 50 hardest-hit balls.
            </div>
            <div>
              <span className="font-semibold text-foreground">xSLG</span> — Expected slugging based on Statcast quality of contact data.
            </div>
            <div>
              <span className="font-semibold text-foreground">xSLG Gap</span> — Difference between xSLG and actual SLG. Positive = underperforming luck, due for more power.
            </div>
            <div>
              <span className="font-semibold text-foreground">Sweet Spot%</span> — Percentage of batted balls with a launch angle between 8&deg; and 32&deg; — the optimal range for line drives and fly balls.
            </div>
          </div>
        </div>
      </main>
    </DashboardShell>
  )
}
