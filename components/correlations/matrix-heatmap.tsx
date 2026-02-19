// ============================================================
// components/correlations/matrix-heatmap.tsx — Correlation grid
// ============================================================
// Color-coded grid showing pairwise correlations between
// player props. Red=negative, green=positive, gray=weak.

"use client"

import { Grid3x3 } from "lucide-react"
import type { CorrelationPair, CorrelationPlayer } from "@/types/innovation-playbook"

interface MatrixHeatmapProps {
  players: CorrelationPlayer[]
  correlations: CorrelationPair[]
}

export function MatrixHeatmap({ players, correlations }: MatrixHeatmapProps) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Grid3x3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No correlation data available</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Correlations require at least 10 shared games between players
        </p>
      </div>
    )
  }

  // Build lookup map: "playerAId:playerBId" -> correlation
  const corrMap = new Map<string, CorrelationPair>()
  for (const pair of correlations) {
    corrMap.set(`${pair.playerAId}:${pair.playerBId}`, pair)
    corrMap.set(`${pair.playerBId}:${pair.playerAId}`, pair)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Grid3x3 className="h-3.5 w-3.5 text-primary" />
          Correlation Matrix
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-muted-foreground font-medium" />
              {players.map(p => (
                <th key={p.id} className="px-2 py-1.5 text-center text-muted-foreground font-medium">
                  <div className="flex flex-col items-center">
                    <span className="truncate max-w-[60px]">{p.name.split(' ').pop()}</span>
                    <span className="text-[9px] text-muted-foreground/60">{p.stat}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(rowPlayer => (
              <tr key={rowPlayer.id}>
                <td className="px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                  <span className="truncate max-w-[80px] block">{rowPlayer.name.split(' ').pop()}</span>
                  <span className="text-[9px] text-muted-foreground">{rowPlayer.team} &middot; {rowPlayer.stat}</span>
                </td>
                {players.map(colPlayer => {
                  if (rowPlayer.id === colPlayer.id) {
                    return (
                      <td key={colPlayer.id} className="px-2 py-1.5 text-center">
                        <span className="inline-block w-10 h-8 rounded bg-muted/50 leading-8 text-muted-foreground font-mono">
                          1.00
                        </span>
                      </td>
                    )
                  }

                  const pair = corrMap.get(`${rowPlayer.id}:${colPlayer.id}`)

                  return (
                    <td key={colPlayer.id} className="px-2 py-1.5 text-center">
                      <CorrelationCell pair={pair} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30" />
            <span>Strong Negative</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted/30" />
            <span>Weak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/30" />
            <span>Strong Positive</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CorrelationCell({ pair }: { pair: CorrelationPair | undefined }) {
  if (!pair) {
    return (
      <span className="inline-block w-10 h-8 rounded bg-muted/20 leading-8 text-muted-foreground/40 font-mono text-[10px]">
        —
      </span>
    )
  }

  const r = pair.correlation
  const bgColor = r >= 0.7 ? 'bg-emerald-500/30' :
    r >= 0.4 ? 'bg-emerald-500/15' :
    r <= -0.7 ? 'bg-red-500/30' :
    r <= -0.4 ? 'bg-red-500/15' :
    'bg-muted/20'

  const textColor = r >= 0.4 ? 'text-emerald-400' :
    r <= -0.4 ? 'text-red-400' :
    'text-muted-foreground'

  return (
    <span
      className={`inline-block w-10 h-8 rounded ${bgColor} leading-8 ${textColor} font-mono text-[10px] font-bold cursor-default`}
      title={pair.insight}
    >
      {r.toFixed(2)}
    </span>
  )
}
