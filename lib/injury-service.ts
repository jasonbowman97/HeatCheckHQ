// ============================================================
// lib/injury-service.ts — Team injury data resolver
// ============================================================
// Fetches injury reports for a player's team and their opponent
// using existing ESPN team summary endpoints.
// Filters to only show bettable/meaningful players (starters & key rotation).

import type { Player, Game } from '@/types/shared'
import type { InjuryContext } from '@/types/check-prop'
import { getNBATeamSummary } from './nba-api'

export interface TeamInjuries {
  teammates: InjuryContext[]
  opponents: InjuryContext[]
}

export async function fetchTeamInjuries(
  player: Player,
  game: Game,
): Promise<TeamInjuries> {
  const isHome = game.homeTeam.id === player.team.id
  const playerTeamId = player.team.id
  const opponentTeamId = isHome ? game.awayTeam.id : game.homeTeam.id

  switch (player.sport) {
    case 'nba':
      return fetchNBAInjuries(playerTeamId, opponentTeamId, player.name)
    default:
      return { teammates: [], opponents: [] }
  }
}

async function fetchNBAInjuries(
  playerTeamId: string,
  opponentTeamId: string,
  currentPlayerName: string,
): Promise<TeamInjuries> {
  const [teamSummary, opponentSummary] = await Promise.all([
    getNBATeamSummary(playerTeamId).catch(() => null),
    getNBATeamSummary(opponentTeamId).catch(() => null),
  ])

  const teammates: InjuryContext[] = (teamSummary?.injuries ?? [])
    .filter(inj => inj.name !== currentPlayerName)
    .filter(inj => isBettablePlayer(inj.name))
    .map(inj => ({
      playerName: inj.name,
      team: 'teammate',
      status: normalizeStatus(inj.status),
      impact: estimateImpact(inj.name, inj.status),
      relevance: buildRelevance(inj.name, inj.status, inj.detail, 'teammate'),
    }))

  const opponents: InjuryContext[] = (opponentSummary?.injuries ?? [])
    .filter(inj => isBettablePlayer(inj.name))
    .map(inj => ({
      playerName: inj.name,
      team: 'opponent',
      status: normalizeStatus(inj.status),
      impact: estimateImpact(inj.name, inj.status),
      relevance: buildRelevance(inj.name, inj.status, inj.detail, 'opponent'),
    }))

  return { teammates, opponents }
}

function normalizeStatus(status: string): InjuryContext['status'] {
  const s = status.toLowerCase()
  if (s.includes('out') || s.includes('suspended')) return 'Out'
  if (s.includes('doubtful')) return 'Out'
  if (s.includes('questionable')) return 'Questionable'
  if (s.includes('probable')) return 'Probable'
  if (s.includes('day-to-day') || s.includes('day to day')) return 'Day-to-Day'
  return 'Questionable'
}

/**
 * Determines if a player is "bettable" — someone who actually impacts
 * lines and game outcomes. Uses a curated star list + known starters.
 * Players NOT in this list are filtered out of the injury report
 * to avoid cluttering it with 10-day contract / G-League / end-of-bench guys.
 */
function isBettablePlayer(name: string): boolean {
  // Check against known impactful NBA players
  // This covers All-Stars, borderline All-Stars, and key starters/6th men
  return NBA_BETTABLE_PLAYERS.has(name)
}

/**
 * Estimate impact based on both the player's importance AND their status.
 * A star player being Out is high impact. A role player being Out is medium at best.
 */
function estimateImpact(name: string, status: string): 'high' | 'medium' | 'low' {
  const s = status.toLowerCase()
  const isOut = s.includes('out') || s.includes('suspended') || s.includes('doubtful')
  const isStar = NBA_STAR_PLAYERS.has(name)
  const isStarter = NBA_BETTABLE_PLAYERS.has(name)

  if (isStar && isOut) return 'high'
  if (isStar) return 'medium' // star questionable/DTD still matters
  if (isStarter && isOut) return 'medium'
  if (isStarter && s.includes('questionable')) return 'low'
  return 'low'
}

function buildRelevance(name: string, status: string, detail: string, side: 'teammate' | 'opponent'): string {
  if (detail) return detail
  const isStar = NBA_STAR_PLAYERS.has(name)
  if (side === 'teammate') {
    return isStar
      ? `Star teammate out — expect increased usage/touches`
      : 'Teammate injury may affect rotations'
  }
  return isStar
    ? `Key opponent out — weaker opposing lineup`
    : 'Opponent injury may affect matchup'
}

// ---- Known NBA players who actually matter for betting ----
// Stars: All-NBA / All-Star caliber — their absence dramatically shifts lines
const NBA_STAR_PLAYERS = new Set([
  // East
  'Giannis Antetokounmpo', 'Damian Lillard', 'Jayson Tatum', 'Jaylen Brown',
  'Jalen Brunson', 'Karl-Anthony Towns', 'Joel Embiid', 'Tyrese Maxey',
  'Donovan Mitchell', 'Darius Garland', 'Evan Mobley',
  'Jimmy Butler', 'Bam Adebayo', 'Tyler Herro',
  'Paolo Banchero', 'Franz Wagner',
  'Scottie Barnes', 'Pascal Siakam',
  'Trae Young', 'Dejounte Murray',
  'LaMelo Ball', 'Brandon Miller',
  'Tyrese Haliburton', 'Cade Cunningham',
  'De\'Aaron Fox',
  // West
  'Nikola Jokic', 'Jamal Murray',
  'Luka Doncic', 'Kyrie Irving',
  'Shai Gilgeous-Alexander',
  'Anthony Edwards', 'Rudy Gobert', 'Julius Randle',
  'LeBron James', 'Anthony Davis',
  'Kevin Durant', 'Devin Booker', 'Bradley Beal',
  'Stephen Curry', 'Draymond Green',
  'Kawhi Leonard', 'James Harden', 'Norman Powell',
  'Ja Morant', 'Jaren Jackson Jr.',
  'Zion Williamson', 'Brandon Ingram', 'CJ McCollum',
  'Victor Wembanyama', 'Devin Vassell',
  'Lauri Markkanen', 'Collin Sexton',
  'Jalen Williams', 'Chet Holmgren',
  'Alperen Sengun', 'Jalen Green', 'Fred VanVleet',
  'De\'Aaron Fox', 'Domantas Sabonis',
  'Anfernee Simons', 'Jerami Grant',
])

// Bettable players: includes stars + key starters and 6th men
// whose absence/presence affects prop lines meaningfully
const NBA_BETTABLE_PLAYERS = new Set([
  ...NBA_STAR_PLAYERS,
  // East rotation pieces that affect lines
  'Khris Middleton', 'Brook Lopez', 'Bobby Portis',
  'Derrick White', 'Jrue Holiday', 'Kristaps Porzingis', 'Al Horford',
  'OG Anunoby', 'Mikal Bridges', 'Josh Hart',
  'Kelly Oubre Jr.', 'Paul George',
  'Jarrett Allen', 'Max Strus',
  'Terry Rozier',
  'Jalen Suggs', 'Wendell Carter Jr.',
  'RJ Barrett', 'Immanuel Quickley',
  'Clint Capela', 'Bogdan Bogdanovic',
  'Miles Bridges', 'Mark Williams',
  'Myles Turner', 'Aaron Nesmith', 'Bennedict Mathurin',
  'Jaden Ivey', 'Ausar Thompson',
  // West rotation pieces
  'Aaron Gordon', 'Michael Porter Jr.',
  'PJ Washington', 'Dereck Lively II', 'Daniel Gafford',
  'Lu Dort', 'Alex Caruso',
  'Mike Conley', 'Naz Reid', 'Jaden McDaniels',
  'Austin Reaves', 'D\'Angelo Russell', 'Rui Hachimura',
  'Eric Gordon', 'Grayson Allen',
  'Andrew Wiggins', 'Jonathan Kuminga', 'Kevon Looney',
  'Ivica Zubac', 'Terance Mann',
  'Desmond Bane', 'Marcus Smart',
  'Herbert Jones', 'Trey Murphy III', 'Jose Alvarado',
  'Keldon Johnson', 'Tre Jones',
  'Jordan Clarkson', 'Walker Kessler', 'John Collins',
  'Isaiah Hartenstein',
  'Jabari Smith Jr.', 'Dillon Brooks', 'Amen Thompson',
  'Keegan Murray', 'Malik Monk',
  'Shaedon Sharpe', 'Deandre Ayton', 'Robert Williams III',
])
