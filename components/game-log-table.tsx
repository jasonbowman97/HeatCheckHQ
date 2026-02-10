"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type Player, getGameLogs, getResultColor } from "@/lib/players-data"
import { Check } from "lucide-react"

interface GameLogTableProps {
  player: Player
}

export function GameLogTable({ player }: GameLogTableProps) {
  const logs = getGameLogs(player.id)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opponent</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pitcher</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Pitch Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Result</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Exit Velo</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Launch Angle</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Distance</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Barrel</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Hard Hit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, idx) => (
            <TableRow key={`${log.date}-${idx}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <TableCell className="py-3">
                <span className="text-sm text-muted-foreground">{log.date}</span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm text-foreground">{log.opponent}</span>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{log.pitcher}</span>
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    log.pitcherHand === "RHP"
                      ? "bg-sky-500/15 text-sky-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}>
                    {log.pitcherHand}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-3 text-center">
                <span className="text-sm text-muted-foreground">{log.pitchType}</span>
              </TableCell>
              <TableCell className="py-3 text-center">
                <span className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-bold ${getResultColor(log.result)}`}>
                  {log.result}
                </span>
              </TableCell>
              <TableCell className="py-3 text-right">
                <span className="text-sm font-mono text-foreground">{log.exitVelo} mph</span>
              </TableCell>
              <TableCell className="py-3 text-right">
                <span className="text-sm font-mono text-muted-foreground">{log.launchAngle}°</span>
              </TableCell>
              <TableCell className="py-3 text-right">
                <span className="text-sm font-mono text-muted-foreground">{log.distance} ft</span>
              </TableCell>
              <TableCell className="py-3 text-center">
                {log.barrel ? (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">-</span>
                )}
              </TableCell>
              <TableCell className="py-3 text-center">
                {log.hardHit ? (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
