import type { NBAGame } from "@/lib/nba-h2h-data"

interface Props {
  game: NBAGame
}

export function H2HHistory({ game }: Props) {
  const { h2hHistory, awayTeam, homeTeam } = game
  const meetings = h2hHistory.recentMeetings.slice(0, 3)

  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-bold text-foreground mb-1">Season Series</h3>
        <p className="text-xs text-muted-foreground">No meetings between {awayTeam} and {homeTeam} this season.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Season Series</h3>
        <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md font-mono">
          {h2hHistory.record}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {meetings.map((meeting, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-14">{meeting.date}</span>
              <span className="text-sm font-semibold text-foreground font-mono tabular-nums">
                {awayTeam} {meeting.awayScore} - {meeting.homeScore} {homeTeam}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                meeting.winner === homeTeam
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {meeting.winner}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
