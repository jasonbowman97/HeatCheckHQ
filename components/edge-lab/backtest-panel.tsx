"use client"

import type { BacktestResult } from "@/types/edge-lab"

interface BacktestPanelProps {
  result: BacktestResult
}

export function BacktestPanel({ result }: BacktestPanelProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        <MetricCard
          label="Hit Rate"
          value={`${Math.round(result.hitRate * 100)}%`}
          color={result.hitRate >= 0.55 ? "emerald" : result.hitRate < 0.48 ? "red" : "gray"}
        />
        <MetricCard
          label="Record"
          value={`${result.hits}-${result.misses}`}
          subtext={`${result.totalGames} games`}
        />
        <MetricCard
          label="ROI"
          value={`${result.roi >= 0 ? "+" : ""}${(result.roi * 100).toFixed(1)}%`}
          color={result.roi > 0 ? "emerald" : "red"}
        />
        <MetricCard
          label="Profit"
          value={`${result.totalProfit >= 0 ? "+" : ""}${result.totalProfit.toFixed(1)}u`}
          color={result.totalProfit > 0 ? "emerald" : "red"}
        />
        <MetricCard
          label="Max Drawdown"
          value={`${result.maxDrawdown.toFixed(1)}u`}
          color="red"
        />
        <MetricCard
          label="Sharpe"
          value={result.sharpeRatio.toFixed(2)}
          color={result.sharpeRatio > 1 ? "emerald" : result.sharpeRatio < 0 ? "red" : "gray"}
        />
      </div>

      {/* Confidence Warning */}
      {result.confidenceWarning && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-400">
          {result.confidenceWarning}
        </div>
      )}

      {/* Streaks & Kelly */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Streak</p>
          <p className="text-lg font-bold font-mono text-emerald-400">{result.longestWinStreak}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Loss Streak</p>
          <p className="text-lg font-bold font-mono text-red-400">{result.longestLossStreak}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kelly Fraction</p>
          <p className="text-lg font-bold font-mono text-foreground">{(result.kellyFraction * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Equity Curve (simplified — uses SVG line chart) */}
      {result.equityCurve.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Equity Curve
          </h3>
          <EquityCurveMini equityCurve={result.equityCurve} />
        </div>
      )}

      {/* Season Breakdown */}
      {result.seasonBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Season Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-4">Season</th>
                  <th className="text-right py-2 px-2">Games</th>
                  <th className="text-right py-2 px-2">Hits</th>
                  <th className="text-right py-2 px-2">Hit Rate</th>
                  <th className="text-right py-2 px-2">Profit</th>
                  <th className="text-right py-2 pl-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {result.seasonBreakdown.map((s) => (
                  <tr key={s.season} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{s.season}</td>
                    <td className="py-2 px-2 text-right font-mono">{s.games}</td>
                    <td className="py-2 px-2 text-right font-mono">{s.hits}</td>
                    <td className={`py-2 px-2 text-right font-mono font-bold ${
                      s.hitRate >= 0.55 ? "text-emerald-400" : s.hitRate < 0.48 ? "text-red-400" : ""
                    }`}>
                      {Math.round(s.hitRate * 100)}%
                    </td>
                    <td className={`py-2 px-2 text-right font-mono ${
                      s.profit > 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {s.profit > 0 ? "+" : ""}{s.profit.toFixed(1)}u
                    </td>
                    <td className={`py-2 pl-2 text-right font-mono ${
                      s.roi > 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {s.roi > 0 ? "+" : ""}{(s.roi * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution Time */}
      <p className="text-[10px] text-muted-foreground text-right">
        Backtest completed in {result.executionTimeMs}ms · Sample size: {result.sampleSize}
      </p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  subtext,
  color = "gray",
}: {
  label: string
  value: string
  subtext?: string
  color?: "emerald" | "red" | "gray"
}) {
  const valueColor = color === "emerald" ? "text-emerald-400"
    : color === "red" ? "text-red-400" : "text-foreground"

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold font-mono ${valueColor}`}>{value}</p>
      {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
    </div>
  )
}

function EquityCurveMini({ equityCurve }: { equityCurve: BacktestResult["equityCurve"] }) {
  const width = 500
  const height = 120
  const padding = { top: 10, right: 10, bottom: 10, left: 40 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const profits = equityCurve.map(p => p.cumulativeProfit)
  const minProfit = Math.min(0, ...profits)
  const maxProfit = Math.max(0, ...profits)
  const range = maxProfit - minProfit || 1

  const xScale = (i: number) => padding.left + (i / (equityCurve.length - 1)) * plotWidth
  const yScale = (v: number) => padding.top + plotHeight - ((v - minProfit) / range) * plotHeight

  const points = equityCurve.map((p, i) => `${xScale(i)},${yScale(p.cumulativeProfit)}`)
  const linePath = `M ${points.join(" L ")}`

  // Fill to zero line
  const zeroY = yScale(0)
  const fillPath = `${linePath} L ${xScale(equityCurve.length - 1)},${zeroY} L ${xScale(0)},${zeroY} Z`

  const finalProfit = equityCurve[equityCurve.length - 1]?.cumulativeProfit ?? 0
  const isPositive = finalProfit >= 0

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Zero line */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={padding.left + plotWidth}
        y2={zeroY}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4,4"
        className="text-border"
      />

      {/* Fill */}
      <path
        d={fillPath}
        fill={isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={isPositive ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"}
        strokeWidth={1.5}
      />

      {/* End value */}
      <text
        x={padding.left - 4}
        y={yScale(finalProfit) + 4}
        textAnchor="end"
        className={`text-[9px] font-mono ${isPositive ? "fill-emerald-400" : "fill-red-400"}`}
      >
        {finalProfit > 0 ? "+" : ""}{finalProfit.toFixed(1)}u
      </text>
    </svg>
  )
}
