// ============================================================
// lib/heatcheck-service.ts — The HeatCheck daily top picks engine
// ============================================================
// Scans tonight's slate, projects player performance, validates
// with convergence engine, and surfaces top-edge props.
//
// Flow: Scoreboard → Rosters → Game Logs → Project → Converge → Rank

import 'server-only'
import type { Player, Game, Sport, GameLog } from '@/types/shared'
import type { HeatCheckPick, HeatCheckBoardResult } from '@/types/heatcheck'
import type { ExtraData } from '@/lib/convergence-engine'
import { getNBAScoreboard, type NBAScheduleGame } from './nba-api'
import { fetchMLBScoreboard, fetchNFLScoreboard } from './espn/client'
import {
  fetchNBATeamRoster,
  fetchMLBTeamRoster,
  fetchNFLTeamRoster,
} from './espn/client'
import { fetchAndParseGameLogs } from './gamelog-parser'
import { resolveDefenseRanking } from './defense-service'
import { evaluateFull } from './convergence-engine'
import { computeSeasonStats } from './game-log-service'
import { CORE_STATS } from './prop-lines'
import { getStatLabel } from './design-tokens'
import { ewma, ALPHA } from './convergenceEngine/utils/ewma'
import { fetchMLBConvergenceData, fetchNFLConvergenceData } from './convergence-data-service'
import { mean } from './math-utils'

// ──── In-memory cache ────
const boardCache: Record<string, { result: HeatCheckBoardResult; timestamp: number }> = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// ──── Positions to scan per sport ────
const RELEVANT_POSITIONS: Record<Sport, string[]> = {
  nba: ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G-F', 'F-G', 'F-C', 'C-F'],
  mlb: ['SP', 'CF', 'RF', 'LF', 'SS', '1B', '2B', '3B', 'C', 'DH'],
  nfl: ['QB', 'RB', 'WR', 'TE'],
}

// Max players to keep per team (after filtering by position)
const MAX_PER_TEAM: Record<Sport, number> = {
  nba: 8,
  mlb: 10,
  nfl: 6,
}

// ──── Main entry point ────

export async function generateHeatCheckBoard(sport: Sport): Promise<HeatCheckBoardResult> {
  // Check cache
  const cached = boardCache[sport]
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  // 1. Get tonight's games
  const games = await getTonightsGames(sport)
  if (games.length === 0) {
    return { sport, generatedAt: new Date().toISOString(), gamesScanned: 0, playersScanned: 0, picks: [] }
  }

  // 2. Get team IDs from tonight's games
  const teamIds = new Set<string>()
  for (const game of games) {
    teamIds.add(game.homeTeam.id)
    teamIds.add(game.awayTeam.id)
  }

  // 3. Fetch rosters for all teams playing tonight (batched)
  const players = await fetchPlayersForTeams(Array.from(teamIds), sport, games)

  if (players.length === 0) {
    return { sport, generatedAt: new Date().toISOString(), gamesScanned: games.length, playersScanned: 0, picks: [] }
  }

  // 4. Fetch game logs for all players (batched in groups of 5)
  const playerGameLogs = await batchFetchGameLogs(players, sport)

  // 5. Fetch sport-specific convergence data per game (once per game, not per player)
  const gameExtraData = await fetchGameExtraData(sport, games, players)

  // 6. Generate picks for each player × core stat
  const coreStats = CORE_STATS[sport] || []
  const allPicks: HeatCheckPick[] = []

  for (const player of players) {
    const gameLogs = playerGameLogs.get(player.id)
    if (!gameLogs || gameLogs.length < 5) continue // need at least 5 games

    const game = findGameForPlayer(player, games)
    if (!game) continue

    const extra = gameExtraData.get(game.id) ?? {}

    for (const stat of coreStats) {
      try {
        const pick = await evaluatePick(player, game, gameLogs, stat, sport, extra)
        if (pick) allPicks.push(pick)
      } catch {
        // Skip this player/stat combo if evaluation fails
      }
    }
  }

  // 7. Sort by composite score and take top 15
  allPicks.sort((a, b) => b.compositeScore - a.compositeScore)
  const topPicks = allPicks.slice(0, 15).map((pick, i) => ({ ...pick, rank: i + 1 }))

  const result: HeatCheckBoardResult = {
    sport,
    generatedAt: new Date().toISOString(),
    gamesScanned: games.length,
    playersScanned: players.length,
    picks: topPicks,
  }

  // Cache result
  boardCache[sport] = { result, timestamp: Date.now() }

  return result
}

// ──── Step 1: Get tonight's games ────

async function getTonightsGames(sport: Sport): Promise<Game[]> {
  switch (sport) {
    case 'nba':
      return getNBAGamesTonight()
    case 'mlb':
      return getESPNGamesTonight('mlb')
    case 'nfl':
      return getESPNGamesTonight('nfl')
    default:
      return []
  }
}

async function getNBAGamesTonight(): Promise<Game[]> {
  const schedule = await getNBAScoreboard()
  return schedule
    .filter(g => g.status !== 'Final' && g.status !== 'Postponed')
    .map((g): Game => ({
      id: g.id,
      sport: 'nba',
      date: g.date,
      homeTeam: { id: g.homeTeam.id, abbrev: g.homeTeam.abbreviation, name: g.homeTeam.displayName, logo: g.homeTeam.logo },
      awayTeam: { id: g.awayTeam.id, abbrev: g.awayTeam.abbreviation, name: g.awayTeam.displayName, logo: g.awayTeam.logo },
      venue: g.venue,
      spread: g.odds ? parseSpread(g.odds.details) : undefined,
      total: g.odds?.overUnder,
    }))
}

async function getESPNGamesTonight(sport: 'mlb' | 'nfl'): Promise<Game[]> {
  const raw = sport === 'mlb' ? await fetchMLBScoreboard() : await fetchNFLScoreboard()
  const events = ((raw as any).events ?? []) as any[]

  return events
    .filter((e: any) => {
      const status = e.status?.type?.description ?? ''
      return status !== 'Final' && status !== 'Postponed'
    })
    .map((e: any): Game => {
      const comp = e.competitions?.[0]
      const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
      const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
      const odds = comp?.odds?.[0]
      return {
        id: e.id,
        sport,
        date: e.date ?? '',
        homeTeam: { id: home?.team?.id ?? '', abbrev: home?.team?.abbreviation ?? '', name: home?.team?.displayName ?? '', logo: home?.team?.logo ?? '' },
        awayTeam: { id: away?.team?.id ?? '', abbrev: away?.team?.abbreviation ?? '', name: away?.team?.displayName ?? '', logo: away?.team?.logo ?? '' },
        venue: comp?.venue?.fullName ?? '',
        spread: odds ? parseSpread(odds.details ?? '') : undefined,
        total: odds?.overUnder,
      }
    })
}

// ──── Step 2: Fetch rosters and build Player objects ────

async function fetchPlayersForTeams(teamIds: string[], sport: Sport, games: Game[]): Promise<Player[]> {
  const players: Player[] = []
  const relevantPositions = RELEVANT_POSITIONS[sport]
  const maxPerTeam = MAX_PER_TEAM[sport]

  // Batch in groups of 5 to avoid overwhelming ESPN
  const BATCH = 5
  for (let i = 0; i < teamIds.length; i += BATCH) {
    const batch = teamIds.slice(i, i + BATCH)
    const results = await Promise.all(
      batch.map(async (teamId) => {
        try {
          return { teamId, roster: await fetchTeamRoster(teamId, sport) }
        } catch {
          return { teamId, roster: null }
        }
      })
    )

    for (const { teamId, roster } of results) {
      if (!roster) continue

      // Find this team's game for team info
      const teamGame = games.find(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId)
      if (!teamGame) continue

      const teamInfo = teamGame.homeTeam.id === teamId ? teamGame.homeTeam : teamGame.awayTeam

      const athletes = extractAthletes(roster)
      const filtered = athletes
        .filter(a => relevantPositions.includes(a.position))
        .slice(0, maxPerTeam)

      for (const athlete of filtered) {
        players.push({
          id: athlete.id,
          name: athlete.name,
          team: teamInfo,
          position: athlete.position,
          headshotUrl: athlete.headshot,
          sport,
          availableStats: CORE_STATS[sport] || [],
        })
      }
    }
  }

  return players
}

async function fetchTeamRoster(teamId: string, sport: Sport) {
  switch (sport) {
    case 'nba': return fetchNBATeamRoster(teamId)
    case 'mlb': return fetchMLBTeamRoster(teamId)
    case 'nfl': return fetchNFLTeamRoster(teamId)
    default: return null
  }
}

function extractAthletes(roster: any): { id: string; name: string; position: string; headshot: string }[] {
  const athletes: { id: string; name: string; position: string; headshot: string }[] = []
  const groups = (roster as any).athletes ?? []

  for (const group of groups) {
    const items: any[] = group.items ?? [group]
    for (const athlete of items) {
      if (!athlete.id) continue
      athletes.push({
        id: String(athlete.id),
        name: athlete.displayName ?? athlete.fullName ?? '',
        position: athlete.position?.abbreviation ?? '',
        headshot: athlete.headshot?.href ?? '',
      })
    }
  }

  return athletes
}

// ──── Step 3: Batch fetch game logs ────

async function batchFetchGameLogs(players: Player[], sport: Sport): Promise<Map<string, GameLog[]>> {
  const result = new Map<string, GameLog[]>()
  const BATCH = 5

  for (let i = 0; i < players.length; i += BATCH) {
    const batch = players.slice(i, i + BATCH)
    const logs = await Promise.all(
      batch.map(async (player) => {
        try {
          const gameLogs = await fetchAndParseGameLogs(player.id, sport)
          return { id: player.id, gameLogs }
        } catch {
          return { id: player.id, gameLogs: [] as GameLog[] }
        }
      })
    )

    for (const { id, gameLogs } of logs) {
      if (gameLogs.length > 0) {
        result.set(id, gameLogs)
      }
    }
  }

  return result
}

// ──── Step 4: Fetch sport-specific extra data per game ────

async function fetchGameExtraData(
  sport: Sport,
  games: Game[],
  players: Player[],
): Promise<Map<string, ExtraData>> {
  const result = new Map<string, ExtraData>()

  if (sport === 'mlb') {
    // Need a player for MLB convergence data (for platoon splits, pitcher lookup)
    // Use one player per game as representative
    for (const game of games) {
      const rep = players.find(p =>
        p.team.id === game.homeTeam.id || p.team.id === game.awayTeam.id
      )
      if (!rep) continue
      try {
        const mlbData = await fetchMLBConvergenceData(rep, game)
        const extra: ExtraData = { mlb: { weather: mlbData.weather } }
        result.set(game.id, extra)
      } catch {
        // Optional data
      }
    }
  } else if (sport === 'nfl') {
    for (const game of games) {
      try {
        const nflData = await fetchNFLConvergenceData(game)
        const extra: ExtraData = { nfl: { weather: nflData.weather } }
        result.set(game.id, extra)
      } catch {
        // Optional data
      }
    }
  }

  return result
}

// ──── Step 5: Evaluate a single player × stat pick ────
// Projection-only model: no sportsbook lines. Ranks by convergence
// confidence + trend alignment + matchup quality.

async function evaluatePick(
  player: Player,
  game: Game,
  gameLogs: GameLog[],
  stat: string,
  sport: Sport,
  extra: ExtraData,
): Promise<HeatCheckPick | null> {
  // Get values for this stat
  const allValues = gameLogs.map(g => g.stats[stat] ?? 0)

  // Skip if player doesn't record this stat
  if (allValues.every(v => v === 0)) return null

  const seasonStats = { playerId: player.id, sport, stat, ...computeSeasonStats(gameLogs, stat) }
  const seasonAvg = seasonStats.average

  // Skip stats with negligible averages
  if (seasonAvg < 0.5) return null

  // EWMA for recent trend
  const last10 = gameLogs.slice(0, 10)
  const last10Values = last10.map(g => g.stats[stat] ?? 0)
  const last5 = gameLogs.slice(0, 5)
  const last5Values = last5.map(g => g.stats[stat] ?? 0)
  const last5Avg = last5Values.length > 0 ? mean(last5Values) : 0

  // EWMA uses oldest-first order
  const ewmaL10 = ewma([...last10Values].reverse(), ALPHA[sport])

  // Defense ranking for matchup adjustment
  let defenseRanking
  try {
    defenseRanking = await resolveDefenseRanking(player, game, stat)
  } catch {
    defenseRanking = {
      teamId: '', teamAbbrev: '', rank: 15, statsAllowed: 0,
      sport, position: player.position, stat,
    }
  }

  // Projection: 40% season + 40% EWMA L10 + 20% matchup-adjusted season
  const matchupAdj = ((defenseRanking.rank - 15) / 15) * 0.10
  const projection = (seasonAvg * 0.4) + (ewmaL10 * 0.4) + (seasonAvg * (1 + matchupAdj) * 0.2)

  // Use season average as the internal reference line for convergence
  // (not a sportsbook line — just the player's own baseline)
  const referenceLine = seasonAvg

  // Convergence engine for confidence
  let confidence = 50
  let convergenceOver = 0
  let convergenceUnder = 0
  let convergenceLean: 'over' | 'under' | 'neutral' = 'neutral'

  try {
    const convergence = evaluateFull(
      player, game, gameLogs, seasonStats, defenseRanking, stat, referenceLine, extra,
    )
    convergenceOver = convergence.overCount
    convergenceUnder = convergence.underCount
    confidence = convergence.lean.confidence
    convergenceLean = convergence.lean.direction as 'over' | 'under' | 'neutral'
  } catch {
    // Fallback: derive lean from EWMA vs season
    convergenceLean = ewmaL10 > seasonAvg ? 'over' : ewmaL10 < seasonAvg ? 'under' : 'neutral'
    convergenceOver = convergenceLean === 'over' ? 5 : 4
    convergenceUnder = 9 - convergenceOver
    confidence = 40
  }

  // Filter: need minimum convergence confidence (strong signals only)
  if (confidence < 55) return null

  // Trend detection
  const trendThreshold = seasonAvg * 0.1
  const trend: 'hot' | 'cold' | 'steady' =
    last5Avg > seasonAvg + trendThreshold ? 'hot' :
    last5Avg < seasonAvg - trendThreshold ? 'cold' :
    'steady'

  // ── Composite score: confidence × trend boost × matchup boost ──
  // Base = convergence confidence (0-100)
  let composite = confidence

  // Trend alignment bonus: +15% when trend aligns with convergence lean
  const trendAligned =
    (trend === 'hot' && convergenceLean === 'over') ||
    (trend === 'cold' && convergenceLean === 'under')
  if (trendAligned) composite *= 1.15

  // Matchup bonus: up to +10% for favorable matchups (rank 26-30 = weak D)
  if (defenseRanking.rank >= 26) composite *= 1.10
  else if (defenseRanking.rank >= 22) composite *= 1.05

  // Penalize neutral convergence — strong leans only
  if (convergenceLean === 'neutral') composite *= 0.7

  composite = Math.round(composite * 100) / 100

  // Narrative flags
  const narratives: string[] = []

  // Consistency check — how many of L5 games beat season avg
  const aboveAvgCount = last5Values.filter(v => v > seasonAvg).length
  if (aboveAvgCount >= 4) narratives.push(`${aboveAvgCount}/5 above avg`)

  // Defense quality
  if (defenseRanking.rank >= 26) {
    narratives.push('vs weak DEF')
  } else if (defenseRanking.rank <= 5) {
    narratives.push('vs elite DEF')
  }

  // Trend
  if (trend === 'hot') narratives.push('trending up')
  if (trend === 'cold') narratives.push('cooling off')

  return {
    rank: 0, // will be set after sorting
    player,
    game,
    stat,
    statLabel: getStatLabel(stat, sport),
    projection: Math.round(projection * 10) / 10,
    seasonAvg: Math.round(seasonAvg * 10) / 10,
    last5Avg: Math.round(last5Avg * 10) / 10,
    ewmaRecent: Math.round(ewmaL10 * 10) / 10,
    matchupAdj: Math.round(matchupAdj * 1000) / 10, // as percentage
    defenseRank: defenseRanking.rank,
    confidence,
    compositeScore: composite,
    convergenceOver,
    convergenceUnder,
    convergenceLean,
    trend,
    narratives: narratives.slice(0, 2),
  }
}

// ──── Helpers ────

function findGameForPlayer(player: Player, games: Game[]): Game | undefined {
  return games.find(g =>
    g.homeTeam.id === player.team.id || g.awayTeam.id === player.team.id
  )
}

function parseSpread(details: string): number | undefined {
  if (!details) return undefined
  const match = details.match(/([-+]?\d+\.?\d*)/)
  if (!match) return undefined
  return parseFloat(match[1])
}
