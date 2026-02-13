/**
 * NFL Streak Detection
 * Fetches player leaders and analyzes their game logs to find active streaks.
 *
 * Streak categories align with NFL prop markets:
 * - Passing (pass yards, TDs, INTs, turnover-free)
 * - Rushing (rush yards, TDs, YPC)
 * - Receiving (rec yards, receptions, TDs)
 * - Touchdowns (any-position TD streaks/droughts)
 *
 * Uses ESPN gamelog v3 endpoint. Labels at `raw.names` (unique stat keys),
 * event metadata at `raw.events[eventId]`.
 */
import "server-only"

import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const NFL_WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl"

interface NFLGameLogEntry {
  date: string
  opponent: string
  stats: Record<string, number>
}

/** Parse ESPN NFL gamelog response into flat stat entries.
 *  Uses `raw.names` for unique stat keys (avoids duplicate YDS labels). */
function parseNFLGameLog(raw: Record<string, unknown>): NFLGameLogEntry[] {
  const names = (raw.names ?? []) as string[]
  const eventMeta = (raw.events ?? {}) as Record<string, Record<string, unknown>>

  const seasonTypes = raw.seasonTypes as Array<Record<string, unknown>> | undefined
  if (!seasonTypes?.length || !names.length) return []

  const entries: NFLGameLogEntry[] = []
  const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
  const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>

  for (const cat of categories) {
    const events = (cat.events ?? []) as Array<Record<string, unknown>>
    for (const evt of events) {
      const eventId = evt.eventId as string
      const statsArr = (evt.stats ?? []) as Array<string | number>
      const statMap: Record<string, number> = {}
      names.forEach((name, i) => {
        statMap[name] = Number(statsArr[i]) || 0
      })
      const meta = eventMeta[eventId]
      const opponent = (meta?.opponent as Record<string, unknown>)?.abbreviation as string ?? ""
      const date = (meta?.gameDate as string) ?? ""
      entries.push({ date, opponent, stats: statMap })
    }
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries.slice(0, 20)
}

/** Fetch NFL player game log from ESPN web API */
async function getNFLPlayerGameLog(athleteId: string): Promise<NFLGameLogEntry[]> {
  try {
    const res = await fetch(`${NFL_WEB_BASE}/athletes/${athleteId}/gamelog`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 43200 },
    })
    if (!res.ok) return []
    const raw = await res.json()
    return parseNFLGameLog(raw)
  } catch {
    return []
  }
}

function seasonAvg(gameLogs: NFLGameLogEntry[], stat: string): number {
  if (gameLogs.length === 0) return 0
  return gameLogs.reduce((s, g) => s + (g.stats[stat] ?? 0), 0) / gameLogs.length
}

function calcStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) streak++
    else break
  }
  return streak
}

function calcColdStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (!games[i]) streak++
    else break
  }
  return streak
}

/* ── Passing Streaks (QB) ── */

function detectPassingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: NFLGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()
  if (last8.length < 4) return streaks

  const avgPassYds = seasonAvg(gameLogs, "passingYards")
  const avgLabel = `${avgPassYds.toFixed(1)} YPG`

  // 1. 300+ yard passing games (hot)
  const bigPassGames = last8.map((g) => (g.stats.passingYards ?? 0) >= 300)
  const bigPassStreak = calcStreak(bigPassGames)

  if (bigPassStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position: "QB",
      streakType: "hot", category: "Passing",
      statLabel: "300+ YD Games",
      streakDescription: `${bigPassStreak} straight games with 300+ pass yards`,
      recentGames: bigPassGames, currentStreak: bigPassStreak,
      statValue: `${bigPassStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 2. 3+ passing TD games (hot)
  const tdGames = last8.map((g) => (g.stats.passingTouchdowns ?? 0) >= 3)
  const tdCount = tdGames.filter(Boolean).length

  if (tdCount >= 4) {
    streaks.push({
      playerId, playerName, team, position: "QB",
      streakType: "hot", category: "Passing",
      statLabel: "3+ TD Games",
      streakDescription: `${tdCount} games with 3+ passing TDs in last ${last8.length}`,
      recentGames: tdGames, currentStreak: calcStreak(tdGames),
      statValue: `${tdCount}/${last8.length}`, seasonAvg: avgLabel,
    })
  }

  // 3. Turnover-free streak — 0 INT (hot)
  const cleanGames = last8.map((g) => (g.stats.interceptions ?? 0) === 0)
  const cleanStreak = calcStreak(cleanGames)

  if (cleanStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position: "QB",
      streakType: "hot", category: "Passing",
      statLabel: "Turnover-Free",
      streakDescription: `${cleanStreak} straight games without an INT`,
      recentGames: cleanGames, currentStreak: cleanStreak,
      statValue: `${cleanStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 4. Cold: below 60% of season avg pass yards for 3+ of last 5 (cold)
  if (avgPassYds >= 180) {
    const last5 = last8.slice(-5)
    const belowLineGames = last5.map((g) => (g.stats.passingYards ?? 0) < avgPassYds * 0.6)
    const belowCount = belowLineGames.filter(Boolean).length

    if (belowCount >= 3) {
      const recentAvg = last5.reduce((s, g) => s + (g.stats.passingYards ?? 0), 0) / last5.length
      streaks.push({
        playerId, playerName, team, position: "QB",
        streakType: "cold", category: "Passing",
        statLabel: "Pass YPG L5",
        streakDescription: `Under ${Math.round(avgPassYds * 0.6)} pass yards in ${belowCount} of last 5`,
        recentGames: belowLineGames, currentStreak: belowCount,
        statValue: recentAvg.toFixed(1), seasonAvg: avgLabel,
      })
    }
  }

  // 5. Cold: multiple INT games (2+ INT in 3+ of last 5)
  const last5INT = last8.slice(-5)
  const multiINTGames = last5INT.map((g) => (g.stats.interceptions ?? 0) >= 2)
  const multiINTCount = multiINTGames.filter(Boolean).length

  if (multiINTCount >= 3) {
    const totalINTs = last5INT.reduce((s, g) => s + (g.stats.interceptions ?? 0), 0)
    streaks.push({
      playerId, playerName, team, position: "QB",
      streakType: "cold", category: "Passing",
      statLabel: "2+ INT Games",
      streakDescription: `2+ INTs in ${multiINTCount} of last 5 (${totalINTs} total)`,
      recentGames: multiINTGames, currentStreak: multiINTCount,
      statValue: `${totalINTs} INT`, seasonAvg: avgLabel,
    })
  }

  // ── Consistency: Pass yards thresholds (2/3 games — NFL has few games) ──
  const last3Pass = last8.slice(-3)
  const passYdThresholds = [
    { line: 224.5, minAvg: 200 },
    { line: 249.5, minAvg: 225 },
    { line: 274.5, minAvg: 250 },
    { line: 299.5, minAvg: 275 },
  ]
  for (const { line, minAvg } of passYdThresholds) {
    if (avgPassYds >= minAvg) {
      const overGames = last3Pass.map((g) => (g.stats.passingYards ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "QB",
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} Pass YDS`,
          streakDescription: `Over ${line} pass yards in ${overCount} of last ${last3Pass.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last3Pass.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Pass YDS", hitRate: `${overCount}/${last3Pass.length}`, hitPct: overCount / last3Pass.length },
        })
      }
      const underGames = last3Pass.map((g) => (g.stats.passingYards ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "QB",
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} Pass YDS`,
          streakDescription: `Under ${line} pass yards in ${underCount} of last ${last3Pass.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last3Pass.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Pass YDS", hitRate: `${underCount}/${last3Pass.length}`, hitPct: underCount / last3Pass.length },
        })
      }
    }
  }

  // ── Consistency: Pass TD thresholds (2/3 games) ──
  const avgPassTD = seasonAvg(gameLogs, "passingTouchdowns")
  const passTDThresholds = [
    { line: 1.5, minAvg: 1.2 },
    { line: 2.5, minAvg: 2 },
  ]
  for (const { line, minAvg } of passTDThresholds) {
    if (avgPassTD >= minAvg) {
      const overGames = last3Pass.map((g) => (g.stats.passingTouchdowns ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "QB",
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} Pass TD`,
          streakDescription: `Over ${line} pass TDs in ${overCount} of last ${last3Pass.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last3Pass.length}`, seasonAvg: `${avgPassTD.toFixed(1)} TD/G`,
          threshold: { line, stat: "Pass TD", hitRate: `${overCount}/${last3Pass.length}`, hitPct: overCount / last3Pass.length },
        })
      }
    }
  }

  return streaks
}

/* ── Rushing Streaks (RB) ── */

function detectRushingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: NFLGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()
  if (last8.length < 4) return streaks

  const avgRushYds = seasonAvg(gameLogs, "rushingYards")
  const avgLabel = `${avgRushYds.toFixed(1)} YPG`

  // 1. 100+ yard rushing games (hot)
  const bigRushGames = last8.map((g) => (g.stats.rushingYards ?? 0) >= 100)
  const bigRushStreak = calcStreak(bigRushGames)

  if (bigRushStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position: "RB",
      streakType: "hot", category: "Rushing",
      statLabel: "100+ YD Games",
      streakDescription: `${bigRushStreak} straight games with 100+ rush yards`,
      recentGames: bigRushGames, currentStreak: bigRushStreak,
      statValue: `${bigRushStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 2. Rushing TD streak (hot)
  const tdGames = last8.map((g) => (g.stats.rushingTouchdowns ?? 0) >= 1)
  const tdStreak = calcStreak(tdGames)

  if (tdStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position: "RB",
      streakType: "hot", category: "Touchdowns",
      statLabel: "Rush TD Streak",
      streakDescription: `Rush TD in ${tdStreak} straight games`,
      recentGames: tdGames, currentStreak: tdStreak,
      statValue: `${tdStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 3. Cold: below 50% of season avg rush yards for 3+ of last 5
  if (avgRushYds >= 40) {
    const last5 = last8.slice(-5)
    const belowLineGames = last5.map((g) => (g.stats.rushingYards ?? 0) < avgRushYds * 0.5)
    const belowCount = belowLineGames.filter(Boolean).length

    if (belowCount >= 3) {
      const recentAvg = last5.reduce((s, g) => s + (g.stats.rushingYards ?? 0), 0) / last5.length
      streaks.push({
        playerId, playerName, team, position: "RB",
        streakType: "cold", category: "Rushing",
        statLabel: "Rush YPG L5",
        streakDescription: `Under ${Math.round(avgRushYds * 0.5)} rush yards in ${belowCount} of last 5`,
        recentGames: belowLineGames, currentStreak: belowCount,
        statValue: recentAvg.toFixed(1), seasonAvg: avgLabel,
      })
    }
  }

  // 4. Cold: TD drought (0 rushing TDs in 5+ straight)
  const noTDGames = last8.map((g) => (g.stats.rushingTouchdowns ?? 0) === 0)
  const tdDrought = calcStreak(noTDGames)

  if (tdDrought >= 5) {
    streaks.push({
      playerId, playerName, team, position: "RB",
      streakType: "cold", category: "Touchdowns",
      statLabel: "TD Drought",
      streakDescription: `0 rushing TDs in ${tdDrought} straight games`,
      recentGames: noTDGames, currentStreak: tdDrought,
      statValue: `${tdDrought}G`, seasonAvg: avgLabel,
    })
  }

  // ── Consistency: Rush yards thresholds (2/3 games — NFL has few games) ──
  const last3Rush = last8.slice(-3)
  const rushYdThresholds = [
    { line: 49.5, minAvg: 40 },
    { line: 69.5, minAvg: 55 },
    { line: 79.5, minAvg: 65 },
    { line: 99.5, minAvg: 80 },
  ]
  for (const { line, minAvg } of rushYdThresholds) {
    if (avgRushYds >= minAvg) {
      const overGames = last3Rush.map((g) => (g.stats.rushingYards ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "RB",
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} Rush YDS`,
          streakDescription: `Over ${line} rush yards in ${overCount} of last ${last3Rush.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last3Rush.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Rush YDS", hitRate: `${overCount}/${last3Rush.length}`, hitPct: overCount / last3Rush.length },
        })
      }
      const underGames = last3Rush.map((g) => (g.stats.rushingYards ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "RB",
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} Rush YDS`,
          streakDescription: `Under ${line} rush yards in ${underCount} of last ${last3Rush.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last3Rush.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Rush YDS", hitRate: `${underCount}/${last3Rush.length}`, hitPct: underCount / last3Rush.length },
        })
      }
    }
  }

  return streaks
}

/* ── Receiving Streaks (WR/TE) ── */

function detectReceivingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: NFLGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()
  if (last8.length < 4) return streaks

  const avgRecYds = seasonAvg(gameLogs, "receivingYards")
  const avgLabel = `${avgRecYds.toFixed(1)} YPG`

  // 1. 100+ yard receiving games (hot)
  const bigRecGames = last8.map((g) => (g.stats.receivingYards ?? 0) >= 100)
  const bigRecStreak = calcStreak(bigRecGames)

  if (bigRecStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position: "WR",
      streakType: "hot", category: "Receiving",
      statLabel: "100+ YD Games",
      streakDescription: `${bigRecStreak} straight games with 100+ rec yards`,
      recentGames: bigRecGames, currentStreak: bigRecStreak,
      statValue: `${bigRecStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 2. 6+ receptions games — target share (hot)
  const catchGames = last8.map((g) => (g.stats.receptions ?? 0) >= 6)
  const catchCount = catchGames.filter(Boolean).length

  if (catchCount >= 5) {
    streaks.push({
      playerId, playerName, team, position: "WR",
      streakType: "hot", category: "Receiving",
      statLabel: "6+ REC Games",
      streakDescription: `${catchCount} games with 6+ receptions in last ${last8.length}`,
      recentGames: catchGames, currentStreak: calcStreak(catchGames),
      statValue: `${catchCount}/${last8.length}`, seasonAvg: avgLabel,
    })
  }

  // 3. Receiving TD streak (hot)
  const tdGames = last8.map((g) => (g.stats.receivingTouchdowns ?? 0) >= 1)
  const tdStreak = calcStreak(tdGames)

  if (tdStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position: "WR",
      streakType: "hot", category: "Touchdowns",
      statLabel: "Rec TD Streak",
      streakDescription: `Rec TD in ${tdStreak} straight games`,
      recentGames: tdGames, currentStreak: tdStreak,
      statValue: `${tdStreak}G`, seasonAvg: avgLabel,
    })
  }

  // 4. Cold: below 50% of season avg rec yards for 3+ of last 5
  if (avgRecYds >= 40) {
    const last5 = last8.slice(-5)
    const belowLineGames = last5.map((g) => (g.stats.receivingYards ?? 0) < avgRecYds * 0.5)
    const belowCount = belowLineGames.filter(Boolean).length

    if (belowCount >= 3) {
      const recentAvg = last5.reduce((s, g) => s + (g.stats.receivingYards ?? 0), 0) / last5.length
      streaks.push({
        playerId, playerName, team, position: "WR",
        streakType: "cold", category: "Receiving",
        statLabel: "Rec YPG L5",
        streakDescription: `Under ${Math.round(avgRecYds * 0.5)} rec yards in ${belowCount} of last 5`,
        recentGames: belowLineGames, currentStreak: belowCount,
        statValue: recentAvg.toFixed(1), seasonAvg: avgLabel,
      })
    }
  }

  // 5. Cold: TD drought (0 receiving TDs in 5+ straight)
  const noTDGames = last8.map((g) => (g.stats.receivingTouchdowns ?? 0) === 0)
  const tdDrought = calcStreak(noTDGames)

  if (tdDrought >= 5) {
    streaks.push({
      playerId, playerName, team, position: "WR",
      streakType: "cold", category: "Touchdowns",
      statLabel: "TD Drought",
      streakDescription: `0 receiving TDs in ${tdDrought} straight games`,
      recentGames: noTDGames, currentStreak: tdDrought,
      statValue: `${tdDrought}G`, seasonAvg: avgLabel,
    })
  }

  // ── Consistency: Rec yards thresholds (2/3 games — NFL has few games) ──
  const last3Rec = last8.slice(-3)
  const recYdThresholds = [
    { line: 49.5, minAvg: 40 },
    { line: 59.5, minAvg: 50 },
    { line: 74.5, minAvg: 60 },
    { line: 99.5, minAvg: 80 },
  ]
  for (const { line, minAvg } of recYdThresholds) {
    if (avgRecYds >= minAvg) {
      const overGames = last3Rec.map((g) => (g.stats.receivingYards ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "WR",
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} Rec YDS`,
          streakDescription: `Over ${line} rec yards in ${overCount} of last ${last3Rec.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last3Rec.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Rec YDS", hitRate: `${overCount}/${last3Rec.length}`, hitPct: overCount / last3Rec.length },
        })
      }
      const underGames = last3Rec.map((g) => (g.stats.receivingYards ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "WR",
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} Rec YDS`,
          streakDescription: `Under ${line} rec yards in ${underCount} of last ${last3Rec.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last3Rec.length}`, seasonAvg: avgLabel,
          threshold: { line, stat: "Rec YDS", hitRate: `${underCount}/${last3Rec.length}`, hitPct: underCount / last3Rec.length },
        })
      }
    }
  }

  // ── Consistency: Receptions thresholds (2/3 games) ──
  const avgRec = seasonAvg(gameLogs, "receptions")
  const recThresholds = [
    { line: 3.5, minAvg: 3 },
    { line: 4.5, minAvg: 4 },
    { line: 5.5, minAvg: 5 },
  ]
  for (const { line, minAvg } of recThresholds) {
    if (avgRec >= minAvg) {
      const overGames = last3Rec.map((g) => (g.stats.receptions ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 2) {
        streaks.push({
          playerId, playerName, team, position: "WR",
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} REC`,
          streakDescription: `Over ${line} receptions in ${overCount} of last ${last3Rec.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last3Rec.length}`, seasonAvg: `${avgRec.toFixed(1)} REC/G`,
          threshold: { line, stat: "REC", hitRate: `${overCount}/${last3Rec.length}`, hitPct: overCount / last3Rec.length },
        })
      }
    }
  }

  return streaks
}

/* ── Main Export ── */

export async function getNFLStreakTrends(): Promise<Trend[]> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders",
      { next: { revalidate: 43200 } }
    )
    if (!res.ok) {
      console.error(`[NFL Streaks] Leaders endpoint returned ${res.status}`)
      return []
    }
    const data = await res.json()
    const categories = (data.leaders?.categories ?? []) as Array<{
      name: string
      leaders: Array<{ athlete: { id: string; displayName: string }; team: { abbreviation: string } }>
    }>

    const passingCat = categories.find((c) => c.name === "passingYards")
    const rushingCat = categories.find((c) => c.name === "rushingYards")
    const receivingCat = categories.find((c) => c.name === "receivingYards")

    const topQBs = (passingCat?.leaders ?? []).slice(0, 15)
    const topRBs = (rushingCat?.leaders ?? []).slice(0, 15)
    const topWRs = (receivingCat?.leaders ?? []).slice(0, 15)

    console.log(`[NFL Streaks] Scanning ${topQBs.length} QBs, ${topRBs.length} RBs, ${topWRs.length} WRs`)

    const allStreaks: StreakResult[] = []
    const BATCH = 10

    // Process QBs
    for (let i = 0; i < topQBs.length; i += BATCH) {
      const batch = topQBs.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async (leader) => {
        try {
          const gameLogs = await getNFLPlayerGameLog(leader.athlete.id)
          if (gameLogs.length < 4) return []
          return detectPassingStreaks(leader.athlete.id, leader.athlete.displayName, leader.team?.abbreviation ?? "NFL", gameLogs)
        } catch { return [] }
      }))
      allStreaks.push(...results.flat())
    }

    // Process RBs
    for (let i = 0; i < topRBs.length; i += BATCH) {
      const batch = topRBs.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async (leader) => {
        try {
          const gameLogs = await getNFLPlayerGameLog(leader.athlete.id)
          if (gameLogs.length < 4) return []
          return detectRushingStreaks(leader.athlete.id, leader.athlete.displayName, leader.team?.abbreviation ?? "NFL", gameLogs)
        } catch { return [] }
      }))
      allStreaks.push(...results.flat())
    }

    // Process WRs
    for (let i = 0; i < topWRs.length; i += BATCH) {
      const batch = topWRs.slice(i, i + BATCH)
      const results = await Promise.all(batch.map(async (leader) => {
        try {
          const gameLogs = await getNFLPlayerGameLog(leader.athlete.id)
          if (gameLogs.length < 4) return []
          return detectReceivingStreaks(leader.athlete.id, leader.athlete.displayName, leader.team?.abbreviation ?? "NFL", gameLogs)
        } catch { return [] }
      }))
      allStreaks.push(...results.flat())
    }

    console.log(`[NFL Streaks] Found ${allStreaks.length} total streaks`)

    // Convert to Trend format
    const trends: Trend[] = allStreaks.map((streak, idx) => ({
      id: `nfl-streak-${idx}`,
      playerName: streak.playerName,
      team: streak.team,
      position: streak.position,
      type: streak.streakType,
      category: streak.category,
      headline: streak.streakDescription,
      detail: generateDetail(streak),
      streakLength: streak.currentStreak,
      streakLabel: "Recent games",
      recentGames: streak.recentGames,
      statValue: String(streak.statValue),
      statLabel: streak.statLabel,
      seasonAvg: streak.seasonAvg,
      threshold: streak.threshold,
    }))

    // Split: streaks vs consistency
    const streakTrends = trends.filter((t) => t.category !== "Consistency")
    const consistencyTrends = trends.filter((t) => t.category === "Consistency")

    const hotStreaks = streakTrends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldStreaks = streakTrends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)
    const hotConsistency = consistencyTrends.filter((t) => t.type === "hot").sort((a, b) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0) || b.streakLength - a.streakLength)
    const coldConsistency = consistencyTrends.filter((t) => t.type === "cold").sort((a, b) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0) || b.streakLength - a.streakLength)

    return [
      ...hotStreaks.slice(0, 25),
      ...coldStreaks.slice(0, 15),
      ...hotConsistency.slice(0, 20),
      ...coldConsistency.slice(0, 10),
    ]
  } catch (err) {
    console.error("[NFL Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  const avgNote = streak.seasonAvg ? ` Season avg: ${streak.seasonAvg}.` : ""

  if (streak.category === "Consistency") {
    const dir = streak.streakType === "hot" ? "over" : "under"
    return `Consistently going ${dir} this line. ${streak.streakDescription}.${avgNote}`
  }

  if (streak.streakType === "hot") {
    if (streak.category === "Passing") {
      return `Elite QB play with ${streak.streakDescription}. Offense clicking.${avgNote}`
    }
    if (streak.category === "Rushing") {
      return `Dominating on the ground. ${streak.streakDescription} demonstrates elite rushing.${avgNote}`
    }
    if (streak.category === "Receiving") {
      return `Top target with ${streak.streakDescription}. Consistent production.${avgNote}`
    }
    if (streak.category === "Touchdowns") {
      return `Finding the end zone consistently. ${streak.streakDescription}.${avgNote}`
    }
  }

  if (streak.streakType === "cold") {
    if (streak.category === "Passing") {
      return `Struggling from the pocket. ${streak.streakDescription}.${avgNote}`
    }
    if (streak.category === "Rushing") {
      return `Can't get it going on the ground. ${streak.streakDescription}.${avgNote}`
    }
    if (streak.category === "Receiving") {
      return `Quiet stretch for this receiver. ${streak.streakDescription}.${avgNote}`
    }
    if (streak.category === "Touchdowns") {
      return `Can't find the end zone. ${streak.streakDescription}.${avgNote}`
    }
  }

  return `Notable trend: ${streak.streakDescription}.${avgNote}`
}
