"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import { SECTION_TIPS } from "@/lib/section-tips"

interface SectionInfoTipProps {
  /** The page pathname to look up tips (e.g. "/nba/streaks") */
  page: string
}

/**
 * A subtle (i) icon that sits next to section headers.
 * On click, shows a popover with 2-3 contextual tips.
 * Replaces the old full-width OnboardingTooltip banners.
 */
export function SectionInfoTip({ page }: SectionInfoTipProps) {
  const [open, setOpen] = useState(false)
  const tips = SECTION_TIPS[page]

  if (!tips) return null

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary transition-colors cursor-help"
        aria-label={`Tips for ${tips.title}`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* Invisible backdrop to catch clicks outside */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl border border-border bg-card shadow-xl shadow-background/50 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold text-foreground">{tips.title}</h4>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors -mt-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5">
              {tips.tips.map((tip, i) => (
                <li key={i} className="text-[11px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary/60 shrink-0 mt-0.5">&#8226;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
