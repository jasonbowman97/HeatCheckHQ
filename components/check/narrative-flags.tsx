"use client"

import type { NarrativeFlag } from "@/types/check-prop"

interface NarrativeFlagsProps {
  narratives: NarrativeFlag[]
}

const IMPACT_STYLES = {
  positive: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  negative: "bg-red-500/10 border-red-500/30 text-red-400",
  neutral: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
}

const TYPE_ICONS: Record<NarrativeFlag["type"], string> = {
  revenge_game: "vs",
  milestone: "100",
  losing_streak: "L",
  winning_streak: "W",
  blowout_bounce: "BB",
  return_from_injury: "INJ",
  contract_year: "$",
  back_to_back_road: "B2B",
  rest_mismatch: "REST",
  weather_extreme: "WX",
  rivalry: "RIV",
  key_teammate_out: "OUT",
}

export function NarrativeFlags({ narratives }: NarrativeFlagsProps) {
  if (narratives.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Narrative Flags
      </h3>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {narratives.map((flag, i) => (
          <NarrativePill key={i} flag={flag} />
        ))}
      </div>
    </div>
  )
}

function NarrativePill({ flag }: { flag: NarrativeFlag }) {
  const styles = IMPACT_STYLES[flag.impact]
  const icon = TYPE_ICONS[flag.type] ?? "?"

  return (
    <div
      className={`shrink-0 rounded-lg border px-3 py-2 ${styles} group relative cursor-default`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase opacity-60">{icon}</span>
        <div>
          <p className="text-xs font-semibold whitespace-nowrap">{flag.headline}</p>
          {flag.severity === "high" && (
            <span className="inline-block mt-0.5 h-1 w-1 rounded-full bg-current opacity-80" />
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg max-w-xs">
          <p className="text-xs font-medium text-foreground">{flag.headline}</p>
          <p className="text-xs text-muted-foreground mt-1">{flag.detail}</p>
          {flag.historicalStat && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1 border-t border-border pt-1">
              {flag.historicalStat}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
