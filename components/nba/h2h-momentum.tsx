import type { NBAGame, TeamMomentum } from "@/lib/nba-h2h-data"

interface Props {
  game: NBAGame
}

function WLDots({ wins, losses }: { wins: number; losses: number }) {
  const dots: boolean[] = []
  for (let i = 0; i < wins; i++) dots.push(true)
  for (let i = 0; i < losses; i++) dots.push(false)
  return (
    <div className="flex gap-1 mt-1.5">
      {dots.map((isWin, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${isWin ? "bg-emerald-500" : "bg-red-500"}`}
        />
      ))}
    </div>
  )
}

function TeamFormCard({ team, momentum, context }: { team: string; momentum: TeamMomentum; context: "home" | "away" }) {
  const record = context === "home" ? momentum.homeRecord : momentum.awayRecord

  return (
    <div className="flex-1 min-w-0">
      {/* Team name + streak */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-bold text-foreground">{team}</p>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md ${
            momentum.streakType === "W"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {momentum.streak}
        </span>
      </div>

      {/* Core stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Last 10</p>
          <p className="text-base font-bold text-foreground font-mono tabular-nums">
            {momentum.last10.wins}-{momentum.last10.losses}
          </p>
          <WLDots wins={momentum.last10.wins} losses={momentum.last10.losses} />
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">PPG</p>
          <p className="text-base font-bold text-foreground font-mono tabular-nums">{momentum.ppg}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Opp PPG</p>
          <p className="text-base font-bold text-foreground font-mono tabular-nums">{momentum.oppPpg}</p>
        </div>
      </div>

      {/* Contextual record */}
      {record && record !== "N/A" && (
        <div className="mt-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {context === "home" ? "Home" : "Away"} Record
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">{record}</span>
        </div>
      )}
    </div>
  )
}

export function H2HMomentum({ game }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Team Form</h3>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
        <TeamFormCard team={game.awayTeam} momentum={game.awayMomentum} context="away" />
        <div className="hidden lg:block w-px bg-border shrink-0" />
        <div className="lg:hidden h-px bg-border" />
        <TeamFormCard team={game.homeTeam} momentum={game.homeMomentum} context="home" />
      </div>
    </div>
  )
}
