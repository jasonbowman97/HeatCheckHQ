"use client"

import { useEffect, useState } from "react"
import { timeAgo } from "@/lib/utils"

interface LastUpdatedProps {
  timestamp: string | undefined
  className?: string
}

/**
 * Shows a green dot + relative time indicator.
 * Re-renders every 30s so "Just now" → "1m ago" transitions are smooth.
 */
export function LastUpdated({ timestamp, className = "" }: LastUpdatedProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!timestamp) return
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [timestamp])

  if (!timestamp) return null

  const label = timeAgo(timestamp)

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] text-muted-foreground ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Updated {label}
    </span>
  )
}
