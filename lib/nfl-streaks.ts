/**
 * NFL Streak Detection
 * Fetches player leaders and analyzes their game logs to find active streaks.
 */
import "server-only"

import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"
import type { GameLogEntry } from "./espn/mlb"

const NFL_WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl"

/** Fetch NFL player game log from the correct NFL endpoint */
async function getNFLPlayerGameLog(athleteId: string): Promise<GameLogEntry[]> {
  try {
    const res = await fetch(`${NFL_WEB_BASE}/athletes/${athleteId}/gamelog`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 43200 },
    })
    if (!res.ok) return []
    const raw = await res.json()

    const seasonTypes = raw.seasonTypes as Array<Record<string, unknown>> | undefined
    if (!seasonTypes?.length) return []

    const entries: GameLogEntry[] = []
    const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
    const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>
    if (!categories.length) return entries

    const cat = categories[0]
    const labels = (cat.labels ?? []) as string[]
    const events = (cat.events ?? []) as Array<Record<string, unknown>>

    for (const evt of events.slice(0, 20)) {
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
  } catch {
    return []
  }
}

/**
 * Detect NFL passing streaks from game logs
 */
function detectPassingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: Array<{ date: string; opponent: string; stats: Record<string, string | number> }>
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()

  // 1. 300+ yard passing games
  const bigPassingGames = last8.map((g) => {
    const yards = Number(g.stats.YDS || g.stats.passYds || 0)
    return yards >= 300
  })
  const bigPassingCount = bigPassingGames.filter(Boolean).length
  const currentPassStreak = calculateCurrentStreak(bigPassingGames)

  if (currentPassStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "QB",
      streakType: "hot",
      category: "Passing",
      statLabel: "300+ YD Games",
      streakDescription: `${currentPassStreak} straight games with 300+ pass yards`,
      recentGames: bigPassingGames,
      currentStreak: currentPassStreak,
      statValue: `${currentPassStreak}G`,
    })
  }

  // 2. 3+ passing TD games
  const tdGames = last8.map((g) => {
    const tds = Number(g.stats.TD || g.stats.passTD || 0)
    return tds >= 3
  })
  const tdCount = tdGames.filter(Boolean).length

  if (tdCount >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "QB",
      streakType: "hot",
      category: "Passing",
      statLabel: "3+ TD Games",
      streakDescription: `${tdCount} games with 3+ passing TDs in last ${last8.length}`,
      recentGames: tdGames,
      currentStreak: calculateCurrentStreak(tdGames),
      statValue: `${tdCount}/${last8.length}`,
    })
  }

  // 3. Low interception streak (0 INT)
  const cleanGames = last8.map((g) => {
    const ints = Number(g.stats.INT || g.stats.int || 0)
    return ints === 0
  })
  const cleanCount = cleanGames.filter(Boolean).length
  const currentCleanStreak = calculateCurrentStreak(cleanGames)

  if (currentCleanStreak >= 4) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "QB",
      streakType: "hot",
      category: "Efficiency",
      statLabel: "Turnover-Free",
      streakDescription: `${currentCleanStreak} straight games without an INT`,
      recentGames: cleanGames,
      currentStreak: currentCleanStreak,
      statValue: `${currentCleanStreak}G`,
    })
  }

  return streaks
}

/**
 * Detect NFL rushing streaks from game logs
 */
function detectRushingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: Array<{ date: string; opponent: string; stats: Record<string, string | number> }>
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()

  // 1. 100+ yard rushing games
  const bigRushingGames = last8.map((g) => {
    const yards = Number(g.stats.YDS || g.stats.rushYds || 0)
    return yards >= 100
  })
  const bigRushingCount = bigRushingGames.filter(Boolean).length
  const currentRushStreak = calculateCurrentStreak(bigRushingGames)

  if (currentRushStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "RB",
      streakType: "hot",
      category: "Rushing",
      statLabel: "100+ YD Games",
      streakDescription: `${currentRushStreak} straight games with 100+ rush yards`,
      recentGames: bigRushingGames,
      currentStreak: currentRushStreak,
      statValue: `${currentRushStreak}G`,
    })
  }

  // 2. Rushing TD games
  const tdGames = last8.map((g) => {
    const tds = Number(g.stats.TD || g.stats.rushTD || 0)
    return tds >= 1
  })
  const tdCount = tdGames.filter(Boolean).length
  const currentTDStreak = calculateCurrentStreak(tdGames)

  if (currentTDStreak >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "RB",
      streakType: "hot",
      category: "Scoring",
      statLabel: "TD Streak",
      streakDescription: `TD in ${currentTDStreak} straight games`,
      recentGames: tdGames,
      currentStreak: currentTDStreak,
      statValue: `${currentTDStreak}G`,
    })
  }

  return streaks
}

/**
 * Detect NFL receiving streaks from game logs
 */
function detectReceivingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  gameLogs: Array<{ date: string; opponent: string; stats: Record<string, string | number> }>
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()

  // 1. 100+ yard receiving games
  const bigRecGames = last8.map((g) => {
    const yards = Number(g.stats.YDS || g.stats.recYds || 0)
    return yards >= 100
  })
  const bigRecCount = bigRecGames.filter(Boolean).length
  const currentRecStreak = calculateCurrentStreak(bigRecGames)

  if (currentRecStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "WR",
      streakType: "hot",
      category: "Receiving",
      statLabel: "100+ YD Games",
      streakDescription: `${currentRecStreak} straight games with 100+ rec yards`,
      recentGames: bigRecGames,
      currentStreak: currentRecStreak,
      statValue: `${currentRecStreak}G`,
    })
  }

  // 2. 8+ receptions games (target share)
  const catchGames = last8.map((g) => {
    const rec = Number(g.stats.REC || g.stats.rec || 0)
    return rec >= 8
  })
  const catchCount = catchGames.filter(Boolean).length

  if (catchCount >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "WR",
      streakType: "hot",
      category: "Volume",
      statLabel: "8+ REC Games",
      streakDescription: `${catchCount} games with 8+ receptions in last ${last8.length}`,
      recentGames: catchGames,
      currentStreak: calculateCurrentStreak(catchGames),
      statValue: `${catchCount}/${last8.length}`,
    })
  }

  // 3. Receiving TD games
  const tdGames = last8.map((g) => {
    const tds = Number(g.stats.TD || g.stats.recTD || 0)
    return tds >= 1
  })
  const tdCount = tdGames.filter(Boolean).length
  const currentTDStreak = calculateCurrentStreak(tdGames)

  if (currentTDStreak >= 4) {
    streaks.push({
      playerId,
      playerName,
      team,
      position: "WR",
      streakType: "hot",
      category: "Scoring",
      statLabel: "TD Streak",
      streakDescription: `TD in ${currentTDStreak} straight games`,
      recentGames: tdGames,
      currentStreak: currentTDStreak,
      statValue: `${currentTDStreak}G`,
    })
  }

  return streaks
}

function calculateCurrentStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Fetch NFL trends based on active player streaks
 */
export async function getNFLStreakTrends(): Promise<Trend[]> {
  try {
    // Dynamically fetch NFL leaders from ESPN v3
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v3/sports/football/nfl/leaders",
      { next: { revalidate: 43200 } }
    )
    if (!res.ok) {
      console.error(`[NFL Streaks] Leaders endpoint returned ${res.status}`)
      return []
    }
    const data = await res.json()
    // v3 structure: { leaders: { categories: [...] } }
    const categories = (data.leaders?.categories ?? []) as Array<{
      name: string
      leaders: Array<{ athlete: { id: string; displayName: string }; team: { abbreviation: string } }>
    }>

    // Extract top players by category
    const passingCat = categories.find((c) => c.name === "passingYards")
    const rushingCat = categories.find((c) => c.name === "rushingYards")
    const receivingCat = categories.find((c) => c.name === "receivingYards")

    // Scan top 15 per position (expanded from 5)
    const topQBs = (passingCat?.leaders ?? []).slice(0, 15)
    const topRBs = (rushingCat?.leaders ?? []).slice(0, 15)
    const topWRs = (receivingCat?.leaders ?? []).slice(0, 15)

    console.log(`[NFL Streaks] Scanning ${topQBs.length} QBs, ${topRBs.length} RBs, ${topWRs.length} WRs`)

    const allStreaks: StreakResult[] = []
    const BATCH = 10

    // Process QBs in batches
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

    // Process RBs in batches
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

    // Process WRs in batches
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
    }))

    // Sort hot first
    const hotTrends = trends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldTrends = trends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)

    return [...hotTrends.slice(0, 20), ...coldTrends.slice(0, 10)]
  } catch (err) {
    console.error("[NFL Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  if (streak.streakType === "hot") {
    if (streak.category === "Passing") {
      return `Elite QB play with ${streak.streakDescription}. Offense clicking.`
    }
    if (streak.category === "Efficiency") {
      return `Protecting the ball well. ${streak.streakDescription} shows smart decision-making.`
    }
    if (streak.category === "Rushing") {
      return `Dominating on the ground. ${streak.streakDescription} demonstrates elite rushing.`
    }
    if (streak.category === "Receiving") {
      return `Top target with ${streak.streakDescription}. Consistent production.`
    }
    if (streak.category === "Volume") {
      return `High target share. ${streak.streakDescription} shows trust from QB.`
    }
    if (streak.category === "Scoring") {
      return `Finding the end zone consistently. ${streak.streakDescription}.`
    }
  }
  return `Notable trend: ${streak.streakDescription}.`
}
