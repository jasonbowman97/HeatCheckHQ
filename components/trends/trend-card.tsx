import type { Trend } from "@/lib/trends-types"

export function TrendCard({ trend }: { trend: Trend }) {
  const isHot = trend.type === "hot"

  return (
    <div
      className={`relative rounded-xl border bg-card p-5 transition-colors ${
        isHot
          ? "border-emerald-500/20 hover:border-emerald-500/40"
          : "border-red-500/20 hover:border-red-500/40"
      }`}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
            isHot
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-red-400 bg-red-500/10"
          }`}
        >
          {isHot ? "Hot" : "Cold"}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded">
          {trend.category}
        </span>
      </div>

      {/* Player info */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-foreground">{trend.playerName}</h3>
        <p className="text-xs text-muted-foreground">
          {trend.team} &middot; {trend.position}
        </p>
      </div>

      {/* Headline */}
      <p className="text-sm font-semibold text-foreground mb-1">{trend.headline}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{trend.detail}</p>

      {/* Stat + streak */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              isHot ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.statValue}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
            {trend.statLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-muted-foreground">{trend.streakLabel}</span>
          <div className="flex gap-1">
            {trend.recentGames.map((hit, i) => (
              <div
                key={`${trend.id}-game-${i}`}
                className={`h-2 w-2 rounded-full ${
                  hit
                    ? isHot
                      ? "bg-emerald-400"
                      : "bg-red-400"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
