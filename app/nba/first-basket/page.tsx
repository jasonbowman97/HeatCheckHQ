"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Loader2, Zap, ArrowRight, AlertCircle, RefreshCw, Lock, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { DateNavigator } from "@/components/nba/date-navigator"
import { FirstBasketTable, buildRows } from "@/components/nba/first-basket-table"
import { TopPicks } from "@/components/nba/top-picks"
import { SignupGate } from "@/components/signup-gate"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { useUserTier } from "@/components/user-tier-provider"
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
  GS: "GSW", SA: "SAS", NY: "NYK", NO: "NOR",
  WSH: "WAS", PHX: "PHO", UTAH: "UTH",
}
function toBP(espn: string): string {
  return ESPN_TO_BP[espn] ?? espn
}

/** NBA.com → BettingPros team abbreviation mapping (for lineup data) */
const NBA_TO_BP: Record<string, string> = {
  NOP: "NOR", UTA: "UTH", PHX: "PHO",
  GSW: "GSW", SAS: "SAS", NYK: "NYK", WAS: "WAS",
}
function nbaToBP(nba: string): string {
  return NBA_TO_BP[nba] ?? nba
}

/** Normalize a name for fuzzy matching (strip suffixes, lowercase, remove accents) */
function normalizeName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\b(Jr\.?|Sr\.?|III|II|IV)\b/gi, "")     // strip suffixes
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Build starter set from lineup data. Returns the set AND which teams have lineup data. */
function buildStarterSet(starters: Record<string, string[]>): { set: Set<string>; teamsWithData: Set<string> } {
  const set = new Set<string>()
  const teamsWithData = new Set<string>()
  for (const [nbaTeam, names] of Object.entries(starters)) {
    const bpTeam = nbaToBP(nbaTeam)
    if (names.length > 0) teamsWithData.add(bpTeam)
    for (const name of names) {
      // Exact match key: "LeBron James|LAL"
      set.add(`${name}|${bpTeam}`)
      // Normalized full name match (handles accents, suffixes)
      set.add(`~full:${normalizeName(name)}|${bpTeam}`)
      // Fallback: last name only + team (handles "Nic" vs "Nicolas" etc.)
      const lastName = name.split(" ").pop()?.toLowerCase() ?? ""
      if (lastName) set.add(`~last:${lastName}|${bpTeam}`)
    }
  }
  return { set, teamsWithData }
}

function isStarter(
  player: BPFirstBasketPlayer,
  starterSet: Set<string>,
  teamsWithData: Set<string>,
): boolean {
  // If we have no lineup data for this team, include the player
  // (don't exclude players just because lineups aren't available)
  if (!teamsWithData.has(player.team)) return true

  // Try exact name + team match first
  if (starterSet.has(`${player.name}|${player.team}`)) return true
  // Normalized full name match
  if (starterSet.has(`~full:${normalizeName(player.name)}|${player.team}`)) return true
  // Fallback: last name + team
  const lastName = player.name.split(" ").pop()?.toLowerCase() ?? ""
  return starterSet.has(`~last:${lastName}|${player.team}`)
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

/** Number of table rows visible to anonymous users */
const PREVIEW_ROWS = 8

export default function NBAFirstBasketPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [date, setDate] = useState(new Date())
  const [gameFilter, setGameFilter] = useState("all")
  const [minGames, setMinGames] = useState(0)
  const [startersOnly, setStartersOnly] = useState(true)
  const [sortColumn, setSortColumn] = useState("firstBasketPct")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const dateParam = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const { data: scheduleData, isLoading: scheduleLoading, error: scheduleError, mutate: mutateSchedule } = useSWR<{ games: NBAScheduleGame[] }>(
    `/api/nba/schedule?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const { data: fbData, isLoading: fbLoading, error: fbError, mutate: mutateFb } = useSWR<{
    players: BPFirstBasketPlayer[]
    teams: BPTeamTipoff[]
    updatedAt?: string
  }>("/api/nba/first-basket", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000,
  })

  const { data: lineupsData } = useSWR<{ starters: Record<string, string[]> }>(
    "/api/nba/lineups",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const hasError = scheduleError || fbError

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

  // Build starter name set from lineup data
  const { starterSet, teamsWithLineups } = useMemo(() => {
    if (!lineupsData?.starters) return { starterSet: new Set<string>(), teamsWithLineups: new Set<string>() }
    const { set, teamsWithData } = buildStarterSet(lineupsData.starters)
    return { starterSet: set, teamsWithLineups: teamsWithData }
  }, [lineupsData])

  // Filter first basket players to today's teams + minimum games started + optional starters filter
  const filteredPlayers = useMemo(() => {
    if (!fbData?.players?.length) return []
    return fbData.players.filter((p) =>
      todayTeams.has(p.team) &&
      p.gamesStarted >= minGames &&
      (!startersOnly || isStarter(p, starterSet, teamsWithLineups))
    )
  }, [fbData, todayTeams, minGames, startersOnly, starterSet, teamsWithLineups])

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
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">NBA First Basket Picks Today</h1>
            <SectionInfoTip page="/nba/first-basket" />
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
          <LastUpdated timestamp={fbData?.updatedAt} />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <DateNavigator date={date} onPrev={handlePrevDay} onNext={handleNextDay} />

          {/* Game + Min GP filters — locked for anonymous users */}
          <div className="relative flex flex-wrap items-center gap-3 sm:gap-4">
            {isAnonymous && (
              <div className="absolute inset-0 z-10 flex items-center justify-end pr-2">
                <Link
                  href="/auth/sign-up"
                  className="flex items-center gap-1.5 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm backdrop-blur-sm"
                >
                  <Lock className="h-3 w-3" />
                  Sign up to filter
                </Link>
              </div>
            )}
            <div className={isAnonymous ? "pointer-events-none opacity-40 flex flex-wrap items-center gap-3 sm:gap-4" : "flex flex-wrap items-center gap-3 sm:gap-4"}>
              <div className="flex items-center gap-2">
                <Select value={gameFilter} onValueChange={setGameFilter}>
                  <SelectTrigger className="w-[160px] sm:w-[180px] h-9 bg-card border-border text-sm" aria-label="Filter by game matchup">
                    <SelectValue placeholder="All Matchups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matchups</SelectItem>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={`${toBP(game.away)}-${toBP(game.home)}`}>
                        {game.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min games started filter */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min GP</span>
                <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Minimum games played">
                  {([0, 10, 20, 30] as const).map((threshold) => (
                    <button
                      key={threshold}
                      type="button"
                      onClick={() => setMinGames(threshold)}
                      aria-pressed={minGames === threshold}
                      aria-label={threshold === 0 ? "All games played" : `Minimum ${threshold} games played`}
                      className={`px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-semibold transition-colors ${
                        minGames === threshold
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {threshold === 0 ? "All" : `${threshold}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected starters filter */}
              <button
                type="button"
                onClick={() => setStartersOnly((prev) => !prev)}
                aria-pressed={startersOnly}
                aria-label="Show starters only"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                  startersOnly
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                <Users className="h-3 w-3" />
                Starters Only
              </button>
            </div>
          </div>
        </div>

        {/* Games strip — locked for anonymous users */}
        {games.length > 0 && (
          <div className={isAnonymous ? "pointer-events-none opacity-40" : ""}>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by game">
              <span className="text-xs text-muted-foreground mr-1">{"Today's games:"}</span>
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() =>
                    setGameFilter((prev) =>
                      prev === `${toBP(game.away)}-${toBP(game.home)}` ? "all" : `${toBP(game.away)}-${toBP(game.home)}`
                    )
                  }
                  aria-pressed={gameFilter === `${toBP(game.away)}-${toBP(game.home)}`}
                  aria-label={`Filter to ${game.label}`}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    gameFilter === `${toBP(game.away)}-${toBP(game.home)}`
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {game.awayLogo && <Image src={game.awayLogo} alt={game.away} width={16} height={16} className="rounded" />}
                  {game.label}
                  {game.homeLogo && <Image src={game.homeLogo} alt={game.home} width={16} height={16} className="rounded" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-foreground">Failed to load data</p>
            <p className="text-xs text-muted-foreground">Something went wrong. Try refreshing.</p>
            <button
              onClick={() => { mutateSchedule(); mutateFb() }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* No games state */}
        {!isLoading && !hasError && games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No games scheduled</p>
            <p className="text-xs text-muted-foreground">Try selecting a different date.</p>
          </div>
        )}

        {/* Top Picks spotlight — hidden for anonymous users */}
        {!isAnonymous && allRows.length > 0 && gameFilter === "all" && (
          <TopPicks rows={allRows} maxPicks={5} />
        )}

        {/* Table */}
        {games.length > 0 && (
          isAnonymous ? (
            <SignupGate
              headline="See all first basket picks — free"
              description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
              countLabel={`${allRows.length} players available today`}
              preview={
                <FirstBasketTable
                  players={filteredPlayers}
                  teamTipoffs={teamTipoffs}
                  gameFilter={gameFilter}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  isLive={hasLiveStats}
                  matchupMap={matchupMap}
                  maxRows={PREVIEW_ROWS}
                />
              }
              gated={
                <FirstBasketTable
                  players={filteredPlayers}
                  teamTipoffs={teamTipoffs}
                  gameFilter={gameFilter}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  isLive={hasLiveStats}
                  matchupMap={matchupMap}
                  skipRows={PREVIEW_ROWS}
                />
              }
            />
          ) : (
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
          )
        )}
        {/* Pro upsell for free users */}
        {userTier === "free" && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Go Pro for unlimited data, all filters & zero gates</p>
                <p className="text-xs text-muted-foreground">Full access to every dashboard — $12/mo</p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Go Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </main>
    </DashboardShell>
  )
}
