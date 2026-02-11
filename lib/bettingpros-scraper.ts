/**
 * Scrapes first-basket stats and defense-vs-position data from BettingPros.
 * Both pages embed data as inline JS variables in the HTML.
 * Intended to run server-side, cached via ISR (once per day).
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

/** Extract a balanced JSON object/array starting at a given position in the string */
function extractBalanced(html: string, startIdx: number): string {
  const open = html[startIdx]
  const close = open === "{" ? "}" : "]"
  let depth = 1
  let i = startIdx + 1
  let inString = false
  let escape = false
  while (i < html.length && depth > 0) {
    const ch = html[i]
    if (escape) { escape = false; i++; continue }
    if (ch === "\\") { escape = true; i++; continue }
    if (ch === '"') { inString = !inString; i++; continue }
    if (!inString) {
      if (ch === open) depth++
      else if (ch === close) depth--
    }
    i++
  }
  return html.substring(startIdx, i)
}

/* ------------------------------------------------------------------ */
/*  First Basket                                                       */
/* ------------------------------------------------------------------ */

export interface BPFirstBasketPlayer {
  id: string
  name: string
  team: string
  position: string
  image: string
  gamesPlayed: number
  gamesStarted: number
  firstBaskets: number
  firstBasketHome: number
  firstBasketAway: number
  firstShots: number
  firstShotHome: number
  firstShotAway: number
  teamGames: number
  teamRank: number
}

export interface BPTeamTipoff {
  team: string
  tipoffWins: number
  tipoffHome: number
  tipoffAway: number
  teamGames: number
  firstBaskets: number
  firstBasketHome: number
  firstBasketAway: number
}

export interface BPFirstBasketData {
  players: BPFirstBasketPlayer[]
  teams: BPTeamTipoff[]
}

interface FBCategory {
  name: string
  type: string
  participants: Array<{
    participant: {
      id: string
      name: string
      player?: { position: string; team: string; image: string }
      team?: { abbreviation: string }
    }
    value: number
    home_value: number
    away_value: number
    team_games: number
    home_games: number
    away_games: number
    started?: number
    played?: number
    team_rank?: number
  }>
}

export async function scrapeFirstBasketData(): Promise<BPFirstBasketData> {
  const res = await fetch("https://www.bettingpros.com/nba/picks/first-basket/", {
    headers: { "User-Agent": UA },
    next: { revalidate: 43200 },
  })
  if (!res.ok) throw new Error(`BettingPros first basket ${res.status}`)
  const html = await res.text()

  // Extract firstBasketStats — it's a JS object with numeric keys containing JSON arrays
  // Pattern: firstBasketStats: {0: {...}, 1: {...}, ...}
  const statsMarker = "firstBasketStats:"
  const statsIdx = html.indexOf(statsMarker)
  if (statsIdx === -1) throw new Error("Could not find firstBasketStats in HTML")

  // Find the opening brace after "firstBasketStats:"
  let braceStart = html.indexOf("{", statsIdx + statsMarker.length)
  if (braceStart === -1) throw new Error("Could not find firstBasketStats opening brace")
  const statsBlock = extractBalanced(html, braceStart)

  // The stats block has numeric keys like {0: {...}, 1: {...}}
  // Convert JS object literal to JSON by quoting the numeric keys
  const jsonFixed = statsBlock.replace(/(\{|,)\s*(\d+)\s*:/g, '$1"$2":')
  const fbStats: Record<string, FBCategory> = JSON.parse(jsonFixed)

  // Build player lookup from categories
  const playedMap = new Map<string, { played: number; started: number; teamGames: number }>()
  const fbMap = new Map<string, { value: number; home: number; away: number; teamRank: number }>()
  const fsMap = new Map<string, { value: number; home: number; away: number }>()
  const playerInfo = new Map<string, { name: string; team: string; position: string; image: string }>()

  for (const cat of Object.values(fbStats)) {
    if (cat.name === "played" && cat.type === "player") {
      for (const p of cat.participants) {
        playedMap.set(p.participant.id, {
          played: p.value,
          started: p.started ?? 0,
          teamGames: p.team_games,
        })
        if (p.participant.player) {
          playerInfo.set(p.participant.id, {
            name: p.participant.name,
            team: p.participant.player.team,
            position: p.participant.player.position,
            image: p.participant.player.image,
          })
        }
      }
    }
    if (cat.name === "first_basket" && cat.type === "player") {
      for (const p of cat.participants) {
        fbMap.set(p.participant.id, {
          value: p.value,
          home: p.home_value,
          away: p.away_value,
          teamRank: p.team_rank ?? 99,
        })
      }
    }
    if (cat.name === "first_shot" && cat.type === "player") {
      for (const p of cat.participants) {
        fsMap.set(p.participant.id, {
          value: p.value,
          home: p.home_value,
          away: p.away_value,
        })
      }
    }
  }

  // Merge into player list
  const players: BPFirstBasketPlayer[] = []
  for (const [id, info] of playerInfo) {
    const played = playedMap.get(id)
    const fb = fbMap.get(id)
    const fs = fsMap.get(id)
    if (!played || played.played === 0) continue
    players.push({
      id,
      name: info.name,
      team: info.team,
      position: info.position,
      image: info.image,
      gamesPlayed: played.played,
      gamesStarted: played.started,
      firstBaskets: fb?.value ?? 0,
      firstBasketHome: fb?.home ?? 0,
      firstBasketAway: fb?.away ?? 0,
      firstShots: fs?.value ?? 0,
      firstShotHome: fs?.home ?? 0,
      firstShotAway: fs?.away ?? 0,
      teamGames: played.teamGames,
      teamRank: fb?.teamRank ?? 99,
    })
  }

  // Build team tipoff data
  const teams: BPTeamTipoff[] = []
  for (const cat of Object.values(fbStats)) {
    if (cat.name === "tipoff_win" && cat.type === "team") {
      for (const p of cat.participants) {
        const teamAbbr = p.participant.team?.abbreviation ?? p.participant.id
        const tfbCat = Object.values(fbStats).find((c) => c.name === "team_first_basket")
        const tfb = tfbCat?.participants.find((t) => (t.participant.team?.abbreviation ?? t.participant.id) === teamAbbr)
        teams.push({
          team: teamAbbr,
          tipoffWins: p.value,
          tipoffHome: p.home_value,
          tipoffAway: p.away_value,
          teamGames: p.team_games,
          firstBaskets: tfb?.value ?? 0,
          firstBasketHome: tfb?.home_value ?? 0,
          firstBasketAway: tfb?.away_value ?? 0,
        })
      }
    }
  }

  return { players, teams }
}

/* ------------------------------------------------------------------ */
/*  Defense vs Position                                                */
/* ------------------------------------------------------------------ */

export interface BPDvpRankings {
  /** Points allowed per position, ranked 1-30 (1 = fewest pts allowed = best D) */
  rankings: Record<string, { pg: number; sg: number; sf: number; pf: number; c: number }>
  /** Raw points allowed per position per team */
  raw: Record<string, { pg: number; sg: number; sf: number; pf: number; c: number }>
}

export async function scrapeDvpData(): Promise<BPDvpRankings> {
  const res = await fetch("https://www.bettingpros.com/nba/defense-vs-position/", {
    headers: { "User-Agent": UA },
    next: { revalidate: 43200 },
  })
  if (!res.ok) throw new Error(`BettingPros DVP ${res.status}`)
  const html = await res.text()

  // Extract teamStats JSON — it's embedded as: teamStats: {"ATL": {...}, ...}
  const marker = "teamStats:"
  const markerIdx = html.indexOf(marker, html.indexOf("bpDefenseVsPositionStats"))
  if (markerIdx === -1) throw new Error("Could not find teamStats in DVP HTML")

  const braceStart = html.indexOf("{", markerIdx + marker.length)
  if (braceStart === -1) throw new Error("Could not find teamStats opening brace")
  const teamStatsJson = extractBalanced(html, braceStart)

  const teamStats: Record<string, Record<string, {
    points: number
    rebounds: number
    assists: number
    three_points_made: number
    steals: number
    blocks: number
    turnovers: number
    field_goals_perc: number
    free_throw_perc: number
  }>> = JSON.parse(teamStatsJson)

  const posKeys = ["pg", "sg", "sf", "pf", "c"] as const
  const posLabels = ["PG", "SG", "SF", "PF", "C"] as const

  // Collect raw points allowed per position per team
  const raw: Record<string, { pg: number; sg: number; sf: number; pf: number; c: number }> = {}
  for (const [team, posData] of Object.entries(teamStats)) {
    raw[team] = {
      pg: posData.PG?.points ?? 0,
      sg: posData.SG?.points ?? 0,
      sf: posData.SF?.points ?? 0,
      pf: posData.PF?.points ?? 0,
      c: posData.C?.points ?? 0,
    }
  }

  // Compute rankings per position (1 = fewest points allowed = best defense)
  const rankings: Record<string, { pg: number; sg: number; sf: number; pf: number; c: number }> = {}
  for (const team of Object.keys(raw)) {
    rankings[team] = { pg: 0, sg: 0, sf: 0, pf: 0, c: 0 }
  }

  for (let p = 0; p < posLabels.length; p++) {
    const posKey = posKeys[p]
    const sorted = Object.entries(raw)
      .map(([team, vals]) => ({ team, pts: vals[posKey] }))
      .sort((a, b) => a.pts - b.pts) // ascending = fewer pts allowed = better D

    sorted.forEach((entry, idx) => {
      rankings[entry.team][posKey] = idx + 1
    })
  }

  return { rankings, raw }
}
