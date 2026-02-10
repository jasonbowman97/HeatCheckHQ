"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  passingPlayers,
  rushingPlayers,
  receivingPlayers,
  type PositionTab,
  type RedzonePassingPlayer,
  type RedzoneRushingPlayer,
  type RedzoneReceivingPlayer,
} from "@/lib/nfl-redzone-data"
import { ArrowUpDown, Search } from "lucide-react"

type SortDir = "asc" | "desc"

const positionTabs: { key: PositionTab; label: string }[] = [
  { key: "passing", label: "Passing" },
  { key: "rushing", label: "Rushing" },
  { key: "receiving", label: "Receiving" },
]

const teams = [
  "All Teams",
  "ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET",
  "GB","HOU","IND","JAX","KC","LAC","LAR","LV","MIA","MIN","NE",
  "NO","NYG","NYJ","PHI","PIT","SEA","SF","TB","TEN","WAS",
]

const zoneLabels = ["Red Zone"]
const zones = ["redzone"]

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
      />
      {active && (
        <span className="text-[9px] text-primary font-bold">
          {dir === "desc" ? "v" : "^"}
        </span>
      )}
    </button>
  )
}

export function RedzoneTable() {
  const [tab, setTab] = useState<PositionTab>("passing")
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState("All Teams")
  const [sortField, setSortField] = useState("totTd")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function getVal(player: Record<string, unknown>, field: string): number {
    if (field.includes(".")) {
      const [zone, key] = field.split(".")
      const zoneObj = player[zone] as Record<string, number> | undefined
      return zoneObj?.[key] ?? 0
    }
    return (player[field] as number) ?? 0
  }

  const filteredSorted = useMemo(() => {
    let data: Record<string, unknown>[]
    if (tab === "passing") data = passingPlayers as unknown as Record<string, unknown>[]
    else if (tab === "rushing") data = rushingPlayers as unknown as Record<string, unknown>[]
    else data = receivingPlayers as unknown as Record<string, unknown>[]

    let filtered = data.filter((p) => {
      const name = (p.name as string).toLowerCase()
      const team = p.team as string
      const matchesSearch = name.includes(search.toLowerCase())
      const matchesTeam = teamFilter === "All Teams" || team === teamFilter
      return matchesSearch && matchesTeam
    })

    filtered.sort((a, b) => {
      const aVal = getVal(a, sortField)
      const bVal = getVal(b, sortField)
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })

    return filtered
  }, [tab, search, teamFilter, sortField, sortDir])

  const passingHeaders = ["ATT", "COMP", "COMP%", "TD", "INT"]
  const passingFields = ["att", "comp", "compPct", "td", "int"]
  const rushingHeaders = ["ATT", "YDS", "AVG", "TD"]
  const rushingFields = ["att", "yds", "avg", "td"]
  const receivingHeaders = ["TGT", "REC", "YDS", "TD"]
  const receivingFields = ["tgt", "rec", "yds", "td"]

  const zoneHeaders = tab === "passing" ? passingHeaders : tab === "rushing" ? rushingHeaders : receivingHeaders
  const zoneFields = tab === "passing" ? passingFields : tab === "rushing" ? rushingFields : receivingFields

  function renderZoneCells(player: Record<string, unknown>) {
    const zoneObj = player.redzone as Record<string, number>
    return zoneFields.map((f) => {
      const val = zoneObj[f]
      const display = f === "compPct" || f === "avg" ? val.toFixed(1) : val
      const suffix = f === "compPct" ? "%" : ""
      return (
        <TableCell key={`rz-${f}`} className="py-3 text-center">
          <span className="text-sm text-foreground font-mono tabular-nums">
            {display}{suffix}
          </span>
        </TableCell>
      )
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Position tabs */}
        <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
          {positionTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSortField("totTd"); setSortDir("desc") }}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Team filter */}
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-[200px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Group header row */}
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead colSpan={4} className="text-center text-xs font-bold uppercase tracking-wider text-foreground border-r border-border py-2">
                Player
              </TableHead>
              <TableHead colSpan={zoneHeaders.length} className="text-center text-xs font-bold uppercase tracking-wider text-foreground py-2">
                Redzone
              </TableHead>
            </TableRow>
            {/* Column header row */}
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-4 py-2 w-[160px]">
                <SortButton label="Name" active={sortField === "name"} dir={sortDir} onClick={() => handleSort("name")} />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center py-2 w-[50px]">
                POS
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center py-2 w-[50px]">
                TM
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center py-2 w-[50px] border-r border-border">
                <SortButton label="TOT TD" active={sortField === "totTd"} dir={sortDir} onClick={() => handleSort("totTd")} />
              </TableHead>
              {zones.map((zone, zi) =>
                zoneHeaders.map((h, hi) => (
                  <TableHead
                    key={`${zone}-${h}`}
                    className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center py-2 w-[68px] ${
                      hi === zoneHeaders.length - 1 && zi < zones.length - 1 ? "border-r border-border" : ""
                    }`}
                  >
                    <SortButton
                      label={h}
                      active={sortField === `${zone}.${zoneFields[hi]}`}
                      dir={sortDir}
                      onClick={() => handleSort(`${zone}.${zoneFields[hi]}`)}
                    />
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4 + zoneHeaders.length * 3} className="text-center py-12 text-sm text-muted-foreground">
                  No players found
                </TableCell>
              </TableRow>
            ) : (
              filteredSorted.map((player) => (
                <TableRow key={player.name as string} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="py-3 pl-4">
                    <span className="text-sm font-semibold text-primary">
                      {player.name as string}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="text-xs text-muted-foreground font-mono">
                      {player.pos as string}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="text-xs font-semibold text-foreground">
                      {player.team as string}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center border-r border-border">
                    <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                      {player.totTd as number}
                    </span>
                  </TableCell>
                  {zones.map((zone, zi) => (
                    renderZoneCells(player).map((cell, ci) => {
                      const isLast = ci === zoneFields.length - 1 && zi < zones.length - 1
                      if (isLast) {
                        return (
                          <TableCell key={`${zone}-${zoneFields[ci]}-border`} className="py-3 text-center border-r border-border">
                            {cell}
                          </TableCell>
                        )
                      }
                      return cell
                    })
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
