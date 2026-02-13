/**
 * NBA data via ESPN public API.
 * No API key required.
 * Base: https://site.api.espn.com/apis/site/v2/sports/basketball/nba
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
const LEADERS_BASE = "https://site.api.espn.com/apis/site/v3/sports/basketball/nba"

async function espnFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 43200 } })
  if (!res.ok) throw new Error(`ESPN NBA ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Short-lived cache for daily/live data (scoreboard, team summaries) */
async function espnFetchLive<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`ESPN NBA ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function espnFetchV3<T>(path: string): Promise<T> {
  const res = await fetch(`${LEADERS_BASE}${path}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`ESPN NBA v3 ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NBAScheduleGame {
  id: string
  date: string
  name: string
  shortName: string
  awayTeam: { id: string; abbreviation: string; displayName: string; logo: string; score?: string }
  homeTeam: { id: string; abbreviation: string; displayName: string; logo: string; score?: string }
  status: string
  venue: string
  broadcast: string
  odds?: { details: string; overUnder: number }
}

export interface NBATeamRecord {
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

export async function getNBAScoreboard(date?: string): Promise<NBAScheduleGame[]> {
  const params = date ? `?dates=${date.replace(/-/g, "")}` : ""
  const raw = await espnFetchLive<ESPNScoreboard>(`/scoreboard${params}`)
  return (raw.events ?? []).map((ev) => {
    const away = ev.competitions[0]?.competitors?.find((c: ESPNCompetitor) => c.homeAway === "away")
    const home = ev.competitions[0]?.competitors?.find((c: ESPNCompetitor) => c.homeAway === "home")
    const odds = ev.competitions[0]?.odds?.[0]
    return {
      id: ev.id,
      date: ev.date,
      name: ev.name,
      shortName: ev.shortName,
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
/*  Team Standings                                                     */
/* ------------------------------------------------------------------ */

export async function getNBATeams(): Promise<NBATeamRecord[]> {
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
/*  Team Summary (record + injuries)                                   */
/* ------------------------------------------------------------------ */

export interface NBATeamSummary {
  record: string
  homeRecord: string
  awayRecord: string
  streak: number // positive = W streak, negative = L streak
  ppg: number
  oppPpg: number
  pointDiff: number
  injuries: { name: string; status: string; detail: string }[]
}

export async function getNBATeamSummary(teamId: string): Promise<NBATeamSummary | null> {
  try {
    const raw = await espnFetchLive<{
      team: {
        record?: { items?: { summary?: string; type?: string; stats?: { name: string; value: number }[] }[] }
        injuries?: { items?: { athlete: { displayName: string }; status: string; details?: { detail?: string } }[] }[]
      }
    }>(`/teams/${teamId}`)

    const items = raw.team?.record?.items ?? []
    const overall = items[0]
    const homeItem = items.find((i) => i.type === "home") ?? items[1]
    const awayItem = items.find((i) => i.type === "road") ?? items[2]

    const record = overall?.summary ?? "0-0"
    const homeRecord = homeItem?.summary ?? "0-0"
    const awayRecord = awayItem?.summary ?? "0-0"

    const getStat = (item: typeof overall, name: string) =>
      item?.stats?.find((s: { name: string }) => s.name === name)?.value ?? 0

    const ppg = getStat(overall, "avgPointsFor") || getStat(overall, "pointsFor")
    const oppPpg = getStat(overall, "avgPointsAgainst") || getStat(overall, "pointsAgainst")
    const streak = getStat(overall, "streak")
    const pointDiff = getStat(overall, "pointDifferential")

    const injuries: NBATeamSummary["injuries"] = []
    for (const group of raw.team?.injuries ?? []) {
      for (const item of group.items ?? []) {
        injuries.push({
          name: item.athlete?.displayName ?? "",
          status: item.status ?? "Unknown",
          detail: item.details?.detail ?? "",
        })
      }
    }

    return { record, homeRecord, awayRecord, streak, ppg, oppPpg, pointDiff, injuries }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  League-wide Injuries                                               */
/* ------------------------------------------------------------------ */

export interface NBAInjury {
  name: string
  status: string
  detail: string
}

/**
 * Fetch all NBA injuries from the league-wide endpoint.
 * Returns a map of ESPN team ID → injury list.
 */
export async function getNBAInjuries(): Promise<Record<string, NBAInjury[]>> {
  try {
    const raw = await espnFetchLive<{
      injuries: {
        id: string
        displayName: string
        injuries: {
          status: string
          athlete: { displayName: string }
          details?: { type?: string; detail?: string; side?: string }
        }[]
      }[]
    }>("/injuries")

    const map: Record<string, NBAInjury[]> = {}
    for (const team of raw.injuries ?? []) {
      map[team.id] = (team.injuries ?? []).map((inj) => {
        const parts = [inj.details?.type, inj.details?.detail].filter(Boolean)
        const side = inj.details?.side ? `${inj.details.side} ` : ""
        return {
          name: inj.athlete?.displayName ?? "",
          status: inj.status ?? "Unknown",
          detail: parts.length > 0 ? `${side}${parts.join(" - ")}` : inj.status ?? "",
        }
      })
    }
    return map
  } catch (e) {
    console.error("[NBA Injuries]", e)
    return {}
  }
}

/* ------------------------------------------------------------------ */
/*  Team Schedule (for H2H history & last N games)                     */
/* ------------------------------------------------------------------ */

export interface NBAGameResult {
  id: string
  date: string
  opponentId: string
  opponentAbbr: string
  home: boolean
  teamScore: number
  opponentScore: number
  won: boolean
}

export async function getNBATeamSchedule(teamId: string): Promise<NBAGameResult[]> {
  try {
    const year = new Date().getFullYear()
    const raw = await espnFetch<{
      events: {
        id: string
        date: string
        competitions: {
          competitors: { homeAway: string; team: { id: string; abbreviation: string }; score?: { displayValue?: string } }[]
          status?: { type?: { completed?: boolean } }
        }[]
      }[]
    }>(`/teams/${teamId}/schedule?season=${year}`)

    const results: NBAGameResult[] = []
    for (const ev of raw.events ?? []) {
      const comp = ev.competitions?.[0]
      if (!comp?.status?.type?.completed) continue
      const us = comp.competitors?.find((c) => c.team?.id === teamId)
      const them = comp.competitors?.find((c) => c.team?.id !== teamId)
      if (!us || !them) continue
      const teamScore = Number(us.score?.displayValue) || 0
      const opponentScore = Number(them.score?.displayValue) || 0
      if (teamScore === 0 && opponentScore === 0) continue
      results.push({
        id: ev.id,
        date: ev.date,
        opponentId: them.team?.id ?? "",
        opponentAbbr: them.team?.abbreviation ?? "???",
        home: us.homeAway === "home",
        teamScore,
        opponentScore,
        won: teamScore > opponentScore,
      })
    }
    return results
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Leaders (for trends)                                               */
/* ------------------------------------------------------------------ */

export interface NBALeaderEntry {
  athlete: { id: string; displayName: string; position: { abbreviation: string }; team: { abbreviation: string } }
  value: number
  displayValue: string
}

export interface NBALeaderCategory {
  name: string
  displayName: string
  leaders: NBALeaderEntry[]
}

export async function getNBALeaders(): Promise<NBALeaderCategory[]> {
  const raw = await espnFetchV3<{ leaders: { categories: Array<{ name: string; displayName?: string; leaders: Array<Record<string, unknown>> }> } }>("/leaders")
  const categories = raw.leaders?.categories ?? []

  // Normalize v3 response to match expected shape
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
    status: { type: { description: string } }
    competitions: {
      competitors: ESPNCompetitor[]
      venue?: { fullName: string }
      broadcasts?: { names: string[] }[]
      odds?: { details?: string; overUnder?: number }[]
    }[]
  }[]
}

interface ESPNTeam {
  id: string
  abbreviation: string
  displayName: string
  logos?: { href: string }[]
  record?: { items: { stats: { name: string; value: number }[] }[] }
}
