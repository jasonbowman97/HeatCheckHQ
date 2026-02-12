export interface NrfiPitcher {
  id: number
  name: string
  hand: "L" | "R"
  nrfiWins: number
  nrfiLosses: number
  nrfiPct: number
  streak: number // positive = NRFI streak, negative = RFI streak
}

export interface NrfiGame {
  gamePk: number
  time: string
  venue: string
  away: { team: string; pitcher: NrfiPitcher | null }
  home: { team: string; pitcher: NrfiPitcher | null }
}

export function getStreakColor(streak: number): string {
  if (streak >= 5) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
  if (streak >= 3) return "bg-emerald-500/10 text-emerald-400"
  if (streak <= -5) return "bg-red-500/20 text-red-400 border border-red-500/30"
  if (streak <= -3) return "bg-red-500/10 text-red-400"
  return "text-muted-foreground"
}

export function getNrfiPctColor(pct: number): string {
  if (pct >= 80) return "text-emerald-400"
  if (pct >= 70) return "text-emerald-400/80"
  if (pct <= 50) return "text-red-400"
  if (pct <= 60) return "text-amber-400"
  return "text-foreground"
}
