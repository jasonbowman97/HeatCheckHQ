/**
 * Hot Hitters Detection
 * Scans ALL active MLB batters (not just leaders) to find players on
 * active streaks: hitting, multi-hit, XBH, HR, RBI, runs, SB, total bases,
 * on-base, and cold (hitless) streaks.
 */
import "server-only"

import { getAllMLBBatters, getPlayerGameLog, type RosterPlayer } from "./espn/mlb"

export type StreakType =
  | "hitting"
  | "multi-hit"
  | "xbh"
  | "hr"
  | "rbi"
  | "runs"
  | "sb"
  | "total-bases"
  | "on-base"
  | "cold"

export interface HotHitter {
  id: string
  playerId: string
  playerName: string
  team: string
  position: string
  streakType: StreakType
  streakLength: number
  headline: string
  detail: string
  recentGames: boolean[]
  statValue: string
  statLabel: string
  /** Batting average during the streak period (for context on power streaks) */
  avgDuringStreak?: string
}

// Helper to read a stat from game log with multiple possible key names
function getStat(stats: Record<string, string | number>, ...keys: string[]): number {
  for (const k of keys) {
    if (stats[k] !== undefined) return Number(stats[k]) || 0
  }
  return 0
}

/**
 * Fetch all active MLB batters and analyze their game logs
 * for all streak types. Uses concurrency limiting to avoid hammering the API.
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

  console.log(`[Hot Hitters] Found ${allResults.length} total streaks across all types`)

  // Sort each streak type by streak length (longest first), take top 15 each
  const categories: StreakType[] = [
    "hitting", "multi-hit", "xbh", "hr", "rbi", "runs", "sb", "total-bases", "on-base", "cold",
  ]

  const sorted: HotHitter[] = []
  for (const cat of categories) {
    const catStreaks = allResults
      .filter((h) => h.streakType === cat)
      .sort((a, b) => b.streakLength - a.streakLength)
      .slice(0, 15)
    sorted.push(...catStreaks)
  }

  return sorted
}

async function analyzePlayerStreaks(batter: RosterPlayer): Promise<HotHitter[]> {
  try {
    const gameLogs = await getPlayerGameLog(batter.id)
    if (gameLogs.length < 3) return []

    const streaks: HotHitter[] = []
    // Use up to 20 most recent games (gameLogs come most-recent first)
    const recent = gameLogs.slice(0, 20)

    // Helper: calculate batting average over N most recent games
    function calcAvg(count: number): string {
      let h = 0, ab = 0
      for (let j = 0; j < Math.min(count, recent.length); j++) {
        h += getStat(recent[j].stats, "H", "h", "hits")
        ab += getStat(recent[j].stats, "AB", "ab", "atBats")
      }
      return ab > 0 ? (h / ab).toFixed(3) : "---"
    }

    // Helper: build recent game dots (up to 10, includes streak + 2 extra)
    function buildRecentDots(streakLen: number, testFn: (g: typeof recent[0]) => boolean): boolean[] {
      return recent.slice(0, Math.min(10, streakLen + 2)).map(testFn)
    }

    // --- 1. Active Hitting Streak (consecutive games with at least 1 hit) ---
    let hitStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "H", "h", "hits") > 0) hitStreak++
      else break
    }

    if (hitStreak >= 5) {
      let totalHits = 0, totalAB = 0
      for (let j = 0; j < hitStreak; j++) {
        totalHits += getStat(recent[j].stats, "H", "h", "hits")
        totalAB += getStat(recent[j].stats, "AB", "ab", "atBats")
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
        recentGames: buildRecentDots(hitStreak, (g) => getStat(g.stats, "H", "h", "hits") > 0),
        statValue: avg,
        statLabel: `AVG L${hitStreak}`,
      })
    }

    // --- 2. Multi-Hit Streak (consecutive games with 2+ hits) ---
    let multiHitStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "H", "h", "hits") >= 2) multiHitStreak++
      else break
    }

    if (multiHitStreak >= 3) {
      let totalHits = 0, totalAB = 0
      for (let j = 0; j < multiHitStreak; j++) {
        totalHits += getStat(recent[j].stats, "H", "h", "hits")
        totalAB += getStat(recent[j].stats, "AB", "ab", "atBats")
      }
      const avg = totalAB > 0 ? (totalHits / totalAB).toFixed(3) : "---"

      streaks.push({
        id: `mh-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "multi-hit",
        streakLength: multiHitStreak,
        headline: `${multiHitStreak} straight multi-hit games`,
        detail: `${totalHits}-for-${totalAB} (${avg}) with 2+ hits in each of the last ${multiHitStreak} games.`,
        recentGames: buildRecentDots(multiHitStreak, (g) => getStat(g.stats, "H", "h", "hits") >= 2),
        statValue: avg,
        statLabel: `AVG L${multiHitStreak}`,
      })
    }

    // --- 3. Active XBH Streak (consecutive games with an extra-base hit) ---
    let xbhStreak = 0
    for (const g of recent) {
      const xbh = getStat(g.stats, "2B", "2b", "doubles") +
                   getStat(g.stats, "3B", "3b", "triples") +
                   getStat(g.stats, "HR", "hr", "homeRuns")
      if (xbh > 0) xbhStreak++
      else break
    }

    if (xbhStreak >= 3) {
      let totalXBH = 0
      for (let j = 0; j < xbhStreak; j++) {
        totalXBH += getStat(recent[j].stats, "2B", "2b", "doubles") +
                    getStat(recent[j].stats, "3B", "3b", "triples") +
                    getStat(recent[j].stats, "HR", "hr", "homeRuns")
      }
      const avg = calcAvg(xbhStreak)

      streaks.push({
        id: `xbh-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "xbh",
        streakLength: xbhStreak,
        headline: `XBH in ${xbhStreak} straight games`,
        detail: `${totalXBH} extra-base hits across ${xbhStreak} consecutive games. Batting ${avg} over that span.`,
        recentGames: buildRecentDots(xbhStreak, (g) => {
          return (getStat(g.stats, "2B", "2b", "doubles") +
                  getStat(g.stats, "3B", "3b", "triples") +
                  getStat(g.stats, "HR", "hr", "homeRuns")) > 0
        }),
        statValue: `${totalXBH} XBH`,
        statLabel: `Last ${xbhStreak} gms`,
        avgDuringStreak: avg,
      })
    }

    // --- 4. Active HR Streak (consecutive games with a home run) ---
    let hrStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "HR", "hr", "homeRuns") > 0) hrStreak++
      else break
    }

    if (hrStreak >= 2) {
      let totalHR = 0
      for (let j = 0; j < hrStreak; j++) {
        totalHR += getStat(recent[j].stats, "HR", "hr", "homeRuns")
      }
      const avg = calcAvg(hrStreak)

      streaks.push({
        id: `hr-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "hr",
        streakLength: hrStreak,
        headline: `HR in ${hrStreak} straight games`,
        detail: `${totalHR} home runs across ${hrStreak} consecutive games. Batting ${avg} over that span.`,
        recentGames: buildRecentDots(hrStreak, (g) => getStat(g.stats, "HR", "hr", "homeRuns") > 0),
        statValue: `${totalHR} HR`,
        statLabel: `Last ${hrStreak} gms`,
        avgDuringStreak: avg,
      })
    }

    // --- 5. Active RBI Streak (consecutive games with 1+ RBI) ---
    let rbiStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "RBI", "rbi") > 0) rbiStreak++
      else break
    }

    if (rbiStreak >= 4) {
      let totalRBI = 0
      for (let j = 0; j < rbiStreak; j++) {
        totalRBI += getStat(recent[j].stats, "RBI", "rbi")
      }

      streaks.push({
        id: `rbi-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "rbi",
        streakLength: rbiStreak,
        headline: `RBI in ${rbiStreak} straight games`,
        detail: `${totalRBI} RBI across ${rbiStreak} consecutive games. Consistently driving in runs.`,
        recentGames: buildRecentDots(rbiStreak, (g) => getStat(g.stats, "RBI", "rbi") > 0),
        statValue: `${totalRBI} RBI`,
        statLabel: `Last ${rbiStreak} gms`,
      })
    }

    // --- 6. Active Runs Scored Streak (consecutive games scoring 1+ run) ---
    let runsStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "R", "r", "runs") > 0) runsStreak++
      else break
    }

    if (runsStreak >= 5) {
      let totalRuns = 0
      for (let j = 0; j < runsStreak; j++) {
        totalRuns += getStat(recent[j].stats, "R", "r", "runs")
      }

      streaks.push({
        id: `runs-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "runs",
        streakLength: runsStreak,
        headline: `Scored in ${runsStreak} straight games`,
        detail: `${totalRuns} runs scored across ${runsStreak} consecutive games. Getting on and coming around.`,
        recentGames: buildRecentDots(runsStreak, (g) => getStat(g.stats, "R", "r", "runs") > 0),
        statValue: `${totalRuns} R`,
        statLabel: `Last ${runsStreak} gms`,
      })
    }

    // --- 7. Active Stolen Base Streak (consecutive games with 1+ SB) ---
    let sbStreak = 0
    for (const g of recent) {
      if (getStat(g.stats, "SB", "sb", "stolenBases") > 0) sbStreak++
      else break
    }

    if (sbStreak >= 3) {
      let totalSB = 0
      for (let j = 0; j < sbStreak; j++) {
        totalSB += getStat(recent[j].stats, "SB", "sb", "stolenBases")
      }

      streaks.push({
        id: `sb-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "sb",
        streakLength: sbStreak,
        headline: `SB in ${sbStreak} straight games`,
        detail: `${totalSB} stolen bases across ${sbStreak} consecutive games. Elite speed threat on the bases.`,
        recentGames: buildRecentDots(sbStreak, (g) => getStat(g.stats, "SB", "sb", "stolenBases") > 0),
        statValue: `${totalSB} SB`,
        statLabel: `Last ${sbStreak} gms`,
      })
    }

    // --- 8. Active Total Bases Streak (consecutive games with 2+ TB) ---
    function calcTB(g: typeof recent[0]): number {
      const h = getStat(g.stats, "H", "h", "hits")
      const d = getStat(g.stats, "2B", "2b", "doubles")
      const t = getStat(g.stats, "3B", "3b", "triples")
      const hr = getStat(g.stats, "HR", "hr", "homeRuns")
      // Singles = H - 2B - 3B - HR, TB = 1B + 2*2B + 3*3B + 4*HR
      const singles = h - d - t - hr
      return singles + (2 * d) + (3 * t) + (4 * hr)
    }

    let tbStreak = 0
    for (const g of recent) {
      if (calcTB(g) >= 2) tbStreak++
      else break
    }

    if (tbStreak >= 5) {
      let totalTB = 0
      for (let j = 0; j < tbStreak; j++) {
        totalTB += calcTB(recent[j])
      }
      const tbPerGame = (totalTB / tbStreak).toFixed(1)

      streaks.push({
        id: `tb-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "total-bases",
        streakLength: tbStreak,
        headline: `2+ TB in ${tbStreak} straight games`,
        detail: `${totalTB} total bases (${tbPerGame}/gm) across ${tbStreak} consecutive games. Consistent power production.`,
        recentGames: buildRecentDots(tbStreak, (g) => calcTB(g) >= 2),
        statValue: `${totalTB} TB`,
        statLabel: `${tbPerGame} TB/gm`,
      })
    }

    // --- 9. Active On-Base Streak (consecutive games reaching base via H or BB) ---
    let obStreak = 0
    for (const g of recent) {
      const hits = getStat(g.stats, "H", "h", "hits")
      const walks = getStat(g.stats, "BB", "bb", "baseOnBalls")
      const hbp = getStat(g.stats, "HBP", "hbp")
      if (hits + walks + hbp > 0) obStreak++
      else break
    }

    if (obStreak >= 10) {
      // Calculate OBP over the streak
      let h = 0, bb = 0, hbp = 0, ab = 0, sf = 0
      for (let j = 0; j < obStreak; j++) {
        h += getStat(recent[j].stats, "H", "h", "hits")
        bb += getStat(recent[j].stats, "BB", "bb", "baseOnBalls")
        hbp += getStat(recent[j].stats, "HBP", "hbp")
        ab += getStat(recent[j].stats, "AB", "ab", "atBats")
        sf += getStat(recent[j].stats, "SF", "sf")
      }
      const denom = ab + bb + hbp + sf
      const obp = denom > 0 ? ((h + bb + hbp) / denom).toFixed(3) : "---"

      streaks.push({
        id: `ob-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "on-base",
        streakLength: obStreak,
        headline: `Reached base in ${obStreak} straight games`,
        detail: `On-base in every game with a ${obp} OBP over the last ${obStreak} games.`,
        recentGames: buildRecentDots(obStreak, (g) => {
          return (getStat(g.stats, "H", "h", "hits") + getStat(g.stats, "BB", "bb", "baseOnBalls") + getStat(g.stats, "HBP", "hbp")) > 0
        }),
        statValue: obp,
        statLabel: `OBP L${obStreak}`,
      })
    }

    // --- 10. Cold Streak (consecutive games without a hit) ---
    let coldStreak = 0
    for (const g of recent) {
      const hits = getStat(g.stats, "H", "h", "hits")
      const ab = getStat(g.stats, "AB", "ab", "atBats")
      // Only count games where they had at-bats (skip pinch-run appearances etc.)
      if (ab > 0 && hits === 0) coldStreak++
      else break
    }

    if (coldStreak >= 4) {
      // Calculate 0-for-X over the cold streak
      let totalAB = 0
      for (let j = 0; j < coldStreak; j++) {
        totalAB += getStat(recent[j].stats, "AB", "ab", "atBats")
      }
      const kDuringStreak = recent.slice(0, coldStreak).reduce(
        (sum, g) => sum + getStat(g.stats, "SO", "so", "strikeOuts"), 0
      )

      streaks.push({
        id: `cold-${batter.id}`,
        playerId: batter.id,
        playerName: batter.name,
        team: batter.team,
        position: batter.position,
        streakType: "cold",
        streakLength: coldStreak,
        headline: `0-for-last-${totalAB} (${coldStreak} games)`,
        detail: `Hitless in ${coldStreak} straight games (0-for-${totalAB}) with ${kDuringStreak} strikeouts. Deep slump.`,
        recentGames: buildRecentDots(coldStreak, (g) => getStat(g.stats, "H", "h", "hits") > 0),
        statValue: `0/${totalAB}`,
        statLabel: `${coldStreak} gms`,
      })
    }

    return streaks
  } catch {
    return []
  }
}
