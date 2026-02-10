/**
 * MLB Stats API client – single consolidated module.
 * Base URL: https://statsapi.mlb.com
 * No API key required.
 *
 * We cache at the route-handler level using Next.js
 * `export const revalidate = 3600` (once per hour).
 */

const BASE = "https://statsapi.mlb.com/api/v1"

async function mlbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`MLB API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/* ------------------------------------------------------------------ */
/*  Schedule / Weather                                                 */
/* ------------------------------------------------------------------ */

interface MLBScheduleResponse {
  dates: {
    date: string
    games: {
      gamePk: number
      gameDate: string
      status: { detailedState: string }
      teams: {
        away: { team: { id: number; name: string; abbreviation: string }; probablePitcher?: { id: number; fullName: string } }
        home: { team: { id: number; name: string; abbreviation: string }; probablePitcher?: { id: number; fullName: string } }
      }
      venue: { name: string }
      weather?: { condition: string; temp: string; wind: string }
    }[]
  }[]
}

export interface ScheduleGame {
  gamePk: number
  gameDate: string
  status: string
  away: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  home: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string } | null }
  venue: string
  weather: { condition: string; temp: string; wind: string } | null
}

export async function getSchedule(date?: string): Promise<{ games: ScheduleGame[]; date: string }> {
  const d = date ?? new Date().toISOString().slice(0, 10)
  const raw = await mlbFetch<MLBScheduleResponse>(
    `/schedule?sportId=1&date=${d}&hydrate=weather,venue,probablePitcher,team`
  )
  const dayGames = raw.dates?.[0]?.games ?? []
  const games: ScheduleGame[] = dayGames.map((g) => ({
    gamePk: g.gamePk,
    gameDate: g.gameDate,
    status: g.status.detailedState,
    away: {
      id: g.teams.away.team.id,
      name: g.teams.away.team.name,
      abbreviation: g.teams.away.team.abbreviation ?? g.teams.away.team.name.slice(0, 3).toUpperCase(),
      probablePitcher: g.teams.away.probablePitcher
        ? { id: g.teams.away.probablePitcher.id, fullName: g.teams.away.probablePitcher.fullName }
        : null,
    },
    home: {
      id: g.teams.home.team.id,
      name: g.teams.home.team.name,
      abbreviation: g.teams.home.team.abbreviation ?? g.teams.home.team.name.slice(0, 3).toUpperCase(),
      probablePitcher: g.teams.home.probablePitcher
        ? { id: g.teams.home.probablePitcher.id, fullName: g.teams.home.probablePitcher.fullName }
        : null,
    },
    venue: g.venue.name,
    weather: g.weather ?? null,
  }))
  return { games, date: d }
}

/* ------------------------------------------------------------------ */
/*  Batting Leaders                                                    */
/* ------------------------------------------------------------------ */

interface MLBStatsResponse {
  stats: {
    splits: {
      player: { id: number; fullName: string }
      team: { abbreviation: string; name: string }
      stat: Record<string, string | number>
      position: { abbreviation: string }
    }[]
  }[]
}

export interface BattingLeader {
  id: number
  name: string
  team: string
  pos: string
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

export async function getBattingLeaders(): Promise<BattingLeader[]> {
  const raw = await mlbFetch<MLBStatsResponse>(
    `/stats?stats=season&group=hitting&season=2025&sportId=1&limit=60&order=desc&sortStat=onBasePlusSlugging&fields=stats,splits,player,id,fullName,team,abbreviation,name,stat,gamesPlayed,atBats,runs,hits,doubles,triples,homeRuns,rbi,stolenBases,avg,obp,slg,ops,position,abbreviation`
  )
  const splits = raw.stats?.[0]?.splits ?? []
  return splits.map((s) => ({
    id: s.player.id,
    name: s.player.fullName,
    team: s.team?.abbreviation ?? "???",
    pos: s.position?.abbreviation ?? "??",
    gamesPlayed: Number(s.stat.gamesPlayed) || 0,
    atBats: Number(s.stat.atBats) || 0,
    runs: Number(s.stat.runs) || 0,
    hits: Number(s.stat.hits) || 0,
    doubles: Number(s.stat.doubles) || 0,
    triples: Number(s.stat.triples) || 0,
    homeRuns: Number(s.stat.homeRuns) || 0,
    rbi: Number(s.stat.rbi) || 0,
    stolenBases: Number(s.stat.stolenBases) || 0,
    avg: Number(s.stat.avg) || 0,
    obp: Number(s.stat.obp) || 0,
    slg: Number(s.stat.slg) || 0,
    ops: Number(s.stat.ops) || 0,
  }))
}

/* ------------------------------------------------------------------ */
/*  Pitching Leaders                                                   */
/* ------------------------------------------------------------------ */

export interface PitchingLeader {
  id: number
  name: string
  team: string
  hand: string
  wins: number
  losses: number
  era: number
  gamesPlayed: number
  gamesStarted: number
  inningsPitched: number
  strikeOuts: number
  walks: number
  whip: number
  avg: number
  homeRuns: number
  saves: number
}

export async function getPitchingLeaders(): Promise<PitchingLeader[]> {
  const raw = await mlbFetch<MLBStatsResponse>(
    `/stats?stats=season&group=pitching&season=2025&sportId=1&limit=60&order=asc&sortStat=earnedRunAverage&fields=stats,splits,player,id,fullName,team,abbreviation,name,stat,wins,losses,era,gamesPlayed,gamesStarted,inningsPitched,strikeOuts,baseOnBalls,whip,avg,homeRuns,saves,position,abbreviation`
  )
  const splits = raw.stats?.[0]?.splits ?? []
  return splits.map((s) => ({
    id: s.player.id,
    name: s.player.fullName,
    team: s.team?.abbreviation ?? "???",
    hand: s.position?.abbreviation === "LHP" ? "L" : "R",
    wins: Number(s.stat.wins) || 0,
    losses: Number(s.stat.losses) || 0,
    era: Number(s.stat.era) || 0,
    gamesPlayed: Number(s.stat.gamesPlayed) || 0,
    gamesStarted: Number(s.stat.gamesStarted) || 0,
    inningsPitched: Number(s.stat.inningsPitched) || 0,
    strikeOuts: Number(s.stat.strikeOuts) || 0,
    walks: Number(s.stat.baseOnBalls) || 0,
    whip: Number(s.stat.whip) || 0,
    avg: Number(s.stat.avg) || 0,
    homeRuns: Number(s.stat.homeRuns) || 0,
    saves: Number(s.stat.saves) || 0,
  }))
}
