// ============================================================
// components/matchup-xray/h2h-history.tsx — Historical H2H table
// ============================================================
// Shows recent head-to-head results with scores and totals.

"use client"

import { History } from "lucide-react"
import type { H2HHistory } from "@/types/innovation-playbook"

interface H2HHistoryProps {
  history: H2HHistory
  homeTeam: string
  awayTeam: string
}

export function H2HHistoryView({ history, homeTeam, awayTeam }: H2HHistoryProps) {
  if (history.totalGames === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <History className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recent H2H data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-primary" />
          Head-to-Head History
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-0 border-b border-border">
        <div className="p-3 text-center border-r border-border">
          <p className="text-[10px] text-muted-foreground uppercase">{homeTeam} Wins</p>
          <p className="text-lg font-bold text-foreground">{history.homeWins}</p>
        </div>
        <div className="p-3 text-center border-r border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Games</p>
          <p className="text-lg font-bold text-foreground">{history.totalGames}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">{awayTeam} Wins</p>
          <p className="text-lg font-bold text-foreground">{history.awayWins}</p>
        </div>
      </div>

      {/* Avg total */}
      <div className="px-4 py-2 border-b border-border bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Average Total: <span className="font-bold text-foreground">{history.avgTotal}</span>
        </p>
      </div>

      {/* Recent results table */}
      {history.recentResults.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-3 py-2 text-left text-muted-foreground font-medium">Date</th>
                <th className="px-3 py-2 text-center text-muted-foreground font-medium">Home</th>
                <th className="px-3 py-2 text-center text-muted-foreground font-medium">Away</th>
                <th className="px-3 py-2 text-right text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.recentResults.map((result, i) => {
                const homeWon = result.homeScore > result.awayScore
                return (
                  <tr key={i}>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(result.date)}
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${homeWon ? 'text-emerald-400' : 'text-foreground'}`}>
                      {result.homeScore}
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${!homeWon ? 'text-emerald-400' : 'text-foreground'}`}>
                      {result.awayScore}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">{result.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
