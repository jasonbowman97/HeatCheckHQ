/**
 * NFL data via ESPN public API.
 * No API key required.
 * Base: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
const LEADERS_BASE = "https://site.api.espn.com/apis/site/v3/sports/football/nfl"

async function espnFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 43200 } })
  if (!res.ok) throw new Error(`ESPN NFL ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NFLScheduleGame {
  id: string
  date: string
  name: string
  shortName: string
  week: string
  awayTeam: { id: string; abbreviation: string; displayName: string; logo: string; score?: string }
  homeTeam: { id: string; abbreviation: string; displayName: string; logo: string; score?: string }
  status: string
  venue: string
  broadcast: string
  odds?: { details: string; overUnder: number }
}

export interface NFLTeamRecord {
  id: string
  abbreviation: string
  displayName: string
  wins: number
  losses: number
  logo: string
}

/* ------------------------------------------------------------------ */
/*  Scoreboard / Schedule                                              */
/* ------------------------------------------------------------------ */

export async function getNFLScoreboard(week?: number, year?: number): Promise<NFLScheduleGame[]> {
  const params = new URLSearchParams()
  if (week) params.set("week", String(week))
  if (year) params.set("seasontype", "2") // regular season
  const qs = params.toString() ? `?${params.toString()}` : ""
  const raw = await espnFetch<ESPNScoreboard>(`/scoreboard${qs}`)
  return (raw.events ?? []).map((ev) => {
    const away = ev.competitions[0]?.competitors?.find((c: ESPNCompetitor) => c.homeAway === "away")
    const home = ev.competitions[0]?.competitors?.find((c: ESPNCompetitor) => c.homeAway === "home")
    const odds = ev.competitions[0]?.odds?.[0]
    return {
      id: ev.id,
      date: ev.date,
      name: ev.name,
      shortName: ev.shortName,
      week: ev.week?.text ?? raw.week?.text ?? "",
      awayTeam: {
        id: away?.team?.id ?? "",
        abbreviation: away?.team?.abbreviation ?? "???",
        displayName: away?.team?.displayName ?? "Unknown",
        logo: away?.team?.logo ?? "",
        score: away?.score,
      },
      homeTeam: {
        id: home?.team?.id ?? "",
        abbreviation: home?.team?.abbreviation ?? "???",
        displayName: home?.team?.displayName ?? "Unknown",
        logo: home?.team?.logo ?? "",
        score: home?.score,
      },
      status: ev.status?.type?.description ?? "Scheduled",
      venue: ev.competitions[0]?.venue?.fullName ?? "",
      broadcast: ev.competitions[0]?.broadcasts?.[0]?.names?.[0] ?? "",
      odds: odds ? { details: odds.details ?? "", overUnder: odds.overUnder ?? 0 } : undefined,
    }
  })
}

/* ------------------------------------------------------------------ */
/*  Teams                                                              */
/* ------------------------------------------------------------------ */

export async function getNFLTeams(): Promise<NFLTeamRecord[]> {
  const raw = await espnFetch<{ sports: { leagues: { teams: { team: ESPNTeam }[] }[] }[] }>(
    "/teams"
  )
  const teams = raw.sports?.[0]?.leagues?.[0]?.teams ?? []
  return teams.map((t) => ({
    id: t.team.id,
    abbreviation: t.team.abbreviation,
    displayName: t.team.displayName,
    wins: Number(t.team.record?.items?.[0]?.stats?.find((s: { name: string }) => s.name === "wins")?.value ?? 0),
    losses: Number(t.team.record?.items?.[0]?.stats?.find((s: { name: string }) => s.name === "losses")?.value ?? 0),
    logo: t.team.logos?.[0]?.href ?? "",
  }))
}

/* ------------------------------------------------------------------ */
/*  Leaders (for trends)                                               */
/* ------------------------------------------------------------------ */

export interface NFLLeaderEntry {
  athlete: { id: string; displayName: string; position: { abbreviation: string }; team: { abbreviation: string } }
  value: number
  displayValue: string
}

export interface NFLLeaderCategory {
  name: string
  displayName: string
  leaders: NFLLeaderEntry[]
}

export async function getNFLLeaders(): Promise<NFLLeaderCategory[]> {
  const res = await fetch(`${LEADERS_BASE}/leaders`, { next: { revalidate: 43200 } })
  if (!res.ok) throw new Error(`ESPN NFL v3 ${res.status}: /leaders`)
  const raw = await res.json()

  // v3 structure: { leaders: { categories: [...] } }
  const categories = (raw.leaders?.categories ?? []) as Array<{ name: string; displayName?: string; leaders: Array<Record<string, unknown>> }>

  return categories.map((cat) => ({
    name: cat.name,
    displayName: cat.displayName ?? cat.name,
    leaders: (cat.leaders ?? []).map((l) => {
      const athlete = (l.athlete ?? {}) as Record<string, unknown>
      const team = (l.team ?? athlete.team ?? {}) as Record<string, unknown>
      const position = (athlete.position ?? {}) as Record<string, unknown>
      return {
        athlete: {
          id: String(athlete.id ?? ""),
          displayName: (athlete.displayName as string) ?? "",
          position: { abbreviation: (position.abbreviation as string) ?? "" },
          team: { abbreviation: (team.abbreviation as string) ?? "" },
        },
        value: (l.value as number) ?? 0,
        displayValue: (l.displayValue as string) ?? "0",
      }
    }),
  }))
}

/* ------------------------------------------------------------------ */
/*  Team Roster                                                        */
/* ------------------------------------------------------------------ */

export interface NFLRosterPlayer {
  id: string
  fullName: string
  position: string
  jersey: string
}

export async function getNFLTeamRoster(teamId: string): Promise<NFLRosterPlayer[]> {
  const raw = await espnFetch<{
    athletes: { position: string; items: { id: string; fullName: string; displayName: string; position: { abbreviation: string }; jersey?: string }[] }[]
  }>(`/teams/${teamId}/roster`)
  const players: NFLRosterPlayer[] = []
  for (const group of raw.athletes ?? []) {
    for (const p of group.items ?? []) {
      players.push({
        id: p.id,
        fullName: p.fullName ?? p.displayName,
        position: p.position?.abbreviation ?? "",
        jersey: p.jersey ?? "",
      })
    }
  }
  return players
}

/* ------------------------------------------------------------------ */
/*  Individual Player Season Stats (via overview endpoint)             */
/* ------------------------------------------------------------------ */

export interface NFLPlayerSeasonStats {
  id: string
  name: string
  position: string
  team: string
  gamesPlayed: number
  passing?: { completions: number; attempts: number; yards: number; touchdowns: number; interceptions: number; rating: number }
  rushing?: { attempts: number; yards: number; touchdowns: number; yardsPerAttempt: number; long: number }
  receiving?: { receptions: number; yards: number; touchdowns: number; targets: number; yardsPerReception: number; long: number }
}

export async function getNFLPlayerOverview(playerId: string): Promise<NFLPlayerSeasonStats | null> {
  try {
    const raw = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/overview`,
      { next: { revalidate: 43200 } }
    )
    if (!raw.ok) return null
    const data = await raw.json()

    const stats = data.statistics
    if (!stats?.splits?.[0]?.stats) return null

    const names: string[] = stats.names ?? []
    const vals: string[] = stats.splits[0].stats ?? []

    const get = (n: string) => {
      const idx = names.indexOf(n)
      return idx >= 0 ? Number.parseFloat(vals[idx]) || 0 : 0
    }

    const athlete = data.athlete ?? {}
    const position = athlete.position?.abbreviation ?? ""
    const team = athlete.team?.abbreviation ?? ""

    const result: NFLPlayerSeasonStats = {
      id: playerId,
      name: athlete.displayName ?? "",
      position,
      team,
      gamesPlayed: get("gamesPlayed") || 1,
    }

    if (names.includes("passingYards")) {
      result.passing = {
        completions: get("completions"),
        attempts: get("passingAttempts"),
        yards: get("passingYards"),
        touchdowns: get("passingTouchdowns"),
        interceptions: get("interceptions"),
        rating: get("QBRating"),
      }
    }
    if (names.includes("rushingYards")) {
      result.rushing = {
        attempts: get("rushingAttempts"),
        yards: get("rushingYards"),
        touchdowns: get("rushingTouchdowns"),
        yardsPerAttempt: get("yardsPerRushAttempt"),
        long: get("longRushing"),
      }
    }
    if (names.includes("receivingYards")) {
      result.receiving = {
        receptions: get("receptions"),
        yards: get("receivingYards"),
        touchdowns: get("receivingTouchdowns"),
        targets: get("receivingTargets"),
        yardsPerReception: get("yardsPerReception"),
        long: get("longReception"),
      }
    }

    return result
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Team Statistics (scraped from ESPN team stats pages)                */
/* ------------------------------------------------------------------ */

export interface NFLTeamStats {
  pointsScored: number
  pointsScoredRank: number
  pointsAllowed: number
  pointsAllowedRank: number
  passYards: number
  passYardsRank: number
  passYardsAllowed: number
  passYardsAllowedRank: number
  rushingYards: number
  rushingYardsRank: number
  rushingYardsAllowed: number
  rushingYardsAllowedRank: number
}

interface ESPNTeamStatEntry {
  team: { id: string; abbrev: string; displayName: string }
  stats: { name: string; value: string; rank: string }[]
}

/** Scrape ESPN team stats page and extract __espnfitt__ embedded JSON */
async function scrapeESPNTeamStats(view: "offense" | "defense"): Promise<ESPNTeamStatEntry[]> {
  const year = new Date().getFullYear()
  const viewParam = view === "defense" ? "/view/defense" : ""
  const url = `https://www.espn.com/nfl/stats/team/_${viewParam}/season/${year}/seasontype/2`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; HeatCheckHQ/1.0)" },
    next: { revalidate: 43200 },
  })
  if (!res.ok) return []
  const html = await res.text()
  const match = html.match(/window\['__espnfitt__'\]\s*=\s*(\{.+?\});/s)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    return (data.page?.content?.teamStats ?? []) as ESPNTeamStatEntry[]
  } catch {
    return []
  }
}

function parseStat(entry: ESPNTeamStatEntry, name: string): { value: number; rank: number } {
  const s = entry.stats.find((st) => st.name === name)
  if (!s) return { value: 0, rank: 0 }
  return {
    value: Math.round(parseFloat(s.value.replace(/,/g, "")) * 10) / 10 || 0,
    rank: parseInt(s.rank) || 0,
  }
}

/** Cached league-wide team stats (offense + defense, all 32 teams) */
let _statsCache: { data: Map<string, NFLTeamStats>; ts: number } | null = null
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

async function getAllNFLTeamStats(): Promise<Map<string, NFLTeamStats>> {
  if (_statsCache && Date.now() - _statsCache.ts < CACHE_TTL) return _statsCache.data

  const [offenseEntries, defenseEntries] = await Promise.all([
    scrapeESPNTeamStats("offense"),
    scrapeESPNTeamStats("defense"),
  ])

  // Build defense lookup by team ID
  const defMap = new Map<string, ESPNTeamStatEntry>()
  for (const e of defenseEntries) defMap.set(e.team.id, e)

  const result = new Map<string, NFLTeamStats>()
  for (const off of offenseEntries) {
    const def = defMap.get(off.team.id)
    const offPPG = parseStat(off, "totalPointsPerGame")
    const offPassYPG = parseStat(off, "netPassingYardsPerGame")
    const offRushYPG = parseStat(off, "rushingYardsPerGame")
    const defPPG = def ? parseStat(def, "totalPointsPerGame") : { value: 0, rank: 0 }
    const defPassYPG = def ? parseStat(def, "netPassingYardsPerGame") : { value: 0, rank: 0 }
    const defRushYPG = def ? parseStat(def, "rushingYardsPerGame") : { value: 0, rank: 0 }

    result.set(off.team.id, {
      pointsScored: offPPG.value,
      pointsScoredRank: offPPG.rank,
      pointsAllowed: defPPG.value,
      pointsAllowedRank: defPPG.rank,
      passYards: offPassYPG.value,
      passYardsRank: offPassYPG.rank,
      passYardsAllowed: defPassYPG.value,
      passYardsAllowedRank: defPassYPG.rank,
      rushingYards: offRushYPG.value,
      rushingYardsRank: offRushYPG.rank,
      rushingYardsAllowed: defRushYPG.value,
      rushingYardsAllowedRank: defRushYPG.rank,
    })
  }

  _statsCache = { data: result, ts: Date.now() }
  console.log(`[NFL Stats] Scraped ${result.size} teams (offense + defense)`)
  return result
}

export async function getNFLTeamStats(teamId: string): Promise<NFLTeamStats | null> {
  try {
    const allStats = await getAllNFLTeamStats()
    return allStats.get(teamId) ?? null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Build Full Matchup from Live Data                                  */
/* ------------------------------------------------------------------ */

export interface LiveMatchupTeam {
  id: string
  name: string
  abbreviation: string
  record: string
  passers: NFLPlayerSeasonStats[]
  rushers: NFLPlayerSeasonStats[]
  receivers: NFLPlayerSeasonStats[]
  teamStats?: NFLTeamStats | null
}

export interface LiveMatchup {
  gameId: string
  week: string
  venue: string
  awayTeam: LiveMatchupTeam
  homeTeam: LiveMatchupTeam
}

async function buildTeamMatchup(teamId: string): Promise<LiveMatchupTeam | null> {
  try {
    // Fetch roster and team stats in parallel
    const [roster, teamStats] = await Promise.all([
      getNFLTeamRoster(teamId),
      getNFLTeamStats(teamId).catch(() => null),
    ])
    if (!roster.length) return null

    // Pick key starters by position (ESPN lists them roughly by depth chart)
    const qbs = roster.filter((p) => p.position === "QB").slice(0, 1)
    const rbs = roster.filter((p) => p.position === "RB").slice(0, 2)
    const wrs = roster.filter((p) => p.position === "WR").slice(0, 3)
    const tes = roster.filter((p) => p.position === "TE").slice(0, 1)

    // Fetch stats for key players in parallel
    const keyPlayers = [...qbs, ...rbs, ...wrs, ...tes]
    const statsResults = await Promise.all(
      keyPlayers.map((p) => getNFLPlayerOverview(p.id))
    )
    const stats = statsResults.filter(Boolean) as NFLPlayerSeasonStats[]

    return {
      id: teamId,
      name: "",
      abbreviation: "",
      record: "",
      passers: stats.filter((s) => s.passing && s.passing.yards > 0),
      rushers: stats.filter((s) => s.rushing && s.rushing.yards > 0),
      receivers: stats.filter((s) => s.receiving && s.receiving.yards > 0),
      teamStats,
    }
  } catch {
    return null
  }
}

export async function buildLiveMatchup(game: NFLScheduleGame): Promise<LiveMatchup | null> {
  try {
    const [away, home] = await Promise.all([
      buildTeamMatchup(game.awayTeam.id),
      buildTeamMatchup(game.homeTeam.id),
    ])
    if (!away || !home) return null

    away.name = game.awayTeam.displayName
    away.abbreviation = game.awayTeam.abbreviation
    home.name = game.homeTeam.displayName
    home.abbreviation = game.homeTeam.abbreviation

    return {
      gameId: game.id,
      week: game.week,
      venue: game.venue,
      awayTeam: away,
      homeTeam: home,
    }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  ESPN response shapes (internal)                                    */
/* ------------------------------------------------------------------ */

interface ESPNCompetitor {
  homeAway: string
  team: { id: string; abbreviation: string; displayName: string; logo: string }
  score?: string
}

interface ESPNScoreboard {
  events: {
    id: string
    date: string
    name: string
    shortName: string
    week?: { text: string }
    status: { type: { description: string } }
    competitions: {
      competitors: ESPNCompetitor[]
      venue?: { fullName: string }
      broadcasts?: { names: string[] }[]
      odds?: { details?: string; overUnder?: number }[]
    }[]
  }[]
  week?: { text: string }
}

interface ESPNTeam {
  id: string
  abbreviation: string
  displayName: string
  logos?: { href: string }[]
  record?: { items: { stats: { name: string; value: number }[] }[] }
}
