"use client"

interface HitRatePillsProps {
  l5: number
  l10: number
  l20: number | null
  season: number
  h2h: number | null
}

export function HitRatePills({ l5, l10, l20, season, h2h }: HitRatePillsProps) {
  const pills = [
    { label: "L5", value: l5 },
    { label: "L10", value: l10 },
    ...(l20 !== null ? [{ label: "L20", value: l20 }] : []),
    { label: "SZN", value: season },
    ...(h2h !== null ? [{ label: "H2H", value: h2h }] : []),
  ]

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Hit Rates
      </h4>
      <div className="flex gap-1.5">
        {pills.map((pill) => {
          const pct = Math.round(pill.value * 100)
          const color =
            pct >= 70
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              : pct >= 50
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                : "bg-red-500/15 text-red-400 border-red-500/20"

          return (
            <div
              key={pill.label}
              className={`flex flex-col items-center rounded-lg border px-3 py-2 min-w-[52px] ${color}`}
            >
              <span className="text-[10px] font-medium opacity-70">{pill.label}</span>
              <span className="text-sm font-bold tabular-nums">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
