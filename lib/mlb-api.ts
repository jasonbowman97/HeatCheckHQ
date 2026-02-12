/**
 * MLB Stats API client – single consolidated module.
 * Base URL: https://statsapi.mlb.com
 * No API key required.
 *
 * We cache at the route-handler level using Next.js
 * `export const revalidate = 43200` (twice per day).
 */

const BASE = "https://statsapi.mlb.com/api/v1"

async function mlbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 43200 } })
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
        away: { team: { id: number; name: string; abbreviation: string }; probablePitcher?: { id: number; fullName: string; pitchHand?: { code: string } } }
        home: { team: { id: number; name: string; abbreviation: string }; probablePitcher?: { id: number; fullName: string; pitchHand?: { code: string } } }
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
  away: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string; hand?: "L" | "R" } | null }
  home: { id: number; name: string; abbreviation: string; probablePitcher: { id: number; fullName: string; hand?: "L" | "R" } | null }
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
        ? { id: g.teams.away.probablePitcher.id, fullName: g.teams.away.probablePitcher.fullName, hand: (g.teams.away.probablePitcher.pitchHand?.code === "L" ? "L" : "R") as "L" | "R" }
        : null,
    },
    home: {
      id: g.teams.home.team.id,
      name: g.teams.home.team.name,
      abbreviation: g.teams.home.team.abbreviation ?? g.teams.home.team.name.slice(0, 3).toUpperCase(),
      probablePitcher: g.teams.home.probablePitcher
        ? { id: g.teams.home.probablePitcher.id, fullName: g.teams.home.probablePitcher.fullName, hand: (g.teams.home.probablePitcher.pitchHand?.code === "L" ? "L" : "R") as "L" | "R" }
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
  const currentSeason = new Date().getFullYear()
  const raw = await mlbFetch<MLBStatsResponse>(
    `/stats?stats=season&group=hitting&season=${currentSeason}&sportId=1&limit=60&order=desc&sortStat=onBasePlusSlugging&fields=stats,splits,player,id,fullName,team,abbreviation,name,stat,gamesPlayed,atBats,runs,hits,doubles,triples,homeRuns,rbi,stolenBases,avg,obp,slg,ops,position,abbreviation`
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
  const currentSeason = new Date().getFullYear()
  const raw = await mlbFetch<MLBStatsResponse>(
    `/stats?stats=season&group=pitching&season=${currentSeason}&sportId=1&limit=60&order=asc&sortStat=earnedRunAverage&fields=stats,splits,player,id,fullName,team,abbreviation,name,stat,wins,losses,era,gamesPlayed,gamesStarted,inningsPitched,strikeOuts,baseOnBalls,whip,avg,homeRuns,saves,position,abbreviation`
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

/* ------------------------------------------------------------------ */
/*  Pitch Type Code → Name Map                                        */
/* ------------------------------------------------------------------ */

export const PITCH_TYPE_NAMES: Record<string, string> = {
  FF: "Four-Seam Fastball",
  SI: "Sinker",
  FC: "Cutter",
  CH: "Changeup",
  SL: "Slider",
  CU: "Curveball",
  KC: "Knuckle Curve",
  SV: "Sweeper",
  ST: "Sweeper",
  FS: "Splitter",
  KN: "Knuckleball",
  EP: "Eephus",
  SC: "Screwball",
  CS: "Slow Curve",
  FA: "Fastball",
  IN: "Intent Ball",
  PO: "Pitchout",
  AB: "Auto Ball",
}

/* ------------------------------------------------------------------ */
/*  Pitch Arsenal (per pitcher)                                        */
/* ------------------------------------------------------------------ */

export interface PitchArsenalEntry {
  pitchCode: string     // "FF", "SL", "CH", etc.
  pitchName: string     // "Four-Seam Fastball", "Slider", etc.
  usagePct: number      // e.g. 38.2
  avgVelocity: number   // mph
  count: number         // total pitches of this type
}

interface PitchArsenalResponse {
  stats: {
    splits: {
      stat: {
        percentage: number
        count: number
        totalPitches: number
        averageSpeed: number
        type?: { code: string; description: string }
        pitchType?: { code: string; description: string }
      }
    }[]
  }[]
}

export async function getPitchArsenal(pitcherId: number, season?: number): Promise<PitchArsenalEntry[]> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<PitchArsenalResponse>(
      `/people/${pitcherId}/stats?stats=pitchArsenal&season=${yr}&group=pitching`
    )
    const splits = raw.stats?.[0]?.splits ?? []
    return splits
      .map((s) => {
        const typeObj = s.stat.type ?? s.stat.pitchType
        const code = typeObj?.code ?? "UN"
        return {
          pitchCode: code,
          pitchName: typeObj?.description ?? PITCH_TYPE_NAMES[code] ?? code,
          usagePct: Math.round((s.stat.percentage ?? 0) * 1000) / 10, // decimal → percentage
          avgVelocity: Math.round((s.stat.averageSpeed ?? 0) * 10) / 10,
          count: s.stat.count ?? 0,
        }
      })
      .filter((p) => p.usagePct > 0)
      .sort((a, b) => b.usagePct - a.usagePct)
  } catch (err) {
    console.error(`[MLB] Pitch arsenal error for ${pitcherId}:`, err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Batter Platoon Splits (vs LHP / vs RHP)                           */
/* ------------------------------------------------------------------ */

export interface PlatoonSplit {
  split: "vs LHP" | "vs RHP"
  atBats: number
  plateAppearances: number
  hits: number
  avg: number
  obp: number
  slg: number
  ops: number
  homeRuns: number
  doubles: number
  triples: number
  rbi: number
  strikeOuts: number
  baseOnBalls: number
  totalBases: number
}

interface SplitsResponse {
  stats: {
    splits: {
      split: { code: string; description: string }
      stat: Record<string, string | number>
    }[]
  }[]
}

export async function getBatterPlatoonSplits(batterId: number, season?: number): Promise<PlatoonSplit[]> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<SplitsResponse>(
      `/people/${batterId}/stats?stats=statSplits&season=${yr}&group=hitting&sitCodes=vl,vr`
    )
    const splits = raw.stats?.[0]?.splits ?? []
    return splits.map((s) => ({
      split: s.split.code === "vl" ? "vs LHP" as const : "vs RHP" as const,
      atBats: Number(s.stat.atBats) || 0,
      plateAppearances: Number(s.stat.plateAppearances) || 0,
      hits: Number(s.stat.hits) || 0,
      avg: Number(s.stat.avg) || 0,
      obp: Number(s.stat.obp) || 0,
      slg: Number(s.stat.slg) || 0,
      ops: Number(s.stat.ops) || 0,
      homeRuns: Number(s.stat.homeRuns) || 0,
      doubles: Number(s.stat.doubles) || 0,
      triples: Number(s.stat.triples) || 0,
      rbi: Number(s.stat.rbi) || 0,
      strikeOuts: Number(s.stat.strikeOuts) || 0,
      baseOnBalls: Number(s.stat.baseOnBalls) || 0,
      totalBases: Number(s.stat.totalBases) || 0,
    }))
  } catch (err) {
    console.error(`[MLB] Platoon splits error for ${batterId}:`, err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Batter vs Pitcher Head-to-Head                                     */
/* ------------------------------------------------------------------ */

export interface H2HStats {
  season: number | "career"
  atBats: number
  plateAppearances: number
  hits: number
  avg: number
  obp: number
  slg: number
  ops: number
  homeRuns: number
  doubles: number
  triples: number
  rbi: number
  strikeOuts: number
  baseOnBalls: number
}

interface VsPlayerResponse {
  stats: {
    type: { displayName: string }
    splits: {
      season?: string
      stat: Record<string, string | number>
    }[]
  }[]
}

export async function getBatterVsPitcherH2H(
  batterId: number,
  pitcherId: number,
  season?: number
): Promise<{ seasonal: H2HStats[]; career: H2HStats | null }> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<VsPlayerResponse>(
      `/people/${batterId}/stats?stats=vsPlayer,vsPlayerTotal&opposingPlayerId=${pitcherId}&season=${yr}&group=hitting`
    )

    const seasonal: H2HStats[] = []
    let career: H2HStats | null = null

    for (const statGroup of raw.stats ?? []) {
      const isCareer = statGroup.type?.displayName?.toLowerCase().includes("total")
      for (const s of statGroup.splits ?? []) {
        const entry: H2HStats = {
          season: isCareer ? "career" : Number(s.season) || yr,
          atBats: Number(s.stat.atBats) || 0,
          plateAppearances: Number(s.stat.plateAppearances) || 0,
          hits: Number(s.stat.hits) || 0,
          avg: Number(s.stat.avg) || 0,
          obp: Number(s.stat.obp) || 0,
          slg: Number(s.stat.slg) || 0,
          ops: Number(s.stat.ops) || 0,
          homeRuns: Number(s.stat.homeRuns) || 0,
          doubles: Number(s.stat.doubles) || 0,
          triples: Number(s.stat.triples) || 0,
          rbi: Number(s.stat.rbi) || 0,
          strikeOuts: Number(s.stat.strikeOuts) || 0,
          baseOnBalls: Number(s.stat.baseOnBalls) || 0,
        }
        if (isCareer) {
          career = entry
        } else {
          seasonal.push(entry)
        }
      }
    }

    return { seasonal, career }
  } catch (err) {
    console.error(`[MLB] H2H error for ${batterId} vs ${pitcherId}:`, err)
    return { seasonal: [], career: null }
  }
}

/* ------------------------------------------------------------------ */
/*  Team Roster                                                        */
/* ------------------------------------------------------------------ */

export interface RosterPlayer {
  id: number
  fullName: string
  position: string      // "C", "1B", "LF", "DH", etc.
  batSide: "L" | "R" | "S"
  jerseyNumber: string
  status: string        // "Active", etc.
}

interface RosterResponse {
  roster: {
    person: {
      id: number
      fullName: string
      batSide?: { code: string }
      primaryPosition?: { abbreviation: string; type?: string }
    }
    jerseyNumber: string
    status: { description: string }
  }[]
}

const PITCHER_POSITIONS = new Set(["P", "SP", "RP", "CP", "TWP"])

export async function getTeamRoster(teamId: number, season?: number): Promise<RosterPlayer[]> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<RosterResponse>(
      `/teams/${teamId}/roster?rosterType=active&season=${yr}&hydrate=person(stats(type=[season],season=${yr},group=[hitting]))`
    )
    const roster = raw.roster ?? []
    return roster
      .filter((r) => {
        const pos = r.person.primaryPosition?.abbreviation ?? ""
        const posType = r.person.primaryPosition?.type ?? ""
        // Include all non-pitchers, plus DH-designated pitchers (e.g. Ohtani)
        return !PITCHER_POSITIONS.has(pos) || posType === "Hitter"
      })
      .map((r) => ({
        id: r.person.id,
        fullName: r.person.fullName,
        position: r.person.primaryPosition?.abbreviation ?? "??",
        batSide: (r.person.batSide?.code === "L" ? "L" : r.person.batSide?.code === "S" ? "S" : "R") as "L" | "R" | "S",
        jerseyNumber: r.jerseyNumber ?? "",
        status: r.status?.description ?? "Active",
      }))
  } catch (err) {
    console.error(`[MLB] Roster error for team ${teamId}:`, err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Pitcher Season Stats                                               */
/* ------------------------------------------------------------------ */

export interface PitcherSeasonStats {
  wins: number
  losses: number
  era: number
  whip: number
  inningsPitched: number
  strikeOuts: number
  walks: number
  homeRuns: number
  avg: number
  gamesStarted: number
}

export async function getPitcherSeasonStats(pitcherId: number, season?: number): Promise<PitcherSeasonStats | null> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<MLBStatsResponse>(
      `/people/${pitcherId}/stats?stats=season&season=${yr}&group=pitching`
    )
    const s = raw.stats?.[0]?.splits?.[0]?.stat
    if (!s) return null
    return {
      wins: Number(s.wins) || 0,
      losses: Number(s.losses) || 0,
      era: Number(s.era) || 0,
      whip: Number(s.whip) || 0,
      inningsPitched: Number(s.inningsPitched) || 0,
      strikeOuts: Number(s.strikeOuts) || 0,
      walks: Number(s.baseOnBalls) || 0,
      homeRuns: Number(s.homeRuns) || 0,
      avg: Number(s.avg) || 0,
      gamesStarted: Number(s.gamesStarted) || 0,
    }
  } catch (err) {
    console.error(`[MLB] Pitcher stats error for ${pitcherId}:`, err)
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Batter Season Stats                                                */
/* ------------------------------------------------------------------ */

export interface BatterSeasonStats {
  atBats: number
  avg: number
  obp: number
  slg: number
  ops: number
  homeRuns: number
  rbi: number
  hits: number
  doubles: number
  triples: number
  stolenBases: number
  strikeOuts: number
  baseOnBalls: number
}

export async function getBatterSeasonStats(batterId: number, season?: number): Promise<BatterSeasonStats | null> {
  const yr = season ?? new Date().getFullYear()
  try {
    const raw = await mlbFetch<MLBStatsResponse>(
      `/people/${batterId}/stats?stats=season&season=${yr}&group=hitting`
    )
    const s = raw.stats?.[0]?.splits?.[0]?.stat
    if (!s) return null
    return {
      atBats: Number(s.atBats) || 0,
      avg: Number(s.avg) || 0,
      obp: Number(s.obp) || 0,
      slg: Number(s.slg) || 0,
      ops: Number(s.ops) || 0,
      homeRuns: Number(s.homeRuns) || 0,
      rbi: Number(s.rbi) || 0,
      hits: Number(s.hits) || 0,
      doubles: Number(s.doubles) || 0,
      triples: Number(s.triples) || 0,
      stolenBases: Number(s.stolenBases) || 0,
      strikeOuts: Number(s.strikeOuts) || 0,
      baseOnBalls: Number(s.baseOnBalls) || 0,
    }
  } catch (err) {
    console.error(`[MLB] Batter stats error for ${batterId}:`, err)
    return null
  }
}
