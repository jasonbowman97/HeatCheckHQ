/* ──────────────────────────────────────────
   ESPN Unofficial API – TypeScript types
   Covers the subset of fields our dashboards need.
   ────────────────────────────────────────── */

// ---------- Scoreboard (today's games) ----------

export interface EspnScoreboard {
  events: EspnEvent[]
}

export interface EspnEvent {
  id: string
  date: string
  name: string // e.g. "New York Yankees at Boston Red Sox"
  shortName: string // e.g. "NYY @ BOS"
  competitions: EspnCompetition[]
  weather?: EspnWeather
  status: {
    type: { name: string; description: string; completed: boolean }
  }
}

export interface EspnCompetition {
  id: string
  venue: {
    fullName: string
    indoor: boolean
    address?: { city: string; state: string }
  }
  competitors: EspnCompetitor[]
  odds?: Array<{ details: string; overUnder: number }>
  weather?: EspnWeather
}

export interface EspnWeather {
  displayValue: string // e.g. "Sunny"
  temperature: number
  conditionId: string
  highTemperature?: number
  link?: { href: string }
}

export interface EspnCompetitor {
  id: string
  homeAway: "home" | "away"
  team: {
    id: string
    abbreviation: string
    displayName: string
    shortDisplayName: string
    logo: string
  }
  probables?: EspnProbable[]
  records?: Array<{ type: string; summary: string }>
}

export interface EspnProbable {
  playerId: number
  abbreviation: string
  displayName: string
  shortDisplayName: string
  headshot: string
  jersey: string
  statistics?: Array<{ name: string; displayValue: string }>
}

// ---------- Leaders (batting & pitching) ----------

export interface EspnLeadersResponse {
  categories: EspnLeaderCategory[]
}

export interface EspnLeaderCategory {
  name: string        // e.g. "batting", "pitching"
  displayName: string // e.g. "Batting Leaders"
  leaders: EspnLeaderEntry[]
}

export interface EspnLeaderEntry {
  displayName: string // stat name e.g. "Batting Average"
  leaders: EspnLeaderAthlete[]
}

export interface EspnLeaderAthlete {
  displayValue: string   // the stat value "0.331"
  value: number
  athlete: {
    id: string
    displayName: string
    shortName: string
    headshot: string
    jersey: string
    position: { abbreviation: string }
    team: { id: string; abbreviation: string; displayName: string }
  }
}

// ---------- Athlete statistics ----------

export interface EspnAthleteStatsResponse {
  splits: {
    categories: Array<{
      name: string
      displayName: string
      stats: Array<{
        name: string
        displayName: string
        value: number
        displayValue: string
      }>
    }>
  }
}

// ---------- Game summary ----------

export interface EspnGameSummary {
  boxscore: {
    teams: Array<{
      team: { abbreviation: string; displayName: string }
      statistics: Array<{
        name: string
        displayValue: string
      }>
    }>
    players: Array<{
      team: { abbreviation: string }
      statistics: Array<{
        name: string
        labels: string[]
        athletes: Array<{
          athlete: {
            id: string
            displayName: string
            position: { abbreviation: string }
          }
          stats: string[]
        }>
      }>
    }>
  }
  gameInfo: {
    venue: { fullName: string }
    weather?: EspnWeather
  }
}

// ---------- Normalized types our dashboards consume ----------

export interface NormalizedBatter {
  id: string
  name: string
  team: string
  position: string
  headshot: string
  gp: number
  ab: number
  r: number
  h: number
  avg: number
  doubles: number
  triples: number
  hr: number
  rbi: number
  bb: number
  so: number
  sb: number
  obp: number
  slg: number
  ops: number
}

export interface NormalizedPitcher {
  id: string
  name: string
  team: string
  hand: "R" | "L"
  headshot: string
  w: number
  l: number
  era: number
  gp: number
  gs: number
  ip: number
  h: number
  er: number
  hr: number
  bb: number
  so: number
  whip: number
  avg: number
  kPer9: number
  bbPer9: number
}

export interface NormalizedGameWeather {
  eventId: string
  matchup: string
  venue: string
  indoor: boolean
  gameTime: string
  homeTeam: string
  awayTeam: string
  temperature: number
  condition: string
  windDisplay: string
}

export interface NormalizedProbableStarter {
  eventId: string
  gameTime: string
  pitcherId: number
  pitcherName: string
  team: string
  opponent: string
  hand: "R" | "L"
  record: string
  era: string
}
