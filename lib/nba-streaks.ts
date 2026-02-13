/**
 * NBA Streak Detection
 * Scans NBA rotation players (20+ MPG) for active hot/cold streaks.
 * Uses ESPN gamelog endpoint for individual player data + batched concurrency.
 * Cold streaks are relative to the player's own season average.
 *
 * Streak categories align with popular NBA prop markets:
 * - Scoring (PTS), Threes (3PM), Assists, Rebounds
 * - Combos (PTS+REB+AST), Defense (STL+BLK)
 */
import "server-only"

import { fetchNBATeams, fetchNBATeamRoster, fetchNBAAthleteGameLog, fetchNBAScoreboard } from "./espn/client"
import type { StreakResult } from "./streak-detector"
import type { Trend } from "./trends-types"

const BATCH_SIZE = 15
const MIN_MPG = 20

interface NBAGameLogEntry {
  date: string
  opponent: string
  stats: Record<string, number>
}

/** Parse ESPN NBA gamelog response into flat stat entries.
 *  Handles hyphenated "made-attempted" fields (FG, 3PT, FT) by splitting them. */
function parseNBAGameLog(raw: Record<string, unknown>): NBAGameLogEntry[] {
  const labels = (raw.labels ?? []) as string[]
  const eventMeta = (raw.events ?? {}) as Record<string, Record<string, unknown>>

  const seasonTypes = raw.seasonTypes as Array<Record<string, unknown>> | undefined
  if (!seasonTypes?.length) return []

  const entries: NBAGameLogEntry[] = []
  const regularSeason = seasonTypes.find((st) => (st.displayName as string)?.includes("Regular")) ?? seasonTypes[0]
  const categories = (regularSeason?.categories ?? []) as Array<Record<string, unknown>>

  for (const cat of categories) {
    const events = (cat.events ?? []) as Array<Record<string, unknown>>
    for (const evt of events) {
      const eventId = evt.eventId as string
      const statsArr = (evt.stats ?? []) as Array<string | number>
      const statMap: Record<string, number> = {}
      labels.forEach((label, i) => {
        const val = String(statsArr[i] ?? "")
        // Handle hyphenated made-attempted stats: "7-19" → FGM=7, FGA=19
        if (val.includes("-") && !val.startsWith("-")) {
          const [made, attempted] = val.split("-").map(Number)
          if (label === "FG") { statMap.FGM = made || 0; statMap.FGA = attempted || 0 }
          else if (label === "3PT") { statMap["3PM"] = made || 0; statMap["3PA"] = attempted || 0 }
          else if (label === "FT") { statMap.FTM = made || 0; statMap.FTA = attempted || 0 }
          statMap[label] = made || 0 // also store the "made" under the original label
        } else {
          statMap[label] = Number(val) || 0
        }
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

function seasonAvg(gameLogs: NBAGameLogEntry[], stat: string): number {
  if (gameLogs.length === 0) return 0
  return gameLogs.reduce((s, g) => s + (g.stats[stat] ?? 0), 0) / gameLogs.length
}

function isRotationPlayer(gameLogs: NBAGameLogEntry[]): boolean {
  if (gameLogs.length < 5) return false
  return seasonAvg(gameLogs, "MIN") >= MIN_MPG
}

function calcStreak(games: boolean[]): number {
  let streak = 0
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i]) streak++
    else break
  }
  return streak
}

/** Helper: PTS+REB+AST combo */
function pra(g: NBAGameLogEntry): number {
  return (g.stats.PTS ?? 0) + (g.stats.REB ?? 0) + (g.stats.AST ?? 0)
}

/** Helper: Stocks (STL+BLK) */
function stocks(g: NBAGameLogEntry): number {
  return (g.stats.STL ?? 0) + (g.stats.BLK ?? 0)
}

/** Detect all NBA streaks for a single player */
function detectNBAStreaks(
  playerId: string,
  playerName: string,
  team: string,
  position: string,
  gameLogs: NBAGameLogEntry[]
): StreakResult[] {
  const streaks: StreakResult[] = []
  const last10 = gameLogs.slice(0, 10).reverse()

  // Season averages
  const avgPts = seasonAvg(gameLogs, "PTS")
  const avgReb = seasonAvg(gameLogs, "REB")
  const avgAst = seasonAvg(gameLogs, "AST")
  const avg3pm = seasonAvg(gameLogs, "3PM")
  const avgPra = gameLogs.length > 0 ? gameLogs.reduce((s, g) => s + pra(g), 0) / gameLogs.length : 0
  const avgStocks = gameLogs.length > 0 ? gameLogs.reduce((s, g) => s + stocks(g), 0) / gameLogs.length : 0
  const avgTO = seasonAvg(gameLogs, "TO")

  // ═══ HOT STREAKS ═══

  // 1. 20+ point games streak
  const bigScoringGames = last10.map((g) => (g.stats.PTS ?? 0) >= 20)
  const scoringStreak = calcStreak(bigScoringGames)
  if (scoringStreak >= 5) {
    const recentAvg = last10.reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / last10.length
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "20+ PTS Games",
      streakDescription: `${scoringStreak} straight games with 20+ points`,
      recentGames: bigScoringGames, currentStreak: scoringStreak,
      statValue: `${recentAvg.toFixed(1)} PPG`,
      seasonAvg: `${avgPts.toFixed(1)} PPG`,
    })
  }

  // 2. 30+ point games
  const elite = last10.map((g) => (g.stats.PTS ?? 0) >= 30)
  const eliteStreak = calcStreak(elite)
  if (eliteStreak >= 3) {
    const recentAvg = gameLogs.slice(0, eliteStreak).reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / eliteStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Scoring", statLabel: "30+ PTS Games",
      streakDescription: `${eliteStreak} straight games with 30+ points`,
      recentGames: elite, currentStreak: eliteStreak,
      statValue: `${recentAvg.toFixed(1)} PPG`,
      seasonAvg: `${avgPts.toFixed(1)} PPG`,
    })
  }

  // 3. Scoring above their line: last 5 avg is 20%+ above season avg
  if (avgPts >= 15) {
    const last5 = gameLogs.slice(0, 5)
    const last5Avg = last5.reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / last5.length
    if (last5Avg >= avgPts * 1.2) {
      const aboveGames = last10.map((g) => (g.stats.PTS ?? 0) > avgPts)
      streaks.push({
        playerId, playerName, team, position,
        streakType: "hot", category: "Scoring", statLabel: "Above Season Avg",
        streakDescription: `Averaging ${last5Avg.toFixed(1)} PPG over last 5 (season: ${avgPts.toFixed(1)})`,
        recentGames: aboveGames, currentStreak: calcStreak(aboveGames),
        statValue: `${last5Avg.toFixed(1)} PPG`,
        seasonAvg: `${avgPts.toFixed(1)} PPG`,
      })
    }
  }

  // 4. Double-double streak
  const ddGames = last10.map((g) => {
    const stats = [g.stats.PTS ?? 0, g.stats.REB ?? 0, g.stats.AST ?? 0, g.stats.STL ?? 0, g.stats.BLK ?? 0]
    return stats.filter((s) => s >= 10).length >= 2
  })
  const ddStreak = calcStreak(ddGames)
  if (ddStreak >= 4) {
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Combos", statLabel: "Double-Doubles",
      streakDescription: `${ddStreak} straight double-doubles`,
      recentGames: ddGames, currentStreak: ddStreak,
      statValue: `${ddStreak}G`,
      seasonAvg: `${avgPts.toFixed(0)}/${avgReb.toFixed(0)}/${avgAst.toFixed(0)}`,
    })
  }

  // 5. PRA combo — hitting high combined totals consistently
  if (avgPra >= 25) {
    const praThreshold = Math.round(avgPra * 1.15) // 15% above their avg PRA
    const praGames = last10.map((g) => pra(g) >= praThreshold)
    const praStreak = calcStreak(praGames)
    if (praStreak >= 5) {
      const recentPra = last10.reduce((s, g) => s + pra(g), 0) / last10.length
      streaks.push({
        playerId, playerName, team, position,
        streakType: "hot", category: "Combos", statLabel: `${praThreshold}+ PRA`,
        streakDescription: `${praStreak} straight games with ${praThreshold}+ PTS+REB+AST`,
        recentGames: praGames, currentStreak: praStreak,
        statValue: `${recentPra.toFixed(1)} PRA`,
        seasonAvg: `${avgPra.toFixed(1)} PRA`,
      })
    }
  }

  // 6. 3-pointer streak (3+ per game in 7 of last 10)
  const threeGames = last10.map((g) => (g.stats["3PM"] ?? 0) >= 3)
  const threeCount = threeGames.filter(Boolean).length
  if (threeCount >= 7) {
    const recent3pm = last10.reduce((s, g) => s + (g.stats["3PM"] ?? 0), 0) / last10.length
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Threes", statLabel: "3+ 3PM Games",
      streakDescription: `${threeCount} games with 3+ threes in last ${last10.length}`,
      recentGames: threeGames, currentStreak: calcStreak(threeGames),
      statValue: `${recent3pm.toFixed(1)} 3PM/G`,
      seasonAvg: `${avg3pm.toFixed(1)} 3PM/G`,
    })
  }

  // 7. Assist streak (8+)
  const assistGames = last10.map((g) => (g.stats.AST ?? 0) >= 8)
  const assistStreak = calcStreak(assistGames)
  if (assistStreak >= 4) {
    const recentAst = gameLogs.slice(0, assistStreak).reduce((s, g) => s + (g.stats.AST ?? 0), 0) / assistStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Assists", statLabel: "8+ AST Games",
      streakDescription: `${assistStreak} straight games with 8+ assists`,
      recentGames: assistGames, currentStreak: assistStreak,
      statValue: `${recentAst.toFixed(1)} APG`,
      seasonAvg: `${avgAst.toFixed(1)} APG`,
    })
  }

  // 8. Rebounding streak (10+)
  const rebGames = last10.map((g) => (g.stats.REB ?? 0) >= 10)
  const rebStreak = calcStreak(rebGames)
  if (rebStreak >= 4) {
    const recentReb = gameLogs.slice(0, rebStreak).reduce((s, g) => s + (g.stats.REB ?? 0), 0) / rebStreak
    streaks.push({
      playerId, playerName, team, position,
      streakType: "hot", category: "Rebounds", statLabel: "10+ REB Games",
      streakDescription: `${rebStreak} straight games with 10+ rebounds`,
      recentGames: rebGames, currentStreak: rebStreak,
      statValue: `${recentReb.toFixed(1)} RPG`,
      seasonAvg: `${avgReb.toFixed(1)} RPG`,
    })
  }

  // 9. Defensive props — steals+blocks streak (3+ combined)
  if (avgStocks >= 1.5) {
    const stockGames = last10.map((g) => stocks(g) >= 3)
    const stockStreak = calcStreak(stockGames)
    if (stockStreak >= 4) {
      const recentStocks = last10.reduce((s, g) => s + stocks(g), 0) / last10.length
      streaks.push({
        playerId, playerName, team, position,
        streakType: "hot", category: "Defense", statLabel: "3+ STL+BLK",
        streakDescription: `${stockStreak} straight games with 3+ steals+blocks`,
        recentGames: stockGames, currentStreak: stockStreak,
        statValue: `${recentStocks.toFixed(1)} STK/G`,
        seasonAvg: `${avgStocks.toFixed(1)} STK/G`,
      })
    }
  }

  // ═══ THRESHOLD CONSISTENCY (prop-style O/U thresholds) ═══

  // Points thresholds — common prop lines
  const ptsThresholds = [
    { line: 15.5, minAvg: 14 },
    { line: 19.5, minAvg: 17 },
    { line: 24.5, minAvg: 22 },
    { line: 29.5, minAvg: 27 },
  ]
  for (const { line, minAvg } of ptsThresholds) {
    if (avgPts >= minAvg) {
      const overGames = last10.map((g) => (g.stats.PTS ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} PTS`,
          streakDescription: `Over ${line} points in ${overCount} of last ${last10.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last10.length}`,
          seasonAvg: `${avgPts.toFixed(1)} PPG`,
          threshold: { line, stat: "PTS", hitRate: `${overCount}/${last10.length}`, hitPct: overCount / last10.length },
        })
      }
      const underGames = last10.map((g) => (g.stats.PTS ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} PTS`,
          streakDescription: `Under ${line} points in ${underCount} of last ${last10.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last10.length}`,
          seasonAvg: `${avgPts.toFixed(1)} PPG`,
          threshold: { line, stat: "PTS", hitRate: `${underCount}/${last10.length}`, hitPct: underCount / last10.length },
        })
      }
    }
  }

  // Rebounds thresholds
  const rebThresholds = [
    { line: 5.5, minAvg: 4.5 },
    { line: 7.5, minAvg: 6.5 },
    { line: 10.5, minAvg: 9 },
  ]
  for (const { line, minAvg } of rebThresholds) {
    if (avgReb >= minAvg) {
      const overGames = last10.map((g) => (g.stats.REB ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} REB`,
          streakDescription: `Over ${line} rebounds in ${overCount} of last ${last10.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last10.length}`,
          seasonAvg: `${avgReb.toFixed(1)} RPG`,
          threshold: { line, stat: "REB", hitRate: `${overCount}/${last10.length}`, hitPct: overCount / last10.length },
        })
      }
      const underGames = last10.map((g) => (g.stats.REB ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} REB`,
          streakDescription: `Under ${line} rebounds in ${underCount} of last ${last10.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last10.length}`,
          seasonAvg: `${avgReb.toFixed(1)} RPG`,
          threshold: { line, stat: "REB", hitRate: `${underCount}/${last10.length}`, hitPct: underCount / last10.length },
        })
      }
    }
  }

  // Assists thresholds
  const astThresholds = [
    { line: 4.5, minAvg: 3.5 },
    { line: 6.5, minAvg: 5.5 },
    { line: 9.5, minAvg: 8 },
  ]
  for (const { line, minAvg } of astThresholds) {
    if (avgAst >= minAvg) {
      const overGames = last10.map((g) => (g.stats.AST ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} AST`,
          streakDescription: `Over ${line} assists in ${overCount} of last ${last10.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last10.length}`,
          seasonAvg: `${avgAst.toFixed(1)} APG`,
          threshold: { line, stat: "AST", hitRate: `${overCount}/${last10.length}`, hitPct: overCount / last10.length },
        })
      }
      const underGames = last10.map((g) => (g.stats.AST ?? 0) < line)
      const underCount = underGames.filter(Boolean).length
      if (underCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "cold", category: "Consistency",
          statLabel: `UNDER ${line} AST`,
          streakDescription: `Under ${line} assists in ${underCount} of last ${last10.length} games`,
          recentGames: underGames, currentStreak: underCount,
          statValue: `${underCount}/${last10.length}`,
          seasonAvg: `${avgAst.toFixed(1)} APG`,
          threshold: { line, stat: "AST", hitRate: `${underCount}/${last10.length}`, hitPct: underCount / last10.length },
        })
      }
    }
  }

  // Threes thresholds
  const threeThresholds = [
    { line: 1.5, minAvg: 1.2 },
    { line: 2.5, minAvg: 2 },
    { line: 3.5, minAvg: 3 },
  ]
  for (const { line, minAvg } of threeThresholds) {
    if (avg3pm >= minAvg) {
      const overGames = last10.map((g) => (g.stats["3PM"] ?? 0) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} 3PM`,
          streakDescription: `Over ${line} threes in ${overCount} of last ${last10.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last10.length}`,
          seasonAvg: `${avg3pm.toFixed(1)} 3PM/G`,
          threshold: { line, stat: "3PM", hitRate: `${overCount}/${last10.length}`, hitPct: overCount / last10.length },
        })
      }
    }
  }

  // PRA (Points + Rebounds + Assists) combo thresholds
  const praConsistencyThresholds = [
    { line: 25.5, minAvg: 22 },
    { line: 30.5, minAvg: 27 },
    { line: 35.5, minAvg: 32 },
    { line: 40.5, minAvg: 37 },
  ]
  for (const { line, minAvg } of praConsistencyThresholds) {
    if (avgPra >= minAvg) {
      const overGames = last10.map((g) => pra(g) > line)
      const overCount = overGames.filter(Boolean).length
      if (overCount >= 7) {
        streaks.push({
          playerId, playerName, team, position,
          streakType: "hot", category: "Consistency",
          statLabel: `OVER ${line} PRA`,
          streakDescription: `Over ${line} PTS+REB+AST in ${overCount} of last ${last10.length} games`,
          recentGames: overGames, currentStreak: overCount,
          statValue: `${overCount}/${last10.length}`,
          seasonAvg: `${avgPra.toFixed(1)} PRA`,
          threshold: { line, stat: "PRA", hitRate: `${overCount}/${last10.length}`, hitPct: overCount / last10.length },
        })
      }
    }
  }

  // ═══ COLD STREAKS (relative to season average) ═══

  // Cold Scoring: 3+ straight under 60% of season avg
  if (avgPts >= 12) {
    const coldThreshold = avgPts * 0.6
    const coldScoring = last10.map((g) => (g.stats.PTS ?? 0) < coldThreshold)
    const coldStreak = calcStreak(coldScoring)
    if (coldStreak >= 3) {
      const recentAvg = gameLogs.slice(0, coldStreak).reduce((s, g) => s + (g.stats.PTS ?? 0), 0) / coldStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Scoring", statLabel: `Under ${Math.round(coldThreshold)} PTS`,
        streakDescription: `${coldStreak} straight under ${Math.round(coldThreshold)} pts (avg: ${avgPts.toFixed(1)})`,
        recentGames: coldScoring, currentStreak: coldStreak,
        statValue: `${recentAvg.toFixed(1)} PPG`,
        seasonAvg: `${avgPts.toFixed(1)} PPG`,
      })
    }
  }

  // Cold 3-Point: 3+ straight with 0 threes for 1.5+ 3PM/G shooters
  if (avg3pm >= 1.5) {
    const coldThrees = last10.map((g) => (g.stats["3PM"] ?? 0) === 0)
    const cold3Streak = calcStreak(coldThrees)
    if (cold3Streak >= 3) {
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Threes", statLabel: "0 3PM Games",
        streakDescription: `${cold3Streak} straight without a three (avg: ${avg3pm.toFixed(1)}/G)`,
        recentGames: coldThrees, currentStreak: cold3Streak,
        statValue: `${cold3Streak}G`,
        seasonAvg: `${avg3pm.toFixed(1)} 3PM/G`,
      })
    }
  }

  // Cold Rebounds: 3+ straight under 50% of avg for 8+ RPG players
  if (avgReb >= 8) {
    const coldRebThreshold = avgReb * 0.5
    const coldReb = last10.map((g) => (g.stats.REB ?? 0) < coldRebThreshold)
    const coldRebStreak = calcStreak(coldReb)
    if (coldRebStreak >= 3) {
      const recentReb = gameLogs.slice(0, coldRebStreak).reduce((s, g) => s + (g.stats.REB ?? 0), 0) / coldRebStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Rebounds", statLabel: `Under ${Math.round(coldRebThreshold)} REB`,
        streakDescription: `${coldRebStreak} straight under ${Math.round(coldRebThreshold)} reb (avg: ${avgReb.toFixed(1)})`,
        recentGames: coldReb, currentStreak: coldRebStreak,
        statValue: `${recentReb.toFixed(1)} RPG`,
        seasonAvg: `${avgReb.toFixed(1)} RPG`,
      })
    }
  }

  // Cold Assists: 3+ straight under 50% of avg for 6+ APG players
  if (avgAst >= 6) {
    const coldAstThreshold = avgAst * 0.5
    const coldAst = last10.map((g) => (g.stats.AST ?? 0) < coldAstThreshold)
    const coldAstStreak = calcStreak(coldAst)
    if (coldAstStreak >= 3) {
      const recentAst = gameLogs.slice(0, coldAstStreak).reduce((s, g) => s + (g.stats.AST ?? 0), 0) / coldAstStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Assists", statLabel: `Under ${Math.round(coldAstThreshold)} AST`,
        streakDescription: `${coldAstStreak} straight under ${Math.round(coldAstThreshold)} ast (avg: ${avgAst.toFixed(1)})`,
        recentGames: coldAst, currentStreak: coldAstStreak,
        statValue: `${recentAst.toFixed(1)} APG`,
        seasonAvg: `${avgAst.toFixed(1)} APG`,
      })
    }
  }

  // Cold Turnovers: 3+ straight games with high TOs (>= 150% of avg) for players who avg 2+ TO
  if (avgTO >= 2) {
    const toThreshold = Math.ceil(avgTO * 1.5)
    const highTO = last10.map((g) => (g.stats.TO ?? 0) >= toThreshold)
    const toStreak = calcStreak(highTO)
    if (toStreak >= 3) {
      const recentTO = gameLogs.slice(0, toStreak).reduce((s, g) => s + (g.stats.TO ?? 0), 0) / toStreak
      streaks.push({
        playerId, playerName, team, position,
        streakType: "cold", category: "Turnovers", statLabel: `${toThreshold}+ TO Games`,
        streakDescription: `${toStreak} straight with ${toThreshold}+ turnovers (avg: ${avgTO.toFixed(1)})`,
        recentGames: highTO, currentStreak: toStreak,
        statValue: `${recentTO.toFixed(1)} TO/G`,
        seasonAvg: `${avgTO.toFixed(1)} TO/G`,
      })
    }
  }

  return streaks
}

/** Get ALL NBA players from team rosters */
async function getAllNBAPlayers(): Promise<Array<{ id: string; name: string; team: string; position: string }>> {
  const teamsRaw = await fetchNBATeams()
  const sports = (teamsRaw as Record<string, unknown[]>).sports ?? []
  const teamIds: { id: string; abbr: string }[] = []

  for (const sport of sports as Array<Record<string, unknown>>) {
    const leagues = (sport.leagues ?? []) as Array<Record<string, unknown>>
    for (const league of leagues) {
      const teams = (league.teams ?? []) as Array<Record<string, unknown>>
      for (const teamEntry of teams) {
        const team = teamEntry.team as Record<string, unknown>
        if (team) teamIds.push({ id: team.id as string, abbr: (team.abbreviation as string) ?? "" })
      }
    }
  }

  const rosterPromises = teamIds.map(async ({ id, abbr }) => {
    try {
      const raw = await fetchNBATeamRoster(id)
      const athletes = (raw.athletes ?? []) as Array<Record<string, unknown>>
      const players: Array<{ id: string; name: string; team: string; position: string }> = []
      for (const athlete of athletes) {
        const pos = (athlete.position as Record<string, unknown>)?.abbreviation as string ?? ""
        players.push({
          id: athlete.id as string,
          name: (athlete.displayName as string) ?? (athlete.fullName as string) ?? "",
          team: abbr,
          position: pos,
        })
      }
      return players
    } catch { return [] }
  })

  const results = await Promise.all(rosterPromises)
  return results.flat()
}

/** Get today's games to tag players as "playing today" */
async function getTodayGames(): Promise<Map<string, string>> {
  const teamToOpponent = new Map<string, string>()
  try {
    const scoreboard = await fetchNBAScoreboard()
    const events = (scoreboard.events ?? []) as Array<Record<string, unknown>>
    for (const event of events) {
      const competitions = (event.competitions ?? []) as Array<Record<string, unknown>>
      if (competitions.length === 0) continue
      const comp = competitions[0]
      const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>
      if (competitors.length !== 2) continue

      const away = competitors.find((c) => (c.homeAway as string) === "away") as Record<string, unknown>
      const home = competitors.find((c) => (c.homeAway as string) === "home") as Record<string, unknown>
      if (!away || !home) continue

      const awayTeam = away.team as Record<string, unknown>
      const homeTeam = home.team as Record<string, unknown>
      teamToOpponent.set(awayTeam.abbreviation as string, homeTeam.abbreviation as string)
      teamToOpponent.set(homeTeam.abbreviation as string, awayTeam.abbreviation as string)
    }
  } catch {
    // Non-critical
  }
  return teamToOpponent
}

/**
 * Scan NBA rotation players for active streaks.
 */
export async function getNBAStreakTrends(): Promise<Trend[]> {
  try {
    const [allPlayers, todayGames] = await Promise.all([
      getAllNBAPlayers(),
      getTodayGames(),
    ])
    console.log(`[NBA Streaks] Fetching gamelogs for ${allPlayers.length} rostered players`)

    const allStreaks: StreakResult[] = []
    let scannedCount = 0

    for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
      const batch = allPlayers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (player) => {
          try {
            const raw = await fetchNBAAthleteGameLog(player.id)
            const gameLogs = parseNBAGameLog(raw)
            if (!isRotationPlayer(gameLogs)) return []
            scannedCount++
            return detectNBAStreaks(player.id, player.name, player.team, player.position, gameLogs)
          } catch { return [] }
        })
      )
      allStreaks.push(...batchResults.flat())
    }

    console.log(`[NBA Streaks] Scanned ${scannedCount} rotation players, found ${allStreaks.length} streaks`)

    const trends: Trend[] = allStreaks.map((streak, idx) => {
      const opponent = todayGames.get(streak.team)
      return {
        id: `nba-streak-${idx}`,
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
        playingToday: !!opponent,
        opponent: opponent ?? undefined,
        threshold: streak.threshold,
      }
    })

    // Split by category type: streaks vs consistency
    const streakTrends = trends.filter((t) => t.category !== "Consistency")
    const consistencyTrends = trends.filter((t) => t.category === "Consistency")

    const hotStreaks = streakTrends.filter((t) => t.type === "hot").sort((a, b) => b.streakLength - a.streakLength)
    const coldStreaks = streakTrends.filter((t) => t.type === "cold").sort((a, b) => b.streakLength - a.streakLength)
    // Consistency sorted by hit rate then streak length
    const hotConsistency = consistencyTrends.filter((t) => t.type === "hot").sort((a, b) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0) || b.streakLength - a.streakLength)
    const coldConsistency = consistencyTrends.filter((t) => t.type === "cold").sort((a, b) => (b.threshold?.hitPct ?? 0) - (a.threshold?.hitPct ?? 0) || b.streakLength - a.streakLength)

    return [
      ...hotStreaks.slice(0, 25),
      ...coldStreaks.slice(0, 15),
      ...hotConsistency.slice(0, 25),
      ...coldConsistency.slice(0, 15),
    ]
  } catch (err) {
    console.error("[NBA Streaks] Failed to generate trends:", err)
    return []
  }
}

function generateDetail(streak: StreakResult): string {
  const avg = streak.seasonAvg ? ` Season avg: ${streak.seasonAvg}.` : ""
  if (streak.category === "Consistency") {
    const dir = streak.streakType === "hot" ? "over" : "under"
    return `Consistently going ${dir} this line. ${streak.streakDescription}.${avg}`
  }
  if (streak.streakType === "hot") {
    if (streak.category === "Scoring") return `On fire. ${streak.streakDescription}.${avg}`
    if (streak.category === "Threes") return `Lights out from deep. ${streak.streakDescription}.${avg}`
    if (streak.category === "Assists") return `Running the offense. ${streak.streakDescription}.${avg}`
    if (streak.category === "Rebounds") return `Dominating the glass. ${streak.streakDescription}.${avg}`
    if (streak.category === "Combos") return `Filling the stat sheet. ${streak.streakDescription}.${avg}`
    if (streak.category === "Defense") return `Disruptive on defense. ${streak.streakDescription}.${avg}`
  }
  if (streak.streakType === "cold") {
    if (streak.category === "Scoring") return `Struggling to score. ${streak.streakDescription}.${avg}`
    if (streak.category === "Threes") return `Ice cold from deep. ${streak.streakDescription}.${avg}`
    if (streak.category === "Rebounds") return `Not crashing the boards. ${streak.streakDescription}.${avg}`
    if (streak.category === "Assists") return `Not creating for others. ${streak.streakDescription}.${avg}`
    if (streak.category === "Turnovers") return `Careless with the ball. ${streak.streakDescription}.${avg}`
  }
  return `Notable trend: ${streak.streakDescription}.${avg}`
}
