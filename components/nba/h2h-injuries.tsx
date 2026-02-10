import type { NBAGame, InjuredPlayer } from "@/lib/nba-h2h-data"
import { AlertTriangle } from "lucide-react"

interface Props {
  game: NBAGame
}

function statusColor(status: InjuredPlayer["status"]): string {
  switch (status) {
    case "Day-To-Day":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20"
    case "Questionable":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20"
    case "Out":
      return "bg-red-500/15 text-red-400 border-red-500/20"
  }
}

function InjurySide({ team, injuries }: { team: string; injuries: InjuredPlayer[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-lg font-bold text-foreground">{team}</p>
        <p className="text-xs text-muted-foreground">({injuries.length} injuries)</p>
      </div>
      <div className="flex flex-col gap-2">
        {injuries.map((player) => (
          <div
            key={player.name}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-primary">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.injury}</p>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${statusColor(player.status)}`}
            >
              {player.status}
            </span>
          </div>
        ))}
        {injuries.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No injuries reported</p>
        )}
      </div>
    </div>
  )
}

export function H2HInjuries({ game }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="text-lg font-bold text-foreground">Injury Report</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Key players who may impact the game</p>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
        <InjurySide team={game.awayTeam} injuries={game.awayInjuries} />
        <div className="hidden lg:block w-px bg-border shrink-0" />
        <div className="lg:hidden h-px bg-border" />
        <InjurySide team={game.homeTeam} injuries={game.homeInjuries} />
      </div>
    </div>
  )
}
