"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateNavigatorProps {
  date: Date
  onPrev: () => void
  onNext: () => void
}

export function DateNavigator({ date, onPrev, onNext }: DateNavigatorProps) {
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card">
      <button
        onClick={onPrev}
        className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors rounded-l-lg hover:bg-secondary"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="px-4 text-sm font-medium text-foreground min-w-[120px] text-center">
        {formatted}
      </span>
      <button
        onClick={onNext}
        className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors rounded-r-lg hover:bg-secondary"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
