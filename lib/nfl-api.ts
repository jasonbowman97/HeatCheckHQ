/**
 * NFL data via ESPN public API.
 * No API key required.
 * Base: https://site.api.espn.com/apis/site/v2/sports/football/nfl
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"

async function espnFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 } })
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
  const raw = await espnFetch<{ leaders: NFLLeaderCategory[] }>("/leaders")
  return raw.leaders ?? []
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
      { next: { revalidate: 3600 } }
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
    const roster = await getNFLTeamRoster(teamId)
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
