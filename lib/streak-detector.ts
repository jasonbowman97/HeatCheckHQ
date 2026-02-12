/**
 * Streak Detection Module
 * Identifies players on active hot/cold streaks across multiple stats.
 * Covers all major prop-bet categories: hits, multi-hit, XBH, HR, RBI,
 * runs scored, walks/OBP, stolen bases, strikeout-prone (batters),
 * quality starts, low-run games, K dominance, WHIP, struggling (pitchers).
 */

export interface GameLogStat {
  date: string
  opponent: string
  stats: Record<string, string | number>
}

export interface StreakResult {
  playerId: string
  playerName: string
  team: string
  position: string
  streakType: "hot" | "cold"
  category: string
  statLabel: string
  streakDescription: string
  recentGames: boolean[]
  currentStreak: number
  statValue: string | number
  seasonAvg?: string
}

/**
 * Detect hitting streaks from game logs.
 * Covers: hits, multi-hit, XBH, HR, RBI, runs, walks/on-base, SB, strikeout-prone.
 */
export function detectHittingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: GameLogStat[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last10 = gameLogs.slice(0, 10).reverse() // oldest to newest
  if (last10.length < 5) return streaks

  // Helper
  const num = (g: GameLogStat, ...keys: string[]) => {
    for (const k of keys) {
      const v = g.stats[k]
      if (v !== undefined) return Number(v)
    }
    return 0
  }

  // 1. Hit in X of last 10 games (lowered: 7+ hot, 3- cold)
  const gamesWithHit = last10.map((g) => num(g, "H", "h", "hits") > 0)
  const hitCount = gamesWithHit.filter(Boolean).length

  if (hitCount >= 7) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Hitting",
      statLabel: "Games with Hit",
      streakDescription: `${hitCount} hits in last ${last10.length} games`,
      recentGames: gamesWithHit,
      currentStreak: calcStreak(gamesWithHit),
      statValue: `${hitCount}/${last10.length}`,
    })
  } else if (hitCount <= 3 && last10.length >= 7) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "cold",
      category: "Hitting",
      statLabel: "Games with Hit",
      streakDescription: `Only ${hitCount} hits in last ${last10.length} games`,
      recentGames: gamesWithHit,
      currentStreak: calcColdStreak(gamesWithHit),
      statValue: `${hitCount}/${last10.length}`,
    })
  }

  // 2. Multi-hit games (2+ hits per game) — lowered: 4+ of 10
  const multiHitGames = last10.map((g) => num(g, "H", "h", "hits") >= 2)
  const multiHitCount = multiHitGames.filter(Boolean).length

  if (multiHitCount >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Multi-Hit",
      statLabel: "Multi-Hit Games",
      streakDescription: `${multiHitCount} multi-hit games in last ${last10.length}`,
      recentGames: multiHitGames,
      currentStreak: calcStreak(multiHitGames),
      statValue: `${multiHitCount}/${last10.length}`,
    })
  }

  // 3. Extra-base hits (2B, 3B, HR) — lowered: 5+ of 10
  const xbhGames = last10.map((g) => {
    const d = num(g, "2B", "2b", "doubles")
    const t = num(g, "3B", "3b", "triples")
    const hr = num(g, "HR", "hr", "homeRuns")
    return (d + t + hr) > 0
  })
  const xbhCount = xbhGames.filter(Boolean).length

  if (xbhCount >= 5) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Power",
      statLabel: "XBH Games",
      streakDescription: `${xbhCount} XBH in last ${last10.length} games`,
      recentGames: xbhGames,
      currentStreak: calcStreak(xbhGames),
      statValue: `${xbhCount}/${last10.length}`,
    })
  }

  // 4. Home run streak (3+ consecutive games with HR)
  const hrGames = last10.map((g) => num(g, "HR", "hr", "homeRuns") > 0)
  const currentHRStreak = calcStreak(hrGames)

  if (currentHRStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Power",
      statLabel: "HR Streak",
      streakDescription: `HR in ${currentHRStreak} straight games`,
      recentGames: hrGames,
      currentStreak: currentHRStreak,
      statValue: `${currentHRStreak}G`,
    })
  }

  // 5. RBI streak — 6+ of last 10 games with 1+ RBI
  const rbiGames = last10.map((g) => num(g, "RBI", "rbi") > 0)
  const rbiCount = rbiGames.filter(Boolean).length

  if (rbiCount >= 6) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "RBI",
      statLabel: "Games with RBI",
      streakDescription: `RBI in ${rbiCount} of last ${last10.length} games`,
      recentGames: rbiGames,
      currentStreak: calcStreak(rbiGames),
      statValue: `${rbiCount}/${last10.length}`,
    })
  }

  // 6. Runs scored — 6+ of last 10 games scoring a run
  const runsGames = last10.map((g) => num(g, "R", "r", "runs") > 0)
  const runsCount = runsGames.filter(Boolean).length

  if (runsCount >= 6) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Runs",
      statLabel: "Games Scoring",
      streakDescription: `Scored in ${runsCount} of last ${last10.length} games`,
      recentGames: runsGames,
      currentStreak: calcStreak(runsGames),
      statValue: `${runsCount}/${last10.length}`,
    })
  }

  // 7. Walks / On-Base — 7+ of last 10 games reaching base (H or BB)
  const obGames = last10.map((g) => {
    const h = num(g, "H", "h", "hits")
    const bb = num(g, "BB", "bb", "baseOnBalls")
    const hbp = num(g, "HBP", "hbp", "hitByPitch")
    return (h + bb + hbp) > 0
  })
  const obCount = obGames.filter(Boolean).length

  if (obCount >= 8) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "On Base",
      statLabel: "Reached Base",
      streakDescription: `On base in ${obCount} of last ${last10.length} games`,
      recentGames: obGames,
      currentStreak: calcStreak(obGames),
      statValue: `${obCount}/${last10.length}`,
    })
  }

  // 8. Stolen bases — 3+ consecutive games with SB
  const sbGames = last10.map((g) => num(g, "SB", "sb", "stolenBases") > 0)
  const sbStreak = calcStreak(sbGames)

  if (sbStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Stolen Bases",
      statLabel: "SB Streak",
      streakDescription: `SB in ${sbStreak} straight games`,
      recentGames: sbGames,
      currentStreak: sbStreak,
      statValue: `${sbStreak}G`,
    })
  }

  // 9. Strikeout-prone (cold) — 7+ of last 10 with a K and no hit
  const kNoHitGames = last10.map((g) => {
    const so = num(g, "SO", "so", "strikeOuts", "K")
    const h = num(g, "H", "h", "hits")
    return so > 0 && h === 0
  })
  const kNoHitCount = kNoHitGames.filter(Boolean).length

  if (kNoHitCount >= 5) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "cold",
      category: "Strikeouts",
      statLabel: "K w/o Hit",
      streakDescription: `Struck out without a hit in ${kNoHitCount} of last ${last10.length}`,
      recentGames: kNoHitGames,
      currentStreak: calcStreak(kNoHitGames),
      statValue: `${kNoHitCount}/${last10.length}`,
    })
  }

  return streaks
}

/**
 * Detect pitching streaks from game logs.
 * Covers: quality starts, low-run, strikeout dominance, WHIP, struggling.
 */
export function detectPitchingStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: GameLogStat[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last8 = gameLogs.slice(0, 8).reverse()
  if (last8.length < 3) return streaks

  const num = (g: GameLogStat, ...keys: string[]) => {
    for (const k of keys) {
      const v = g.stats[k]
      if (v !== undefined) return Number(v)
    }
    return 0
  }

  // 1. Quality starts (6+ IP, ≤3 ER) — 3+ consecutive
  const qualityStarts = last8.map((g) => {
    const ip = num(g, "IP", "ip", "inningsPitched")
    const er = num(g, "ER", "er", "earnedRuns")
    return ip >= 6 && er <= 3
  })
  const currentQSStreak = calcStreak(qualityStarts)

  if (currentQSStreak >= 3) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Pitching",
      statLabel: "Quality Starts",
      streakDescription: `${currentQSStreak} straight quality starts`,
      recentGames: qualityStarts,
      currentStreak: currentQSStreak,
      statValue: `${currentQSStreak}G`,
    })
  }

  // 2. Low-run games (≤2 runs allowed) — 4+ of last 8 (lowered from 5)
  const lowRunGames = last8.map((g) => {
    const r = num(g, "R", "r", "runs")
    const er = num(g, "ER", "er", "earnedRuns")
    return Math.max(r, er) <= 2
  })
  const lowRunCount = lowRunGames.filter(Boolean).length

  if (lowRunCount >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Pitching",
      statLabel: "Low-Run Games",
      streakDescription: `${lowRunCount} games with ≤2 runs in last ${last8.length}`,
      recentGames: lowRunGames,
      currentStreak: calcStreak(lowRunGames),
      statValue: `${lowRunCount}/${last8.length}`,
    })
  }

  // 3. Strikeout dominance (7+ K per game) — 3+ of last 8 (lowered from 4)
  const kGames = last8.map((g) => num(g, "SO", "so", "strikeOuts", "K") >= 7)
  const kCount = kGames.filter(Boolean).length

  if (kCount >= 3) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Strikeouts",
      statLabel: "7+ K Games",
      streakDescription: `${kCount} games with 7+ strikeouts in last ${last8.length}`,
      recentGames: kGames,
      currentStreak: calcStreak(kGames),
      statValue: `${kCount}/${last8.length}`,
    })
  }

  // 4. WHIP dominance — 4+ of last 8 with WHIP ≤ 1.00
  const whipGames = last8.map((g) => {
    const ip = num(g, "IP", "ip", "inningsPitched")
    const h = num(g, "H", "h", "hits")
    const bb = num(g, "BB", "bb", "baseOnBalls")
    if (ip === 0) return false
    return (h + bb) / ip <= 1.0
  })
  const whipCount = whipGames.filter(Boolean).length

  if (whipCount >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot",
      category: "Pitching",
      statLabel: "Low WHIP",
      streakDescription: `WHIP ≤ 1.00 in ${whipCount} of last ${last8.length} starts`,
      recentGames: whipGames,
      currentStreak: calcStreak(whipGames),
      statValue: `${whipCount}/${last8.length}`,
    })
  }

  // 5. Struggling (4+ runs allowed) — 3+ consecutive OR 5+ of 8
  const badGames = last8.map((g) => {
    const r = num(g, "R", "r", "runs")
    const er = num(g, "ER", "er", "earnedRuns")
    return Math.max(r, er) >= 4
  })
  const currentBadStreak = calcStreak(badGames)
  const badCount = badGames.filter(Boolean).length

  if (currentBadStreak >= 3 || badCount >= 5) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "cold",
      category: "Pitching",
      statLabel: "High Runs",
      streakDescription: currentBadStreak >= 3
        ? `${currentBadStreak} straight games allowing 4+ runs`
        : `Allowed 4+ runs in ${badCount} of last ${last8.length} starts`,
      recentGames: badGames,
      currentStreak: currentBadStreak >= 3 ? currentBadStreak : badCount,
      statValue: currentBadStreak >= 3 ? `${currentBadStreak}G` : `${badCount}/${last8.length}`,
    })
  }

  return streaks
}

/** Count consecutive true from end */
function calcStreak(games: boolean[]): number {
  let s = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) s++
    else break
  }
  return s
}

/** Count consecutive false from end */
function calcColdStreak(games: boolean[]): number {
  let s = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (!games[i]) s++
    else break
  }
  return s
}
