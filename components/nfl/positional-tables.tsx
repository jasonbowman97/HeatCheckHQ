"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown } from "lucide-react"
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
type SortCol = "col2" | "col3"

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
  const [sortCol, setSortCol] = useState<SortCol>("col2")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortCol(col)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      return sortDir === "desc" ? bv - av : av - bv
    })
  }, [players, sortCol, sortDir])

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
              <button type="button" onClick={() => handleSort("col2")} className={`inline-flex items-center gap-1 transition-colors ${sortCol === "col2" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {col2Header}
                <ArrowUpDown className={`h-3 w-3 ${sortCol === "col2" ? "opacity-100" : "opacity-40"}`} />
              </button>
            </th>
            <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 px-3 whitespace-nowrap w-[70px]">
              <button type="button" onClick={() => handleSort("col3")} className={`inline-flex items-center gap-1 transition-colors ${sortCol === "col3" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {col3Header}
                <ArrowUpDown className={`h-3 w-3 ${sortCol === "col3" ? "opacity-100" : "opacity-40"}`} />
              </button>
            </th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 pl-4 whitespace-nowrap">
              {logHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
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

/* ============================================================
   Generic section wrapper — eliminates boilerplate across
   Passing / Rushing / Receiving sections.
   ============================================================ */

interface PositionalSectionProps<P> extends SideBySideProps {
  title: string
  col2Header: string
  col3Header: string
  logHeader: string
  logLabel: "TDs" | "Att" | "Rec"
  awayPlayers: P[]
  homePlayers: P[]
  mapPlayer: (p: P) => { name: string; position: string; col2: number; col3: number; gameLogs: GameLogEntry[] }
}

function PositionalSection<P>({
  title,
  awayTeam,
  homeTeam,
  col2Header,
  col3Header,
  logHeader,
  logLabel,
  awayPlayers,
  homePlayers,
  mapPlayer,
}: PositionalSectionProps<P>) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <HalfTable teamLabel={awayTeam} col2Header={col2Header} col3Header={col3Header} logHeader={logHeader} logLabel={logLabel} players={awayPlayers.map(mapPlayer)} />
        <HalfTable teamLabel={homeTeam} col2Header={col2Header} col3Header={col3Header} logHeader={logHeader} logLabel={logLabel} players={homePlayers.map(mapPlayer)} />
      </div>
    </div>
  )
}

// Passing
export function PassingSection(props: SideBySideProps & { awayPlayers: PassingPlayer[]; homePlayers: PassingPlayer[] }) {
  return (
    <PositionalSection
      {...props}
      title="Passing"
      col2Header="Yds/G"
      col3Header="TDs/G"
      logHeader="Game Logs — Yds (TDs)"
      logLabel="TDs"
      mapPlayer={(p) => ({ name: p.name, position: p.position, col2: p.yardsPerGame, col3: p.tdsPerGame, gameLogs: p.gameLogs })}
    />
  )
}

// Rushing
export function RushingSection(props: SideBySideProps & { awayPlayers: RushingPlayer[]; homePlayers: RushingPlayer[] }) {
  return (
    <PositionalSection
      {...props}
      title="Rushing"
      col2Header="Yds/G"
      col3Header="Att/G"
      logHeader="Game Logs — Yds (Att)"
      logLabel="Att"
      mapPlayer={(p) => ({ name: p.name, position: p.position, col2: p.yardsPerGame, col3: p.attemptsPerGame, gameLogs: p.gameLogs })}
    />
  )
}

// Receiving
export function ReceivingSection(props: SideBySideProps & { awayPlayers: ReceivingPlayer[]; homePlayers: ReceivingPlayer[] }) {
  return (
    <PositionalSection
      {...props}
      title="Receiving"
      col2Header="Yds/G"
      col3Header="Tgts/G"
      logHeader="Game Logs — Yds (Rec)"
      logLabel="Rec"
      mapPlayer={(p) => ({ name: p.name, position: p.position, col2: p.yardsPerGame, col3: p.targetsPerGame, gameLogs: p.gameLogs })}
    />
  )
}
