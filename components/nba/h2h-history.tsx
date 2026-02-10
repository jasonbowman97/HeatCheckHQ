import type { NBAGame } from "@/lib/nba-h2h-data"

interface Props {
  game: NBAGame
}

export function H2HHistory({ game }: Props) {
  const { h2hHistory, awayTeam, homeTeam } = game
  const meetingCount = h2hHistory.recentMeetings.length

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-1">Head-to-Head History</h3>
      <p className="text-xs text-muted-foreground mb-5">
        Last {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} between {awayTeam} and {homeTeam}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Record</p>
          <p className="text-lg font-bold text-foreground font-mono">{h2hHistory.record}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg {homeTeam} Points</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{h2hHistory.homeAvgPts.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg {awayTeam} Points</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{h2hHistory.awayAvgPts.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Total Points</p>
          <p className="text-lg font-bold text-foreground font-mono tabular-nums">{h2hHistory.avgTotal.toFixed(1)}</p>
          <p className="text-[10px] text-primary mt-0.5">Margin for {h2hHistory.margin}</p>
        </div>
      </div>

      {/* Recent meetings */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Meetings</p>
        <div className="flex flex-col gap-2">
          {h2hHistory.recentMeetings.map((meeting, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3"
            >
              <div>
                <p className="text-[10px] text-muted-foreground">{meeting.date}, {meeting.time}</p>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {awayTeam} {meeting.awayScore} @ {homeTeam} {meeting.homeScore}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono tabular-nums">Total: {meeting.total}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    meeting.winner === homeTeam
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {meeting.winner} W
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
