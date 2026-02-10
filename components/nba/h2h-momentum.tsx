import type { NBAGame, TeamMomentum } from "@/lib/nba-h2h-data"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Props {
  game: NBAGame
}

function WLDots({ wins, losses }: { wins: number; losses: number }) {
  const dots: boolean[] = []
  for (let i = 0; i < wins; i++) dots.push(true)
  for (let i = 0; i < losses; i++) dots.push(false)
  return (
    <div className="flex gap-1 mt-2">
      {dots.map((isWin, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${isWin ? "bg-emerald-500" : "bg-red-500"}`}
        />
      ))}
    </div>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "Trending Up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
  if (trend === "Trending Down") return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

function TeamMomentumCard({ team, momentum }: { team: string; momentum: TeamMomentum }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-primary">{team}</p>
          <div className="flex items-center gap-1">
            <TrendIcon trend={momentum.trend} />
            <span className="text-xs text-muted-foreground">{momentum.trend}</span>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md ${
            momentum.streakType === "W"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {momentum.streak} Streak
        </span>
      </div>

      {/* L5 / L10 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Last 5 Games</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">
            {momentum.last5.wins}-{momentum.last5.losses}
          </p>
          <WLDots wins={momentum.last5.wins} losses={momentum.last5.losses} />
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Last 10 Games</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">
            {momentum.last10.wins}-{momentum.last10.losses}
          </p>
          <WLDots wins={momentum.last10.wins} losses={momentum.last10.losses} />
        </div>
      </div>

      {/* PPG */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Points Per Game</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.ppg}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Opp Points Per Game</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.oppPpg}</p>
        </div>
      </div>

      {/* Betting metrics */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Betting Metrics</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">ATS Record</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.atsRecord}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Over/Under</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.ouRecord}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Home Record</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.homeRecord}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{momentum.homePpg} PPG</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Away Record</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{momentum.awayRecord}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{momentum.awayPpg} PPG</p>
        </div>
      </div>
    </div>
  )
}

export function H2HMomentum({ game }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-1">Team Momentum & Form</h3>
      <p className="text-xs text-muted-foreground mb-6">Recent performance trends and streaks</p>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
        <TeamMomentumCard team={game.awayTeam} momentum={game.awayMomentum} />
        <div className="hidden lg:block w-px bg-border shrink-0" />
        <div className="lg:hidden h-px bg-border" />
        <TeamMomentumCard team={game.homeTeam} momentum={game.homeMomentum} />
      </div>
    </div>
  )
}
