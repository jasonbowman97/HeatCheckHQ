/**
 * MLB Stats API client with Next.js caching.
 * All fetches are cached for 4 hours (revalidates automatically).
 * No API key required -- this is the official public MLB API.
 *
 * Primary: statsapi.mlb.com  (schedule, rosters, player stats)
 * Secondary: baseballsavant.mlb.com (Statcast CSV exports)
 */

const MLB_BASE = "https://statsapi.mlb.com/api/v1"

/* ---------- generic fetcher ---------- */

async function mlbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${MLB_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), { next: { revalidate: 14400 } }) // 4 hours
  if (!res.ok) throw new Error(`MLB API ${res.status}: ${url.pathname}`)
  return res.json() as Promise<T>
}

/* ---------- Schedule / Scoreboard (today's games, venues, weather, probable pitchers) ---------- */

export interface MLBScheduleGame {
  gamePk: number
  gameDate: string
  status: { detailedState: string }
  teams: {
    away: { team: { id: number; name: string; abbreviation?: string }; probablePitcher?: { id: number; fullName: string } }
    home: { team: { id: number; name: string; abbreviation?: string }; probablePitcher?: { id: number; fullName: string } }
  }
  venue: { id: number; name: string }
  weather?: { condition: string; temp: string; wind: string }
}

interface ScheduleResponse {
  dates: Array<{
    date: string
    games: MLBScheduleGame[]
  }>
}

export async function getTodaySchedule(): Promise<MLBScheduleGame[]> {
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
  const data = await mlbFetch<ScheduleResponse>("/schedule", {
    sportId: "1",
    date: today,
    hydrate: "team,probablePitcher,venue,weather,linescore",
  })
  return data.dates?.[0]?.games ?? []
}

/* ---------- Team lookup ---------- */

interface TeamsResponse {
  teams: Array<{
    id: number
    name: string
    abbreviation: string
    teamName: string
  }>
}

let teamCachePromise: Promise<Map<number, { name: string; abbreviation: string }>> | null = null

export function getTeamMap(): Promise<Map<number, { name: string; abbreviation: string }>> {
  if (!teamCachePromise) {
    teamCachePromise = mlbFetch<TeamsResponse>("/teams", { sportId: "1" }).then((data) => {
      const map = new Map<number, { name: string; abbreviation: string }>()
      for (const t of data.teams) map.set(t.id, { name: t.name, abbreviation: t.abbreviation })
      return map
    })
  }
  return teamCachePromise
}

/* ---------- Player Season Stats ---------- */

interface PlayerStatsResponse {
  stats: Array<{
    group: { displayName: string }
    splits: Array<{
      stat: Record<string, unknown>
    }>
  }>
}

export async function getPlayerSeasonStats(
  playerId: number,
  group: "hitting" | "pitching",
  season = new Date().getFullYear(),
): Promise<Record<string, unknown> | null> {
  try {
    const data = await mlbFetch<PlayerStatsResponse>(
      `/people/${playerId}/stats`,
      { stats: "season", season: String(season), group },
    )
    return data.stats?.[0]?.splits?.[0]?.stat ?? null
  } catch {
    return null
  }
}

/* ---------- Batting Leaders (top 50) ---------- */

interface LeadersResponse {
  leagueLeaders: Array<{
    statGroup: string
    leaders: Array<{
      rank: number
      value: string
      person: { id: number; fullName: string }
      team: { id: number; name: string }
      sport: { id: number }
      league: { id: number }
      season: string
      stat: Record<string, unknown>
    }>
  }>
}

export interface BattingLeader {
  id: number
  name: string
  teamId: number
  team: string
  gamesPlayed: number
  atBats: number
  runs: number
  hits: number
  doubles: number
  triples: number
  homeRuns: number
  rbi: number
  stolenBases: number
  avg: number
  obp: number
  slg: number
  ops: number
}

export async function getBattingLeaders(season?: number): Promise<BattingLeader[]> {
  const yr = season ?? new Date().getFullYear()
  // Fetch top 50 by AVG -- the stat object contains all fields
  const data = await mlbFetch<LeadersResponse>("/stats/leaders", {
    leaderCategories: "battingAverage",
    season: String(yr),
    sportId: "1",
    limit: "50",
    hydrate: "person,team",
    statGroup: "hitting",
  })
  const leaders = data.leagueLeaders?.[0]?.leaders ?? []
  return leaders.map((l) => {
    const s = l.stat as Record<string, number>
    return {
      id: l.person.id,
      name: l.person.fullName,
      teamId: l.team.id,
      team: l.team.name,
      gamesPlayed: s.gamesPlayed ?? 0,
      atBats: s.atBats ?? 0,
      runs: s.runs ?? 0,
      hits: s.hits ?? 0,
      doubles: s.doubles ?? 0,
      triples: s.triples ?? 0,
      homeRuns: s.homeRuns ?? 0,
      rbi: s.rbi ?? 0,
      stolenBases: s.stolenBases ?? 0,
      avg: s.avg ?? 0,
      obp: s.obp ?? 0,
      slg: s.slg ?? 0,
      ops: s.ops ?? 0,
    }
  })
}

/* ---------- Pitching Leaders (top 50) ---------- */

export interface PitchingLeader {
  id: number
  name: string
  teamId: number
  team: string
  gamesPlayed: number
  gamesStarted: number
  wins: number
  losses: number
  era: number
  inningsPitched: number
  strikeOuts: number
  walks: number
  whip: number
  kPer9: number
  bbPer9: number
  homeRunsAllowed: number
  avg: number
  saves: number
}

export async function getPitchingLeaders(season?: number): Promise<PitchingLeader[]> {
  const yr = season ?? new Date().getFullYear()
  const data = await mlbFetch<LeadersResponse>("/stats/leaders", {
    leaderCategories: "earnedRunAverage",
    season: String(yr),
    sportId: "1",
    limit: "50",
    hydrate: "person,team",
    statGroup: "pitching",
  })
  const leaders = data.leagueLeaders?.[0]?.leaders ?? []
  return leaders.map((l) => {
    const s = l.stat as Record<string, number>
    return {
      id: l.person.id,
      name: l.person.fullName,
      teamId: l.team.id,
      team: l.team.name,
      gamesPlayed: s.gamesPlayed ?? 0,
      gamesStarted: s.gamesStarted ?? 0,
      wins: s.wins ?? 0,
      losses: s.losses ?? 0,
      era: s.era ?? 0,
      inningsPitched: s.inningsPitched ?? 0,
      strikeOuts: s.strikeOuts ?? 0,
      walks: s.baseOnBalls ?? 0,
      whip: s.whip ?? 0,
      kPer9: s.strikeoutsPer9Inn ?? 0,
      bbPer9: s.walksPer9Inn ?? 0,
      homeRunsAllowed: s.homeRuns ?? 0,
      avg: s.avg ?? 0,
      saves: s.saves ?? 0,
    }
  })
}
