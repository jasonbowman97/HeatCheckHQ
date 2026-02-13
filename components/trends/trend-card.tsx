import type { Trend } from "@/lib/trends-types"

export function TrendCard({ trend }: { trend: Trend }) {
  const isHot = trend.type === "hot"
  const isConsistency = !!trend.threshold

  return (
    <div
      className={`relative rounded-xl border bg-card p-5 transition-colors ${
        isConsistency
          ? isHot
            ? "border-blue-500/20 hover:border-blue-500/40"
            : "border-orange-500/20 hover:border-orange-500/40"
          : isHot
            ? "border-emerald-500/20 hover:border-emerald-500/40"
            : "border-red-500/20 hover:border-red-500/40"
      }`}
    >
      {/* Type badge + category + playing today */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isConsistency ? (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                isHot
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-orange-400 bg-orange-500/10"
              }`}
            >
              {isHot ? "Over" : "Under"}
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                isHot
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              }`}
            >
              {isHot ? "Hot" : "Cold"}
            </span>
          )}
          {trend.playingToday && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Today{trend.opponent ? ` vs ${trend.opponent}` : ""}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
          isConsistency
            ? "text-blue-400 bg-blue-500/10"
            : "text-muted-foreground bg-secondary"
        }`}>
          {isConsistency ? trend.threshold?.stat : trend.category}
        </span>
      </div>

      {/* Player info */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-foreground">{trend.playerName}</h3>
        <p className="text-xs text-muted-foreground">
          {trend.team} &middot; {trend.position}
        </p>
      </div>

      {/* Threshold line display for consistency trends */}
      {isConsistency && trend.threshold && (
        <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg ${
          isHot ? "bg-blue-500/5 border border-blue-500/10" : "bg-orange-500/5 border border-orange-500/10"
        }`}>
          <span className={`text-xs font-bold ${isHot ? "text-blue-400" : "text-orange-400"}`}>
            {isHot ? "OVER" : "UNDER"} {trend.threshold.line}
          </span>
          <span className="text-[10px] text-muted-foreground">{trend.threshold.stat}</span>
          <span className="ml-auto text-xs font-bold text-foreground">{trend.threshold.hitRate}</span>
        </div>
      )}

      {/* Headline */}
      <p className="text-sm font-semibold text-foreground mb-1">{trend.headline}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{trend.detail}</p>

      {/* Stat + streak */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              isConsistency
                ? isHot ? "text-blue-400" : "text-orange-400"
                : isHot ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.statValue}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
            {trend.statLabel}
          </p>
          {trend.seasonAvg && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Season avg: <span className="font-semibold text-foreground/70">{trend.seasonAvg}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-muted-foreground">{trend.streakLabel}</span>
          <div className="flex gap-1">
            {trend.recentGames.map((hit, i) => (
              <div
                key={`${trend.id}-game-${i}`}
                className={`h-2 w-2 rounded-full ${
                  hit
                    ? isConsistency
                      ? isHot ? "bg-blue-400" : "bg-orange-400"
                      : isHot ? "bg-emerald-400" : "bg-red-400"
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
