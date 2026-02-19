// ============================================================
// lib/matchup-xray-service.ts — Deep matchup analysis
// ============================================================
// Builds comprehensive game-level analysis: team profiles,
// key matchups, pace projection, and historical H2H.

import type { Game, Sport } from '@/types/shared'
import type {
  MatchupXRay,
  TeamMatchupProfile,
  KeyMatchup,
  H2HHistory,
  PaceProjection,
} from '@/types/innovation-playbook'
import { fetchNBAGameSummary, fetchMLBScoreboard, fetchNFLScoreboard } from './espn/client'
import { getNBAScoreboard } from './nba-api'

interface XRayInput {
  sport: Sport
  gameId: string
}

export async function buildMatchupXRay(input: XRayInput): Promise<MatchupXRay | null> {
  const { sport, gameId } = input

  // Resolve the game
  const game = await resolveGameById(sport, gameId)
  if (!game) return null

  // Fetch ESPN game summary for deeper data
  const summary = await fetchGameSummaryBySport(sport, gameId)

  const homeTeamProfile = buildTeamProfile(game.homeTeam, summary, 'home')
  const awayTeamProfile = buildTeamProfile(game.awayTeam, summary, 'away')

  const keyMatchups = extractKeyMatchups(summary, game)
  const historicalH2H = extractH2HHistory(summary, game)
  const paceProjection = buildPaceProjection(homeTeamProfile, awayTeamProfile, game)

  return {
    game,
    homeTeamProfile,
    awayTeamProfile,
    keyMatchups,
    historicalH2H,
    paceProjection,
  }
}

// ── Game resolution by ID ──

async function resolveGameById(sport: Sport, gameId: string): Promise<Game | null> {
  switch (sport) {
    case 'nba': {
      const games = await getNBAScoreboard()
      const target = games.find(g => g.id === gameId)
      if (!target) return null
      return {
        id: target.id, sport: 'nba', date: target.date,
        homeTeam: { id: target.homeTeam.id, abbrev: target.homeTeam.abbreviation, name: target.homeTeam.displayName, logo: target.homeTeam.logo },
        awayTeam: { id: target.awayTeam.id, abbrev: target.awayTeam.abbreviation, name: target.awayTeam.displayName, logo: target.awayTeam.logo },
        venue: target.venue,
        spread: target.odds ? parseSpread(target.odds.details) : undefined,
        total: target.odds?.overUnder,
      }
    }
    case 'mlb': {
      const raw = await fetchMLBScoreboard()
      const events = ((raw as any).events ?? []) as any[]
      const ev = events.find((e: any) => e.id === gameId)
      if (!ev) return null
      return espnEventToGame('mlb', ev)
    }
    case 'nfl': {
      const raw = await fetchNFLScoreboard()
      const events = ((raw as any).events ?? []) as any[]
      const ev = events.find((e: any) => e.id === gameId)
      if (!ev) return null
      return espnEventToGame('nfl', ev)
    }
    default:
      return null
  }
}

function espnEventToGame(sport: Sport, ev: any): Game {
  const comp = ev.competitions?.[0]
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const odds = comp?.odds?.[0]
  return {
    id: ev.id ?? '', sport, date: ev.date ?? '',
    homeTeam: { id: home?.team?.id ?? '', abbrev: home?.team?.abbreviation ?? '', name: home?.team?.displayName ?? '', logo: home?.team?.logo ?? '' },
    awayTeam: { id: away?.team?.id ?? '', abbrev: away?.team?.abbreviation ?? '', name: away?.team?.displayName ?? '', logo: away?.team?.logo ?? '' },
    venue: comp?.venue?.fullName ?? '',
    spread: odds ? parseSpread(odds.details ?? '') : undefined,
    total: odds?.overUnder,
  }
}

// ── ESPN summary fetching ──

async function fetchGameSummaryBySport(sport: Sport, gameId: string): Promise<any> {
  try {
    switch (sport) {
      case 'nba':
        return await fetchNBAGameSummary(gameId)
      default:
        // MLB/NFL summary can use same ESPN pattern
        return null
    }
  } catch {
    return null
  }
}

// ── Team profile builder ──

function buildTeamProfile(
  team: Game['homeTeam'],
  summary: any,
  homeAway: 'home' | 'away',
): TeamMatchupProfile {
  // Try to extract stats from ESPN summary
  const competitors = summary?.header?.competitions?.[0]?.competitors ?? []
  const competitor = competitors.find((c: any) => c.homeAway === homeAway)
  const record = competitor?.record?.[0]?.summary ?? ''

  // Parse record for recent form
  const recentForm = assessRecentForm(record)

  // Try to get team stats from boxscore or predictor
  const predictor = summary?.predictor
  const teamStats = homeAway === 'home' ? predictor?.homeTeam : predictor?.awayTeam

  return {
    team: team.abbrev,
    offensiveRating: teamStats?.offensiveRating ?? estimateRating(record, 'offense'),
    defensiveRating: teamStats?.defensiveRating ?? estimateRating(record, 'defense'),
    pace: teamStats?.pace ?? 100,
    recentForm,
    recentRecord: record,
    strengthsVsOpponent: [],
    weaknessesVsOpponent: [],
  }
}

function assessRecentForm(record: string): 'hot' | 'cold' | 'neutral' {
  // Parse win-loss like "35-22"
  const match = record.match(/(\d+)-(\d+)/)
  if (!match) return 'neutral'
  const wins = parseInt(match[1])
  const losses = parseInt(match[2])
  const total = wins + losses
  if (total === 0) return 'neutral'
  const winPct = wins / total
  if (winPct >= 0.6) return 'hot'
  if (winPct <= 0.4) return 'cold'
  return 'neutral'
}

function estimateRating(_record: string, _type: 'offense' | 'defense'): number {
  // Without real data, provide a neutral default
  return 110
}

// ── Key matchups ──

function extractKeyMatchups(summary: any, game: Game): KeyMatchup[] {
  const matchups: KeyMatchup[] = []

  // Try to extract from ESPN summary keyEvents or leaders
  const leaders = summary?.leaders ?? []

  if (leaders.length >= 2) {
    const homeLeaders = leaders[0]?.leaders ?? []
    const awayLeaders = leaders[1]?.leaders ?? []

    // Find top scorer matchup
    const homeScoringLeader = homeLeaders.find((l: any) => l.name === 'points')?.leaders?.[0]
    const awayScoringLeader = awayLeaders.find((l: any) => l.name === 'points')?.leaders?.[0]

    if (homeScoringLeader && awayScoringLeader) {
      matchups.push({
        playerA: {
          id: homeScoringLeader.athlete?.id ?? '',
          name: homeScoringLeader.athlete?.displayName ?? 'Home Star',
          team: game.homeTeam.abbrev,
          position: homeScoringLeader.athlete?.position?.abbreviation ?? '',
        },
        playerB: {
          id: awayScoringLeader.athlete?.id ?? '',
          name: awayScoringLeader.athlete?.displayName ?? 'Away Star',
          team: game.awayTeam.abbrev,
          position: awayScoringLeader.athlete?.position?.abbreviation ?? '',
        },
        matchupType: 'position_battle',
        advantage: 'even',
        detail: 'Top scorers head-to-head',
      })
    }

    // Find top rebounder matchup
    const homeRebLeader = homeLeaders.find((l: any) => l.name === 'rebounds')?.leaders?.[0]
    const awayRebLeader = awayLeaders.find((l: any) => l.name === 'rebounds')?.leaders?.[0]

    if (homeRebLeader && awayRebLeader) {
      matchups.push({
        playerA: {
          id: homeRebLeader.athlete?.id ?? '',
          name: homeRebLeader.athlete?.displayName ?? 'Home Rebounder',
          team: game.homeTeam.abbrev,
          position: homeRebLeader.athlete?.position?.abbreviation ?? '',
        },
        playerB: {
          id: awayRebLeader.athlete?.id ?? '',
          name: awayRebLeader.athlete?.displayName ?? 'Away Rebounder',
          team: game.awayTeam.abbrev,
          position: awayRebLeader.athlete?.position?.abbreviation ?? '',
        },
        matchupType: 'position_battle',
        advantage: 'even',
        detail: 'Top rebounders head-to-head',
      })
    }
  }

  return matchups
}

// ── H2H history ──

function extractH2HHistory(summary: any, game: Game): H2HHistory {
  // ESPN summary sometimes includes lastFive or series data
  const lastFive = summary?.lastFiveGames ?? []

  const recentResults = lastFive.map((g: any) => {
    const comp = g.competitions?.[0]
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
    return {
      date: g.date ?? '',
      homeScore: parseInt(home?.score ?? '0'),
      awayScore: parseInt(away?.score ?? '0'),
      total: parseInt(home?.score ?? '0') + parseInt(away?.score ?? '0'),
    }
  })

  const homeWins = recentResults.filter((r: any) => r.homeScore > r.awayScore).length
  const avgTotal = recentResults.length > 0
    ? recentResults.reduce((s: number, r: any) => s + r.total, 0) / recentResults.length
    : 0

  return {
    totalGames: recentResults.length,
    homeWins,
    awayWins: recentResults.length - homeWins,
    avgTotal: Math.round(avgTotal * 10) / 10,
    avgSpread: 0,
    recentResults: recentResults.slice(0, 5),
  }
}

// ── Pace projection ──

function buildPaceProjection(
  homeProfile: TeamMatchupProfile,
  awayProfile: TeamMatchupProfile,
  game: Game,
): PaceProjection {
  const projectedPace = (homeProfile.pace + awayProfile.pace) / 2
  const leagueAvgPace = 100 // NBA avg ~100 possessions

  const paceImpact: PaceProjection['paceImpact'] =
    projectedPace >= leagueAvgPace + 2 ? 'fast' :
    projectedPace <= leagueAvgPace - 2 ? 'slow' :
    'average'

  return {
    projectedPace: Math.round(projectedPace * 10) / 10,
    leagueAvgPace,
    projectedTotal: game.total ?? Math.round(projectedPace * 2.2),
    vegasTotal: game.total,
    paceImpact,
  }
}

// ── Helpers ──

function parseSpread(details: string): number | undefined {
  const match = details?.match(/([-+]?\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : undefined
}
