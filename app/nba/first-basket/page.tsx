"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { NBAHeader } from "@/components/nba/nba-header"
import { DateNavigator } from "@/components/nba/date-navigator"
import { FirstBasketTable, buildRows } from "@/components/nba/first-basket-table"
import { TopPicks } from "@/components/nba/top-picks"
import type { NBAScheduleGame } from "@/lib/nba-api"
import type { BPFirstBasketPlayer, BPTeamTipoff } from "@/lib/bettingpros-scraper"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** ESPN → BettingPros team abbreviation mapping */
const ESPN_TO_BP: Record<string, string> = {
  GS: "GSW", SA: "SAS", NY: "NYK", NO: "NOP",
  WSH: "WAS", PHX: "PHO", UTAH: "UTH",
}
function toBP(espn: string): string {
  return ESPN_TO_BP[espn] ?? espn
}

interface GameInfo {
  id: string
  away: string
  awayLogo?: string
  home: string
  homeLogo?: string
  label: string
  time: string
  venue: string
  status: string
}

function toLiveGames(espnGames: NBAScheduleGame[]): GameInfo[] {
  return espnGames.map((g, i) => ({
    id: g.id || `live-${i}`,
    away: g.awayTeam.abbreviation,
    awayLogo: g.awayTeam.logo,
    home: g.homeTeam.abbreviation,
    homeLogo: g.homeTeam.logo,
    label: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
    time: new Date(g.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    venue: g.venue,
    status: g.status,
  }))
}

export default function NBAFirstBasketPage() {
  const [date, setDate] = useState(new Date())
  const [gameFilter, setGameFilter] = useState("all")
  const [sortColumn, setSortColumn] = useState("firstBasketPct")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const dateParam = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const { data: scheduleData, isLoading: scheduleLoading } = useSWR<{ games: NBAScheduleGame[] }>(
    `/api/nba/schedule?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const { data: fbData, isLoading: fbLoading } = useSWR<{
    players: BPFirstBasketPlayer[]
    teams: BPTeamTipoff[]
  }>("/api/nba/first-basket", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000,
  })

  const isLoading = scheduleLoading || fbLoading

  const games = useMemo(() => (scheduleData?.games?.length ? toLiveGames(scheduleData.games) : []), [scheduleData])
  const hasLiveStats = !!fbData?.players?.length

  // Get today's team abbreviations for filtering players (convert to BettingPros format)
  const todayTeams = useMemo(() => {
    const teams = new Set<string>()
    for (const g of games) {
      teams.add(toBP(g.away))
      teams.add(toBP(g.home))
    }
    return teams
  }, [games])

  // Build matchup map: team → { opponent, isHome } (using BettingPros abbreviations)
  const matchupMap = useMemo(() => {
    const map: Record<string, { opponent: string; isHome: boolean }> = {}
    for (const g of games) {
      map[toBP(g.home)] = { opponent: toBP(g.away), isHome: true }
      map[toBP(g.away)] = { opponent: toBP(g.home), isHome: false }
    }
    return map
  }, [games])

  // Filter first basket players to today's teams
  const filteredPlayers = useMemo(() => {
    if (!fbData?.players?.length) return []
    return fbData.players.filter((p) => todayTeams.has(p.team))
  }, [fbData, todayTeams])

  // Build team tipoff lookup
  const teamTipoffs = useMemo(() => {
    const map: Record<string, BPTeamTipoff> = {}
    for (const t of fbData?.teams ?? []) {
      map[t.team] = t
    }
    return map
  }, [fbData])

  // Build rows for Top Picks (unfiltered by game, sorted by composite)
  const allRows = useMemo(() => {
    return buildRows(filteredPlayers, teamTipoffs, matchupMap, "all")
  }, [filteredPlayers, teamTipoffs, matchupMap])

  const handlePrevDay = useCallback(() => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }, [])

  const handleNextDay = useCallback(() => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }, [])

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NBAHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">First Basket Analysis</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {hasLiveStats && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
            {!isLoading && games.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {games.length} Games · Season Stats
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Track which players score the first basket and their team{"'"}s tipoff win rate.
          </p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-4">
          <DateNavigator date={date} onPrev={handlePrevDay} onNext={handleNextDay} />

          <div className="flex items-center gap-2">
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-[180px] h-9 bg-card border-border text-sm">
                <SelectValue placeholder="All Matchups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matchups</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game.id} value={`${game.away}-${game.home}`}>
                    {game.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Games strip */}
        {games.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">{"Today's games:"}</span>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() =>
                  setGameFilter((prev) =>
                    prev === `${game.away}-${game.home}` ? "all" : `${game.away}-${game.home}`
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  gameFilter === `${game.away}-${game.home}`
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {game.awayLogo && <Image src={game.awayLogo} alt={game.away} width={16} height={16} className="rounded" unoptimized />}
                {game.label}
                {game.homeLogo && <Image src={game.homeLogo} alt={game.home} width={16} height={16} className="rounded" unoptimized />}
              </button>
            ))}
          </div>
        )}

        {/* No games state */}
        {!isLoading && games.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">No games scheduled for this date.</p>
          </div>
        )}

        {/* Top Picks spotlight */}
        {allRows.length > 0 && gameFilter === "all" && (
          <TopPicks rows={allRows} />
        )}

        {/* Table */}
        {games.length > 0 && (
          <FirstBasketTable
            players={filteredPlayers}
            teamTipoffs={teamTipoffs}
            gameFilter={gameFilter}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLive={hasLiveStats}
            matchupMap={matchupMap}
          />
        )}
      </main>
    </div>
  )
}
