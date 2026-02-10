"use client"

import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarDays } from "lucide-react"

export type TimeRangePreset = "season" | "L5" | "L10" | "L15" | "L30" | "custom"

export interface TimeRange {
  preset: TimeRangePreset
  customStart?: string // YYYY-MM-DD
  customEnd?: string   // YYYY-MM-DD
}

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const presets: { value: TimeRangePreset; label: string }[] = [
  { value: "season", label: "Season" },
  { value: "L5", label: "L5" },
  { value: "L10", label: "L10" },
  { value: "L15", label: "L15" },
  { value: "L30", label: "L30" },
]

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [startDate, setStartDate] = useState(value.customStart || "")
  const [endDate, setEndDate] = useState(value.customEnd || "")

  const isCustomActive = value.preset === "custom"

  function handleApplyCustom() {
    if (startDate && endDate) {
      onChange({ preset: "custom", customStart: startDate, customEnd: endDate })
      setCustomOpen(false)
    }
  }

  function handleClearCustom() {
    setStartDate("")
    setEndDate("")
    onChange({ preset: "season" })
    setCustomOpen(false)
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Range
      </span>
      <div className="flex items-center gap-0">
        {/* Preset buttons */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange({ preset: preset.value })}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                value.preset === preset.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom date range popover */}
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <button
              className={`ml-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isCustomActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Custom date range"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {isCustomActive && value.customStart && value.customEnd ? (
                <span>
                  {formatShortDate(value.customStart)} - {formatShortDate(value.customEnd)}
                </span>
              ) : (
                <span>Custom</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 bg-card border-border"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Custom Date Range
                </h4>
                <p className="text-xs text-muted-foreground">
                  Select a start and end date to filter stats.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="range-start"
                    className="text-xs font-medium text-primary"
                  >
                    Start Date
                  </label>
                  <input
                    id="range-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="range-end"
                    className="text-xs font-medium text-primary"
                  >
                    End Date
                  </label>
                  <input
                    id="range-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyCustom}
                  disabled={!startDate || !endDate}
                  className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearCustom}
                  className="rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${month}/${day}/${year.slice(2)}`
}

/** Utility: given game log dates and a time range, compute which dates fall in range */
export function getGameCountForRange(
  gameDates: string[], // "M/D/YYYY" format
  range: TimeRange
): number {
  if (range.preset === "season") return gameDates.length
  if (range.preset === "custom" && range.customStart && range.customEnd) {
    const start = new Date(range.customStart)
    const end = new Date(range.customEnd)
    end.setHours(23, 59, 59)
    return gameDates.filter((d) => {
      const parsed = parseGameDate(d)
      return parsed >= start && parsed <= end
    }).length
  }
  // L5, L10, etc.
  const count = Number.parseInt(range.preset.replace("L", ""), 10)
  return Math.min(count, gameDates.length)
}

/** Filter game logs by time range, returns the filtered subset */
export function filterByTimeRange<T extends { date: string }>(
  logs: T[],
  range: TimeRange
): T[] {
  if (range.preset === "season") return logs

  if (range.preset === "custom" && range.customStart && range.customEnd) {
    const start = new Date(range.customStart)
    const end = new Date(range.customEnd)
    end.setHours(23, 59, 59)
    return logs.filter((log) => {
      const parsed = parseGameDate(log.date)
      return parsed >= start && parsed <= end
    })
  }

  // L5, L10, L15, L30: take the most recent N unique game dates
  const count = Number.parseInt(range.preset.replace("L", ""), 10)
  const uniqueDates = [...new Set(logs.map((l) => l.date))]
  // Sort descending by date
  uniqueDates.sort((a, b) => parseGameDate(b).getTime() - parseGameDate(a).getTime())
  const recentDates = new Set(uniqueDates.slice(0, count))
  return logs.filter((log) => recentDates.has(log.date))
}

function parseGameDate(dateStr: string): Date {
  // Handles "M/D/YYYY" format
  const parts = dateStr.split("/")
  return new Date(
    Number.parseInt(parts[2], 10),
    Number.parseInt(parts[0], 10) - 1,
    Number.parseInt(parts[1], 10)
  )
}
