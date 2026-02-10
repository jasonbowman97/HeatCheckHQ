/**
 * Streak Detection Module
 * Identifies players on active hot/cold streaks across multiple stats.
 * Examples: "9 hits in last 10 games", "5 straight games with HR", etc.
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
  // Streak description: "9 hits in last 10 games" or "5 straight games with a HR"
  streakDescription: string
  // Recent games (true = success, false = fail)
  recentGames: boolean[]
  // Current streak length (consecutive games)
  currentStreak: number
  // Stat value for display
  statValue: string | number
}

/**
 * Detect hitting streaks from game logs
 * - Hit in X of last Y games
 * - Multi-hit games streak
 * - Extra-base hit streak
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

  // 1. Hit in X of last 10 games
  const gamesWithHit = last10.map((g) => {
    const hits = Number(g.stats.H || g.stats.h || 0)
    return hits > 0
  })
  const hitCount = gamesWithHit.filter(Boolean).length

  if (hitCount >= 8) {
    // Hot: 8+ hits in last 10 games
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Hitting",
      statLabel: "Games with Hit",
      streakDescription: `${hitCount} hits in last ${last10.length} games`,
      recentGames: gamesWithHit,
      currentStreak: calculateCurrentStreak(gamesWithHit),
      statValue: `${hitCount}/${last10.length}`,
    })
  } else if (hitCount <= 3 && last10.length >= 8) {
    // Cold: 3 or fewer hits in last 10 games
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "cold",
      category: "Hitting",
      statLabel: "Games with Hit",
      streakDescription: `Only ${hitCount} hits in last ${last10.length} games`,
      recentGames: gamesWithHit,
      currentStreak: calculateCurrentColdStreak(gamesWithHit),
      statValue: `${hitCount}/${last10.length}`,
    })
  }

  // 2. Multi-hit games (2+ hits per game)
  const multiHitGames = last10.map((g) => {
    const hits = Number(g.stats.H || g.stats.h || 0)
    return hits >= 2
  })
  const multiHitCount = multiHitGames.filter(Boolean).length

  if (multiHitCount >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Power Hitting",
      statLabel: "Multi-Hit Games",
      streakDescription: `${multiHitCount} multi-hit games in last ${last10.length}`,
      recentGames: multiHitGames,
      currentStreak: calculateCurrentStreak(multiHitGames),
      statValue: `${multiHitCount}/${last10.length}`,
    })
  }

  // 3. Extra-base hits (2B, 3B, HR)
  const xbhGames = last10.map((g) => {
    const doubles = Number(g.stats["2B"] || g.stats["2b"] || 0)
    const triples = Number(g.stats["3B"] || g.stats["3b"] || 0)
    const hrs = Number(g.stats.HR || g.stats.hr || 0)
    return (doubles + triples + hrs) > 0
  })
  const xbhCount = xbhGames.filter(Boolean).length

  if (xbhCount >= 6) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Power",
      statLabel: "XBH Games",
      streakDescription: `${xbhCount} XBH in last ${last10.length} games`,
      recentGames: xbhGames,
      currentStreak: calculateCurrentStreak(xbhGames),
      statValue: `${xbhCount}/${last10.length}`,
    })
  }

  // 4. Home run streak
  const hrGames = last10.map((g) => {
    const hrs = Number(g.stats.HR || g.stats.hr || 0)
    return hrs > 0
  })
  const hrCount = hrGames.filter(Boolean).length
  const currentHRStreak = calculateCurrentStreak(hrGames)

  if (currentHRStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Power",
      statLabel: "HR Streak",
      streakDescription: `HR in ${currentHRStreak} straight games`,
      recentGames: hrGames,
      currentStreak: currentHRStreak,
      statValue: `${currentHRStreak}G`,
    })
  }

  return streaks
}

/**
 * Detect pitching streaks from game logs
 * - Quality starts streak
 * - Low-run allowed games
 * - Strikeout performance
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

  // 1. Quality starts (6+ IP, ≤3 ER)
  const qualityStarts = last8.map((g) => {
    const ip = Number(g.stats.IP || g.stats.ip || 0)
    const er = Number(g.stats.ER || g.stats.er || 0)
    return ip >= 6 && er <= 3
  })
  const qsCount = qualityStarts.filter(Boolean).length
  const currentQSStreak = calculateCurrentStreak(qualityStarts)

  if (currentQSStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Pitching",
      statLabel: "Quality Starts",
      streakDescription: `${currentQSStreak} straight quality starts`,
      recentGames: qualityStarts,
      currentStreak: currentQSStreak,
      statValue: `${currentQSStreak}G`,
    })
  }

  // 2. Low-run games (≤2 runs allowed)
  const lowRunGames = last8.map((g) => {
    const r = Number(g.stats.R || g.stats.r || 0)
    return r <= 2
  })
  const lowRunCount = lowRunGames.filter(Boolean).length

  if (lowRunCount >= 5) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Pitching",
      statLabel: "Shutdowns",
      streakDescription: `${lowRunCount} games with ≤2 runs in last ${last8.length}`,
      recentGames: lowRunGames,
      currentStreak: calculateCurrentStreak(lowRunGames),
      statValue: `${lowRunCount}/${last8.length}`,
    })
  }

  // 3. Strikeout dominance (7+ K per game)
  const kGames = last8.map((g) => {
    const k = Number(g.stats.SO || g.stats.so || g.stats.K || 0)
    return k >= 7
  })
  const kCount = kGames.filter(Boolean).length

  if (kCount >= 4) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "hot",
      category: "Strikeouts",
      statLabel: "7+ K Games",
      streakDescription: `${kCount} games with 7+ strikeouts`,
      recentGames: kGames,
      currentStreak: calculateCurrentStreak(kGames),
      statValue: `${kCount}/${last8.length}`,
    })
  }

  // 4. Struggling (4+ runs allowed streak)
  const badGames = last8.map((g) => {
    const r = Number(g.stats.R || g.stats.r || g.stats.ER || g.stats.er || 0)
    return r >= 4
  })
  const badCount = badGames.filter(Boolean).length
  const currentBadStreak = calculateCurrentStreak(badGames)

  if (currentBadStreak >= 3) {
    streaks.push({
      playerId,
      playerName,
      team,
      position,
      streakType: "cold",
      category: "Pitching",
      statLabel: "High Runs",
      streakDescription: `${currentBadStreak} straight games allowing 4+ runs`,
      recentGames: badGames,
      currentStreak: currentBadStreak,
      statValue: `${currentBadStreak}G`,
    })
  }

  return streaks
}

/**
 * Calculate current active streak length (consecutive games)
 */
function calculateCurrentStreak(games: boolean[]): number {
  let streak = 0
  // Count from most recent (end of array) backwards
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
 * Calculate current cold streak (consecutive failures)
 */
function calculateCurrentColdStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (!games[i]) {
      streak++
    } else {
      break
    }
  }
  return streak
}
