"use client"

import { type Player, getGameLogs } from "@/lib/players-data"

interface StatCardsProps {
  player: Player
}

interface StatCardProps {
  label: string
  value: string | number
  highlight?: "primary" | "accent" | "destructive" | "default"
}

function StatCard({ label, value, highlight = "default" }: StatCardProps) {
  const highlightClasses = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    default: "text-foreground",
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold font-mono ${highlightClasses[highlight]}`}>{value}</span>
    </div>
  )
}

export function StatCards({ player }: StatCardsProps) {
  const logs = getGameLogs(player.id)
  const hits = logs.filter((l) => l.result !== "Out").length
  const hrs = logs.filter((l) => l.result === "HR").length
  const ks = Math.max(1, Math.floor(logs.length * 0.12))
  const avgEv = logs.length > 0
    ? (logs.reduce((sum, l) => sum + l.exitVelo, 0) / logs.length).toFixed(1)
    : "0"
  const barrels = logs.filter((l) => l.barrel).length
  const hardHits = logs.filter((l) => l.hardHit).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StatCard label="At Bats" value={logs.length} />
      <StatCard label="Hits" value={hits} highlight="primary" />
      <StatCard label="HR" value={hrs} highlight="primary" />
      <StatCard label="K" value={ks} highlight="destructive" />
      <StatCard label="Avg EV" value={avgEv} />
      <StatCard label="Barrel" value={barrels} highlight="accent" />
      <StatCard label="Hard Hit" value={hardHits} highlight="primary" />
    </div>
  )
}
