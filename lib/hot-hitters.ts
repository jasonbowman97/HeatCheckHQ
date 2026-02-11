/**
 * Hot Hitters Detection
 * Scans ALL active MLB batters (not just leaders) to find players on
 * active hitting streaks, XBH streaks, and HR streaks.
 */
import "server-only"

import { getAllMLBBatters, getPlayerGameLog, type RosterPlayer } from "./espn/mlb"

export interface HotHitter {
  id: string
  playerId: string
  playerName: string
  team: string
  position: string
  streakType: "hitting" | "xbh" | "hr"
  streakLength: number
  headline: string
  detail: string
  recentGames: boolean[]
  statValue: string
  statLabel: string
}

/**
 * Fetch all active MLB batters and analyze their game logs
 * for hitting streaks, XBH streaks, and HR streaks.
 * Uses concurrency limiting to avoid hammering the API.
 */
export async function getHotHitters(): Promise<HotHitter[]> {
  const allBatters = await getAllMLBBatters()

  if (allBatters.length === 0) {
    console.warn("[Hot Hitters] No batters found from rosters")
    return []
  }

  console.log(`[Hot Hitters] Scanning ${allBatters.length} batters for streaks...`)

  // Process batters in concurrent batches to avoid overwhelming the API
  const BATCH_SIZE = 15
  const allResults: HotHitter[] = []

  for (let i = 0; i < allBatters.length; i += BATCH_SIZE) {
    const batch = allBatters.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((batter) => analyzePlayerStreaks(batter))
    )
    allResults.push(...batchResults.flat())
  }

  // Sort each streak type by streak length (longest first)
  const hittingStreaks = allResults
    .filter((h) => h.streakType === "hitting")
    .sort((a, b) => b.streakLength - a.streakLength)
    .slice(0, 15)

  const xbhStreaks = allResults
    .filter((h) => h.streakType === "xbh")
    .sort((a, b) => b.streakLength - a.streakLength)
    .slice(0, 15)

  const hrStreaks = allResults
    .filter((h) => h.streakType === "hr")
    .sort((a, b) => b.streakLength - a.streakLength)
    .slice(0, 15)

  return [...hittingStreaks, ...xbhStreaks, ...hrStreaks]
}

async function analyzePlayerStreaks(batter: RosterPlayer): Promise<HotHitter[]> {
  try {
    const gameLogs = await getPlayerGameLog(batter.id)
    if (gameLogs.length < 3) return []

    const streaks: HotHitter[] = []
    // Use up to 20 most recent games (gameLogs come most-recent first)
    const recent = gameLogs.slice(0, 20)

    // --- 1. Active Hitting Streak (consecutive games with at least 1 hit) ---
    let hitStreak = 0
    for (const g of recent) {
      const hits = Number(g.stats.H || g.stats.h || g.stats.hits || 0)
      if (hits > 0) {
        hitStreak++
      } else {
        break
      }
    }

    if (hitStreak >= 5) {
      // Calculate avg over the streak
      let totalHits = 0
      let totalAB = 0
      for (let j = 0; j < hitStreak; j++) {
        totalHits += Number(recent[j].stats.H || recent[j].stats.h || recent[j].stats.hits || 0)
        totalAB += Number(recent[j].stats.AB || recent[j].stats.ab || recent[j].stats.atBats || 0)
      }
      const avg = totalAB > 0 ? (totalHits / totalAB).toFixed(3) : "---"

      streaks.push({
        id: `hit-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "hitting",
        streakLength: hitStreak,
        headline: `${hitStreak}-game hitting streak`,
        detail: `${totalHits}-for-${totalAB} (${avg}) across the streak with at least one hit in every game.`,
        recentGames: recent.slice(0, Math.min(10, hitStreak + 2)).map((g) => {
          const hits = Number(g.stats.H || g.stats.h || g.stats.hits || 0)
          return hits > 0
        }),
        statValue: avg,
        statLabel: `AVG L${hitStreak}`,
      })
    }

    // --- 2. Active XBH Streak (consecutive games with an extra-base hit) ---
    let xbhStreak = 0
    for (const g of recent) {
      const doubles = Number(g.stats["2B"] || g.stats["2b"] || g.stats.doubles || 0)
      const triples = Number(g.stats["3B"] || g.stats["3b"] || g.stats.triples || 0)
      const hrs = Number(g.stats.HR || g.stats.hr || g.stats.homeRuns || 0)
      if (doubles + triples + hrs > 0) {
        xbhStreak++
      } else {
        break
      }
    }

    if (xbhStreak >= 3) {
      let totalXBH = 0
      for (let j = 0; j < xbhStreak; j++) {
        const d = Number(recent[j].stats["2B"] || recent[j].stats["2b"] || recent[j].stats.doubles || 0)
        const t = Number(recent[j].stats["3B"] || recent[j].stats["3b"] || recent[j].stats.triples || 0)
        const h = Number(recent[j].stats.HR || recent[j].stats.hr || recent[j].stats.homeRuns || 0)
        totalXBH += d + t + h
      }

      streaks.push({
        id: `xbh-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "xbh",
        streakLength: xbhStreak,
        headline: `XBH in ${xbhStreak} straight games`,
        detail: `${totalXBH} extra-base hits across ${xbhStreak} consecutive games. Recording at least one double, triple, or homer each game.`,
        recentGames: recent.slice(0, Math.min(10, xbhStreak + 2)).map((g) => {
          const d = Number(g.stats["2B"] || g.stats["2b"] || g.stats.doubles || 0)
          const t = Number(g.stats["3B"] || g.stats["3b"] || g.stats.triples || 0)
          const h = Number(g.stats.HR || g.stats.hr || g.stats.homeRuns || 0)
          return (d + t + h) > 0
        }),
        statValue: `${totalXBH} XBH`,
        statLabel: `Last ${xbhStreak} gms`,
      })
    }

    // --- 3. Active HR Streak (consecutive games with a home run) ---
    let hrStreak = 0
    for (const g of recent) {
      const hrs = Number(g.stats.HR || g.stats.hr || g.stats.homeRuns || 0)
      if (hrs > 0) {
        hrStreak++
      } else {
        break
      }
    }

    if (hrStreak >= 2) {
      let totalHR = 0
      for (let j = 0; j < hrStreak; j++) {
        totalHR += Number(recent[j].stats.HR || recent[j].stats.hr || recent[j].stats.homeRuns || 0)
      }

      streaks.push({
        id: `hr-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "hr",
        streakLength: hrStreak,
        headline: `HR in ${hrStreak} straight games`,
        detail: `${totalHR} home runs across ${hrStreak} consecutive games. On a power surge at the plate.`,
        recentGames: recent.slice(0, Math.min(10, hrStreak + 2)).map((g) => {
          const hrs = Number(g.stats.HR || g.stats.hr || g.stats.homeRuns || 0)
          return hrs > 0
        }),
        statValue: `${totalHR} HR`,
        statLabel: `Last ${hrStreak} gms`,
      })
    }

    return streaks
  } catch {
    return []
  }
}
