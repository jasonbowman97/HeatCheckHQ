"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, Sun, Cloud, CloudSun, CloudDrizzle, Home } from "lucide-react"
import type { StadiumWeather } from "@/lib/mlb-weather-data"

type SortField = "runsImpact" | "hrImpact" | "xbhImpact" | "hitsImpact" | "temp" | "windSpeed"
type SortDir = "asc" | "desc"

function ConditionIcon({ condition }: { condition: StadiumWeather["condition"] }) {
  switch (condition) {
    case "Sunny":
      return <Sun className="h-4 w-4 text-amber-400" />
    case "Partly Cloudy":
      return <CloudSun className="h-4 w-4 text-amber-300" />
    case "Cloudy":
      return <Cloud className="h-4 w-4 text-muted-foreground" />
    case "Overcast":
      return <Cloud className="h-4 w-4 text-muted-foreground/60" />
    case "Roof Closed":
      return <Home className="h-4 w-4 text-muted-foreground/60" />
    case "Drizzle":
      return <CloudDrizzle className="h-4 w-4 text-blue-400" />
  }
}

function WindBadge({ dir, speed }: { dir: StadiumWeather["windDir"]; speed: number }) {
  if (dir === "Calm" || speed === 0) {
    return <span className="text-xs text-muted-foreground/60">Calm</span>
  }

  const arrow = dir === "Out" ? "\u2197" : dir === "In" ? "\u2199" : dir === "L-R" ? "\u2192" : "\u2190"
  const color = dir === "Out" ? "text-emerald-400" : dir === "In" ? "text-red-400" : "text-muted-foreground"

  return (
    <span className={`text-xs font-mono tabular-nums ${color}`}>
      {arrow} {speed}mph
    </span>
  )
}

function ImpactCell({ pct, raw }: { pct: number; raw: number }) {
  const color =
    pct > 5
      ? "text-emerald-400"
      : pct < -5
        ? "text-red-400"
        : "text-muted-foreground"
  const sign = pct > 0 ? "+" : ""
  const rawSign = raw > 0 ? "+" : ""

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`text-sm font-bold font-mono tabular-nums ${color}`}>
        {sign}{pct}%
      </span>
      <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">
        {rawSign}{raw.toFixed(2)}
      </span>
    </div>
  )
}

function SortButton({ field, label, activeField, activeDir, onSort }: {
  field: SortField
  label: string
  activeField: SortField
  activeDir: SortDir
  onSort: (f: SortField) => void
}) {
  const active = field === activeField
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`} />
      {active && <span className="text-[10px]">{activeDir === "desc" ? "\u25BC" : "\u25B2"}</span>}
    </button>
  )
}

export function WeatherTable({ data }: { data: StadiumWeather[] }) {
  const [sortField, setSortField] = useState<SortField>("runsImpact")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      return sortDir === "desc" ? bv - av : av - bv
    })
  }, [data, sortField, sortDir])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2" colSpan={4}>
                Venue & Conditions
              </TableHead>
              <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2 border-l border-border" colSpan={4}>
                Weather Impact
              </TableHead>
            </TableRow>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="py-3 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[200px]">
                Venue
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[90px]">
                Weather
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[100px]">
                Wind
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[60px]">
                <SortButton field="temp" label="Temp" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[90px] border-l border-border">
                <SortButton field="runsImpact" label="Runs" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[80px]">
                <SortButton field="hrImpact" label="HR" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-[80px]">
                <SortButton field="xbhImpact" label="2B/3B" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right pr-4 w-[80px]">
                <SortButton field="hitsImpact" label="1B" activeField={sortField} activeDir={sortDir} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((stadium) => {
              const runsBg =
                stadium.runsImpact >= 10
                  ? "bg-emerald-500/8"
                  : stadium.runsImpact <= -10
                    ? "bg-red-500/8"
                    : ""
              return (
                <TableRow key={stadium.venue} className={`border-b border-border/50 hover:bg-secondary/30 ${runsBg}`}>
                  <TableCell className="py-3 pl-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{stadium.venue}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-medium">{stadium.matchup}</span>
                        <span className="text-[10px] text-muted-foreground/50">{stadium.gameTime}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ConditionIcon condition={stadium.condition} />
                      <span className="text-xs text-muted-foreground">{stadium.humidity}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <WindBadge dir={stadium.windDir} speed={stadium.windSpeed} />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className={`text-sm font-mono tabular-nums ${stadium.temp >= 90 ? "text-amber-400 font-semibold" : "text-foreground"}`}>
                      {stadium.temp}&deg;
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right border-l border-border/50">
                    <ImpactCell pct={stadium.runsImpact} raw={stadium.runsRaw} />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <ImpactCell pct={stadium.hrImpact} raw={stadium.hrRaw} />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <ImpactCell pct={stadium.xbhImpact} raw={stadium.xbhRaw} />
                  </TableCell>
                  <TableCell className="py-3 text-right pr-4">
                    <ImpactCell pct={stadium.hitsImpact} raw={stadium.hitsRaw} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
