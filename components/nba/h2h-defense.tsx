import type { NBAGame, DefenseVsPosition } from "@/lib/nba-h2h-data"

interface Props {
  game: NBAGame
}

const positions = ["pg", "sg", "sf", "pf", "c"] as const
const positionLabels: Record<string, string> = {
  pg: "vs PG",
  sg: "vs SG",
  sf: "vs SF",
  pf: "vs PF",
  c: "vs C",
}

function getRankColor(rank: number): string {
  if (rank <= 5) return "bg-red-500 text-white"
  if (rank <= 10) return "bg-amber-500 text-white"
  if (rank <= 15) return "bg-amber-400 text-background"
  if (rank <= 20) return "bg-blue-500 text-white"
  return "bg-emerald-500 text-white"
}

function getBarWidth(rank: number): number {
  return Math.max(10, ((30 - rank) / 30) * 100)
}

function DefenseSide({ team, defense }: { team: string; defense: DefenseVsPosition }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-lg font-bold text-primary mb-1">{team}</p>
      <p className="text-xs text-muted-foreground mb-4">Defensive Rankings</p>
      <div className="flex flex-col gap-3">
        {positions.map((pos) => {
          const rank = defense[pos]
          return (
            <div key={pos} className="flex items-center gap-3">
              <span className="text-sm text-foreground w-12 shrink-0">{positionLabels[pos]}</span>
              <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${getBarWidth(rank)}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-bold w-8 h-6 flex items-center justify-center rounded-md shrink-0 ${getRankColor(rank)}`}
              >
                #{rank}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function H2HDefense({ game }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-1">Defense vs Position Matchups</h3>
      <p className="text-xs text-muted-foreground mb-6">
        {"How each team defends against specific positions (1 = best defense, 30 = worst)"}
      </p>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
        <DefenseSide team={game.awayTeam} defense={game.awayDefense} />
        <div className="hidden lg:block w-px bg-border shrink-0" />
        <div className="lg:hidden h-px bg-border" />
        <DefenseSide team={game.homeTeam} defense={game.homeDefense} />
      </div>
    </div>
  )
}
