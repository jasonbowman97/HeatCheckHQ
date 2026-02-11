/**
 * NBA data via ESPN public API.
 * No API key required.
 * Base: https://site.api.espn.com/apis/site/v2/sports/basketball/nba
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"

async function espnFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 43200 } })
  if (!res.ok) throw new Error(`ESPN NBA ${res.status}: ${path}`)
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
  const raw = await espnFetch<ESPNScoreboard>(`/scoreboard${params}`)
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
  ppg: number
  oppPpg: number
  injuries: { name: string; status: string; detail: string }[]
}

export async function getNBATeamSummary(teamId: string): Promise<NBATeamSummary | null> {
  try {
    const raw = await espnFetch<{
      team: {
        record?: { items?: { summary?: string; stats?: { name: string; value: number }[] }[] }
        injuries?: { items?: { athlete: { displayName: string }; status: string; details?: { detail?: string } }[] }[]
      }
    }>(`/teams/${teamId}`)

    const recordItem = raw.team?.record?.items?.[0]
    const record = recordItem?.summary ?? "0-0"
    const ppg = recordItem?.stats?.find((s: { name: string }) => s.name === "pointsFor")?.value ?? 0
    const oppPpg = recordItem?.stats?.find((s: { name: string }) => s.name === "pointsAgainst")?.value ?? 0

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

    return { record, ppg, oppPpg, injuries }
  } catch {
    return null
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
  const raw = await espnFetch<{ leaders: NBALeaderCategory[] }>("/leaders")
  return raw.leaders ?? []
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
