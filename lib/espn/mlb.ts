/* ──────────────────────────────────────────
   MLB Data Layer – fetches + normalizes ESPN data
   Uses "use cache" for daily caching.
   ────────────────────────────────────────── */
import "server-only"

import {
  fetchMLBScoreboard,
  fetchMLBLeaders,
  fetchAthleteGameLog,
  fetchMLBTeamRoster,
  fetchMLBTeams,
} from "./client"
import type {
  NormalizedBatter,
  NormalizedPitcher,
  NormalizedGameWeather,
  NormalizedProbableStarter,
} from "./types"

/* ════════════════════════════════════════════
   1.  BATTING LEADERS → Hitting Stats dashboard
   ════════════════════════════════════════════ */
export async function getMLBBattingLeaders(): Promise<NormalizedBatter[]> {
  try {
    const raw = await fetchMLBLeaders()
    const categories = (raw as Record<string, unknown[]>).categories ?? []

    // Leaders endpoint returns an array of categories.
    // We need to collect athletes across multiple stat categories and merge.
    const athleteMap = new Map<string, NormalizedBatter>()

    for (const cat of categories as Array<Record<string, unknown>>) {
      const catName = cat.name as string | undefined
      if (!catName) continue

      // Only process batting-related categories
      const leaders = (cat.leaders ?? []) as Array<Record<string, unknown>>
      for (const entry of leaders) {
        const statName = (entry.displayName as string) ?? ""
        const athletes = (entry.leaders ?? []) as Array<Record<string, unknown>>

        for (const a of athletes) {
          const athlete = a.athlete as Record<string, unknown> | undefined
          if (!athlete) continue

          const id = athlete.id as string
          const team = athlete.team as Record<string, unknown> | undefined
          const pos = athlete.position as Record<string, unknown> | undefined

          if (!athleteMap.has(id)) {
            athleteMap.set(id, {
              id,
              name: (athlete.displayName as string) ?? "",
              team: (team?.abbreviation as string) ?? "",
              position: (pos?.abbreviation as string) ?? "",
              headshot: (athlete.headshot as string) ?? "",
              gp: 0, ab: 0, r: 0, h: 0, avg: 0,
              doubles: 0, triples: 0, hr: 0, rbi: 0,
              bb: 0, so: 0, sb: 0, obp: 0, slg: 0, ops: 0,
            })
          }

          const batter = athleteMap.get(id)!
          const val = a.value as number ?? 0
          const display = (a.displayValue as string) ?? "0"

          // Map ESPN stat names to our fields
          switch (statName.toLowerCase()) {
            case "batting average": batter.avg = Number.parseFloat(display) || val; break
            case "home runs": batter.hr = val; break
            case "runs batted in": case "rbis": batter.rbi = val; break
            case "runs scored": case "runs": batter.r = val; break
            case "hits": batter.h = val; break
            case "stolen bases": batter.sb = val; break
            case "on base percentage": case "on base pct": batter.obp = Number.parseFloat(display) || val; break
            case "slugging percentage": case "slugging pct": batter.slg = Number.parseFloat(display) || val; break
            case "ops": batter.ops = Number.parseFloat(display) || val; break
          }
        }
      }
    }

    return Array.from(athleteMap.values())
      .filter((b) => b.avg > 0 || b.hr > 0 || b.h > 0) // filter out empty entries
      .sort((a, b) => b.ops - a.ops) // default sort by OPS
  } catch (err) {
    console.error("[ESPN] Failed to fetch batting leaders:", err)
    return []
  }
}

/* ════════════════════════════════════════════
   2.  PITCHING LEADERS → Pitching Stats dashboard
   ════════════════════════════════════════════ */
export async function getMLBPitchingLeaders(): Promise<NormalizedPitcher[]> {
  try {
    const raw = await fetchMLBLeaders()
    const categories = (raw as Record<string, unknown[]>).categories ?? []

    const pitcherMap = new Map<string, NormalizedPitcher>()

    for (const cat of categories as Array<Record<string, unknown>>) {
      const leaders = (cat.leaders ?? []) as Array<Record<string, unknown>>

      for (const entry of leaders) {
        const statName = ((entry.displayName as string) ?? "").toLowerCase()
        const athletes = (entry.leaders ?? []) as Array<Record<string, unknown>>

        for (const a of athletes) {
          const athlete = a.athlete as Record<string, unknown> | undefined
          if (!athlete) continue

          const id = athlete.id as string
          const team = athlete.team as Record<string, unknown> | undefined
          const pos = athlete.position as Record<string, unknown> | undefined
          const posAbbr = (pos?.abbreviation as string) ?? ""

          // Only pitchers
          if (posAbbr !== "SP" && posAbbr !== "RP" && posAbbr !== "P") continue

          if (!pitcherMap.has(id)) {
            pitcherMap.set(id, {
              id,
              name: (athlete.displayName as string) ?? "",
              team: (team?.abbreviation as string) ?? "",
              hand: "R", // ESPN doesn't reliably provide this in leaders
              headshot: (athlete.headshot as string) ?? "",
              w: 0, l: 0, era: 0, gp: 0, gs: 0, ip: 0,
              h: 0, er: 0, hr: 0, bb: 0, so: 0,
              whip: 0, avg: 0, kPer9: 0, bbPer9: 0,
            })
          }

          const pitcher = pitcherMap.get(id)!
          const val = a.value as number ?? 0
          const display = (a.displayValue as string) ?? "0"

          switch (statName) {
            case "earned run average": case "era": pitcher.era = Number.parseFloat(display) || val; break
            case "wins": pitcher.w = val; break
            case "losses": pitcher.l = val; break
            case "strikeouts": pitcher.so = val; break
            case "walks": case "bases on balls": pitcher.bb = val; break
            case "whip": pitcher.whip = Number.parseFloat(display) || val; break
            case "innings pitched": pitcher.ip = Number.parseFloat(display) || val; break
            case "saves": break // we track it but don't currently display
          }
        }
      }
    }

    // Compute derived stats
    for (const p of pitcherMap.values()) {
      if (p.ip > 0) {
        p.kPer9 = (p.so / p.ip) * 9
        p.bbPer9 = (p.bb / p.ip) * 9
      }
    }

    return Array.from(pitcherMap.values())
      .filter((p) => p.ip > 0 || p.era > 0)
      .sort((a, b) => a.era - b.era)
  } catch (err) {
    console.error("[ESPN] Failed to fetch pitching leaders:", err)
    return []
  }
}

/* ════════════════════════════════════════════
   3.  SCOREBOARD → Weather + NRFI dashboards
   ════════════════════════════════════════════ */
export async function getMLBScoreboard(date?: string) {
  try {
    const raw = await fetchMLBScoreboard(date)
    const events = (raw as Record<string, unknown[]>).events ?? []
    return { events, raw }
  } catch (err) {
    console.error("[ESPN] Failed to fetch scoreboard:", err)
    return { events: [], raw: {} }
  }
}

/** Extract weather data from scoreboard for the Weather dashboard */
export async function getMLBWeather(date?: string): Promise<NormalizedGameWeather[]> {
  try {
    const { events } = await getMLBScoreboard(date)
    const games: NormalizedGameWeather[] = []

    for (const event of events as Array<Record<string, unknown>>) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      const comp = competitions[0]
      if (!comp) continue

      const venue = comp.venue as Record<string, unknown> | undefined
      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>
      const weather = (event.weather ?? comp.weather) as Record<string, unknown> | undefined

      const home = competitors.find((c) => c.homeAway === "home")
      const away = competitors.find((c) => c.homeAway === "away")
      const homeTeam = home?.team as Record<string, unknown> | undefined
      const awayTeam = away?.team as Record<string, unknown> | undefined

      games.push({
        eventId: event.id as string,
        matchup: (event.shortName as string) ?? `${awayTeam?.abbreviation} @ ${homeTeam?.abbreviation}`,
        venue: (venue?.fullName as string) ?? "Unknown",
        indoor: (venue?.indoor as boolean) ?? false,
        gameTime: (event.date as string) ?? "",
        homeTeam: (homeTeam?.abbreviation as string) ?? "",
        awayTeam: (awayTeam?.abbreviation as string) ?? "",
        temperature: (weather?.temperature as number) ?? 0,
        condition: (weather?.displayValue as string) ?? (venue?.indoor ? "Dome" : "Unknown"),
        windDisplay: "", // ESPN scoreboard sometimes includes wind in weather text
      })
    }

    return games.sort((a, b) => b.temperature - a.temperature)
  } catch (err) {
    console.error("[ESPN] Failed to extract weather:", err)
    return []
  }
}

/** Extract probable starters from scoreboard for the NRFI dashboard */
export async function getMLBProbableStarters(date?: string): Promise<NormalizedProbableStarter[]> {
  try {
    const { events } = await getMLBScoreboard(date)
    const starters: NormalizedProbableStarter[] = []

    for (const event of events as Array<Record<string, unknown>>) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      const comp = competitions[0]
      if (!comp) continue

      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>

      for (const competitor of competitors) {
        const probables = (competitor.probables ?? []) as Array<Record<string, unknown>>
        const team = competitor.team as Record<string, unknown> | undefined
        const homeAway = competitor.homeAway as string

        // Find the opponent
        const opp = competitors.find((c) => c.homeAway !== homeAway)
        const oppTeam = opp?.team as Record<string, unknown> | undefined

        for (const prob of probables) {
          const stats = (prob.statistics ?? []) as Array<Record<string, string>>
          const eraEntry = stats.find((s) => s.name === "era")
          const recordEntry = stats.find(
            (s) => s.name === "record" || s.name === "wins" || s.name === "seasonRecord"
          )

          starters.push({
            eventId: event.id as string,
            gameTime: (event.date as string) ?? "",
            pitcherId: (prob.playerId as number) ?? 0,
            pitcherName: (prob.displayName as string) ?? (prob.shortDisplayName as string) ?? "",
            team: (team?.abbreviation as string) ?? "",
            opponent: (oppTeam?.abbreviation as string) ?? "",
            hand: ((prob.abbreviation as string) ?? "R").includes("L") ? "L" : "R",
            record: (recordEntry?.displayValue as string) ?? "",
            era: (eraEntry?.displayValue as string) ?? "",
          })
        }
      }
    }

    return starters.sort((a, b) => new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime())
  } catch (err) {
    console.error("[ESPN] Failed to extract probable starters:", err)
    return []
  }
}

/* ════════════════════════════════════════════
   4.  PLAYER GAME LOG → Trends dashboard
   ════════════════════════════════════════════ */
export interface GameLogEntry {
  date: string
  opponent: string
  stats: Record<string, string | number>
}

export async function getPlayerGameLog(athleteId: string): Promise<GameLogEntry[]> {
  try {
    const raw = await fetchAthleteGameLog(athleteId)
    // The gamelog endpoint returns a complex nested structure.
    // We extract the seasonTypes → categories → events chain.
    const seasonTypes = (raw as Record<string, unknown>).seasonTypes as Array<Record<string, unknown>> | undefined
    if (!seasonTypes?.length) return []

    const entries: GameLogEntry[] = []
    const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
    const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>

    if (!categories.length) return entries

    // Find batting or pitching category
    const cat = categories[0]
    const labels = (cat.labels ?? []) as string[]
    const events = (cat.events ?? []) as Array<Record<string, unknown>>

    for (const evt of events.slice(0, 20)) { // last 20 games
      const statsArr = (evt.stats ?? []) as Array<string | number>
      const statMap: Record<string, string | number> = {}
      labels.forEach((label, i) => {
        statMap[label] = statsArr[i] ?? 0
      })

      entries.push({
        date: (evt.eventDate as string) ?? "",
        opponent: (evt.opponent as Record<string, unknown>)?.abbreviation as string ?? "",
        stats: statMap,
      })
    }

    return entries
  } catch (err) {
    console.error(`[ESPN] Failed to fetch game log for ${athleteId}:`, err)
    return []
  }
}

/* ════════════════════════════════════════════
   5.  ALL ACTIVE MLB BATTERS (via team rosters)
   Fetches rosters for all 30 teams and returns
   every position player (non-pitcher).
   ════════════════════════════════════════════ */
export interface RosterPlayer {
  id: string
  name: string
  team: string
  position: string
}

export async function getAllMLBBatters(): Promise<RosterPlayer[]> {
  try {
    const teamsRaw = await fetchMLBTeams()
    const sports = (teamsRaw as Record<string, unknown[]>).sports ?? []
    const teamIds: { id: string; abbr: string }[] = []

    for (const sport of sports as Array<Record<string, unknown>>) {
      const leagues = (sport.leagues ?? []) as Array<Record<string, unknown>>
      for (const league of leagues) {
        const teams = (league.teams ?? []) as Array<Record<string, unknown>>
        for (const teamEntry of teams) {
          const team = teamEntry.team as Record<string, unknown> | undefined
          if (team) {
            teamIds.push({
              id: team.id as string,
              abbr: (team.abbreviation as string) ?? "",
            })
          }
        }
      }
    }

    // Fetch all rosters in parallel (30 teams)
    const rosterPromises = teamIds.map(async ({ id, abbr }) => {
      try {
        const raw = await fetchMLBTeamRoster(id)
        const athletes = (raw as Record<string, unknown[]>).athletes ?? []
        const players: RosterPlayer[] = []

        for (const group of athletes as Array<Record<string, unknown>>) {
          const items = (group.items ?? []) as Array<Record<string, unknown>>
          for (const item of items) {
            const pos = (item.position as Record<string, unknown>)?.abbreviation as string ?? ""
            // Skip pitchers - we only want batters
            if (pos === "SP" || pos === "RP" || pos === "P" || pos === "CP") continue

            players.push({
              id: item.id as string,
              name: (item.displayName as string) ?? (item.fullName as string) ?? "",
              team: abbr,
              position: pos,
            })
          }
        }
        return players
      } catch {
        return []
      }
    })

    const results = await Promise.all(rosterPromises)
    return results.flat()
  } catch (err) {
    console.error("[ESPN] Failed to fetch all MLB batters:", err)
    return []
  }
}
