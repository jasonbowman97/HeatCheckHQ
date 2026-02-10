"use client"

import type { PassingPlayer, RushingPlayer, ReceivingPlayer, GameLogEntry } from "@/lib/nfl-matchup-data"

function GameLogChips({ logs, label }: { logs: GameLogEntry[]; label: "TDs" | "Att" | "Rec" }) {
  if (logs.length === 0) {
    return <span className="text-xs text-muted-foreground/50">--</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {logs.map((log, i) => {
        const isHigh = label === "TDs" ? log.secondary >= 2 : log.yards >= 80
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono tabular-nums ${
              isHigh
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {log.yards}
            <span className="text-muted-foreground/60">({log.secondary})</span>
          </span>
        )
      })}
    </div>
  )
}

interface SideBySideProps {
  awayTeam: string
  homeTeam: string
}

/* ============================================================
   Shared half-table used by every section.
   Using <table> guarantees columns stay aligned across all rows.
   ============================================================ */
function HalfTable({
  teamLabel,
  col2Header,
  col3Header,
  logHeader,
  logLabel,
  players,
}: {
  teamLabel: string
  col2Header: string
  col3Header: string
  logHeader: string
  logLabel: "TDs" | "Att" | "Rec"
  players: {
    name: string
    position: string
    col2: number
    col3: number
    gameLogs: GameLogEntry[]
  }[]
}) {
  return (
    <div className="p-4 overflow-x-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {teamLabel}
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pr-4 whitespace-nowrap">
              Player
            </th>
            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-3 whitespace-nowrap w-[80px]">
              {col2Header}
            </th>
            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-3 whitespace-nowrap w-[70px]">
              {col3Header}
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pl-4 whitespace-nowrap">
              {logHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.name} className="border-b border-border/30 last:border-b-0">
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {p.position}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right w-[80px]">
                <span className="text-sm font-mono tabular-nums text-foreground">
                  {p.col2.toFixed(1)}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right w-[70px]">
                <span className="text-sm font-mono tabular-nums text-foreground">
                  {p.col3.toFixed(1)}
                </span>
              </td>
              <td className="py-2.5 pl-4">
                <GameLogChips logs={p.gameLogs} label={logLabel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Passing
export function PassingSection({
  awayPlayers,
  homePlayers,
  awayTeam,
  homeTeam,
}: SideBySideProps & { awayPlayers: PassingPlayer[]; homePlayers: PassingPlayer[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">Passing</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <HalfTable
          teamLabel={awayTeam}
          col2Header="Yds/G"
          col3Header="TDs/G"
          logHeader="Game Logs — Yds (TDs)"
          logLabel="TDs"
          players={awayPlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.tdsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
        <HalfTable
          teamLabel={homeTeam}
          col2Header="Yds/G"
          col3Header="TDs/G"
          logHeader="Game Logs — Yds (TDs)"
          logLabel="TDs"
          players={homePlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.tdsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
      </div>
    </div>
  )
}

// Rushing
export function RushingSection({
  awayPlayers,
  homePlayers,
  awayTeam,
  homeTeam,
}: SideBySideProps & { awayPlayers: RushingPlayer[]; homePlayers: RushingPlayer[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">Rushing</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <HalfTable
          teamLabel={awayTeam}
          col2Header="Yds/G"
          col3Header="Att/G"
          logHeader="Game Logs — Yds (Att)"
          logLabel="Att"
          players={awayPlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.attemptsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
        <HalfTable
          teamLabel={homeTeam}
          col2Header="Yds/G"
          col3Header="Att/G"
          logHeader="Game Logs — Yds (Att)"
          logLabel="Att"
          players={homePlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.attemptsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
      </div>
    </div>
  )
}

// Receiving
export function ReceivingSection({
  awayPlayers,
  homePlayers,
  awayTeam,
  homeTeam,
}: SideBySideProps & { awayPlayers: ReceivingPlayer[]; homePlayers: ReceivingPlayer[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">Receiving</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <HalfTable
          teamLabel={awayTeam}
          col2Header="Yds/G"
          col3Header="Tgts/G"
          logHeader="Game Logs — Yds (Rec)"
          logLabel="Rec"
          players={awayPlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.targetsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
        <HalfTable
          teamLabel={homeTeam}
          col2Header="Yds/G"
          col3Header="Tgts/G"
          logHeader="Game Logs — Yds (Rec)"
          logLabel="Rec"
          players={homePlayers.map((p) => ({
            name: p.name,
            position: p.position,
            col2: p.yardsPerGame,
            col3: p.targetsPerGame,
            gameLogs: p.gameLogs,
          }))}
        />
      </div>
    </div>
  )
}
