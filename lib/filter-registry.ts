// ============================================================
// lib/filter-registry.ts — Filter field definitions for Edge Lab
// ============================================================
// Defines all available fields users can build filter conditions from.
// Each field knows how to extract its value from an EnrichedGameLog.

import type { Sport } from '@/types/shared'
import type { FilterFieldDef, EnrichedGameLog } from '@/types/edge-lab'

// ── UNIVERSAL FIELDS (all sports) ──

const universalFields: FilterFieldDef[] = [
  {
    key: 'home_away',
    label: 'Home / Away',
    category: 'Venue',
    description: 'Whether the player is at home or on the road',
    sport: 'all',
    type: 'select',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'away', label: 'Away' },
    ],
    defaultOperator: 'eq',
    evaluate: (g) => g.isHome ? 'home' : 'away',
  },
  {
    key: 'is_back_to_back',
    label: 'Back-to-Back',
    category: 'Rest',
    description: 'Whether the game is on a back-to-back',
    sport: 'all',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.isBackToBack,
  },
  {
    key: 'rest_days',
    label: 'Days of Rest',
    category: 'Rest',
    description: 'Number of days since last game',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 14,
    step: 1,
    defaultOperator: 'gte',
    unit: 'days',
    evaluate: (g) => g.restDays,
  },
  {
    key: 'opponent_def_rank',
    label: 'Opponent Defense Rank',
    category: 'Matchup',
    description: 'Opponent defense ranking for this stat/position (1=best, 30=worst)',
    sport: 'all',
    type: 'range',
    min: 1,
    max: 30,
    step: 1,
    defaultOperator: 'between',
    evaluate: (g) => g.opponentDefRank,
  },
  {
    key: 'stat_avg_l5',
    label: 'Average (Last 5)',
    category: 'Performance',
    description: 'Player average for this stat over the last 5 games',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 100,
    step: 0.5,
    defaultOperator: 'gte',
    evaluate: (g) => g.statAvgL5 ?? 0,
  },
  {
    key: 'stat_avg_l10',
    label: 'Average (Last 10)',
    category: 'Performance',
    description: 'Player average for this stat over the last 10 games',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 100,
    step: 0.5,
    defaultOperator: 'gte',
    evaluate: (g) => g.statAvgL10 ?? 0,
  },
  {
    key: 'hit_rate_l10',
    label: 'Hit Rate (Last 10)',
    category: 'Performance',
    description: 'Percentage of last 10 games where the line was hit',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 100,
    step: 5,
    defaultOperator: 'gte',
    unit: '%',
    evaluate: (g) => (g.hitRateL10 ?? 0) * 100,
  },
  {
    key: 'season_game_number',
    label: 'Season Game Number',
    category: 'Team Context',
    description: 'How far into the season (e.g., game 40 of 82)',
    sport: 'all',
    type: 'range',
    min: 1,
    max: 162,
    step: 1,
    defaultOperator: 'between',
    evaluate: (g) => g.seasonGameNumber ?? 0,
  },
  {
    key: 'game_total',
    label: 'Vegas Game Total',
    category: 'Betting Lines',
    description: 'The Vegas over/under total for the game',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 300,
    step: 0.5,
    defaultOperator: 'gte',
    evaluate: (g) => g.gameTotal ?? 0,
  },
  {
    key: 'team_implied_total',
    label: 'Team Implied Total',
    category: 'Betting Lines',
    description: 'The implied team total derived from spread + game total',
    sport: 'all',
    type: 'number',
    min: 0,
    max: 150,
    step: 0.5,
    defaultOperator: 'gte',
    evaluate: (g) => g.teamImpliedTotal ?? 0,
  },
  {
    key: 'team_spread',
    label: 'Team Spread',
    category: 'Betting Lines',
    description: 'Point spread for the team (negative = favored)',
    sport: 'all',
    type: 'number',
    min: -30,
    max: 30,
    step: 0.5,
    defaultOperator: 'between',
    evaluate: (g) => g.teamSpread ?? 0,
  },
]

// ── NBA-SPECIFIC FIELDS ──

const nbaFields: FilterFieldDef[] = [
  {
    key: 'opponent_pace_rank',
    label: 'Opponent Pace Rank',
    category: 'Matchup',
    description: 'Opponent pace ranking (1=fastest, 30=slowest)',
    sport: 'nba',
    type: 'range',
    min: 1,
    max: 30,
    step: 1,
    defaultOperator: 'between',
    evaluate: (g) => g.opponentPaceRank ?? 15,
  },
  {
    key: 'key_teammate_out',
    label: 'Key Teammate Out',
    category: 'Team Context',
    description: 'Whether a key teammate is missing from the lineup',
    sport: 'nba',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.keyTeammateOut ?? false,
  },
]

// ── MLB-SPECIFIC FIELDS ──

const mlbFields: FilterFieldDef[] = [
  {
    key: 'opposing_pitcher_hand',
    label: 'Opposing Pitcher Hand',
    category: 'Matchup',
    description: 'Handedness of the opposing pitcher',
    sport: 'mlb',
    type: 'select',
    options: [
      { value: 'L', label: 'Left-handed' },
      { value: 'R', label: 'Right-handed' },
    ],
    defaultOperator: 'eq',
    evaluate: (g) => g.opposingPitcherHand ?? 'R',
  },
  {
    key: 'opposing_pitcher_era',
    label: 'Opposing Pitcher ERA',
    category: 'Matchup',
    description: 'ERA of the opposing starting pitcher',
    sport: 'mlb',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    defaultOperator: 'gte',
    evaluate: (g) => g.opposingPitcherERA ?? 4.0,
  },
  {
    key: 'is_day_game',
    label: 'Day Game',
    category: 'Venue',
    description: 'Whether it is a day game or night game',
    sport: 'mlb',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.isDayGame ?? false,
  },
  {
    key: 'ballpark_factor',
    label: 'Ballpark Factor',
    category: 'Venue',
    description: 'Park factor for the stat (>100 = hitter-friendly)',
    sport: 'mlb',
    type: 'number',
    min: 80,
    max: 120,
    step: 1,
    defaultOperator: 'gte',
    evaluate: (g) => g.ballparkFactor ?? 100,
  },
  {
    key: 'wind_speed',
    label: 'Wind Speed',
    category: 'Weather',
    description: 'Wind speed at the ballpark (mph)',
    sport: 'mlb',
    type: 'number',
    min: 0,
    max: 40,
    step: 1,
    defaultOperator: 'gte',
    unit: 'mph',
    evaluate: (g) => g.weather?.windSpeed ?? 0,
  },
]

// ── NFL-SPECIFIC FIELDS ──

const nflFields: FilterFieldDef[] = [
  {
    key: 'is_indoor',
    label: 'Indoor Game',
    category: 'Venue',
    description: 'Whether the game is played indoors (dome/retractable roof)',
    sport: 'nfl',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.isIndoor ?? false,
  },
  {
    key: 'is_primetime',
    label: 'Primetime Game',
    category: 'Team Context',
    description: 'Sunday Night, Monday Night, or Thursday Night game',
    sport: 'nfl',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.isPrimetime ?? false,
  },
  {
    key: 'week_number',
    label: 'Week Number',
    category: 'Team Context',
    description: 'NFL week number (1-18 regular season)',
    sport: 'nfl',
    type: 'range',
    min: 1,
    max: 22,
    step: 1,
    defaultOperator: 'between',
    evaluate: (g) => g.weekNumber ?? 0,
  },
  {
    key: 'is_divisional',
    label: 'Divisional Game',
    category: 'Matchup',
    description: 'Whether the opponent is in the same division',
    sport: 'nfl',
    type: 'boolean',
    defaultOperator: 'eq',
    evaluate: (g) => g.isDivisional ?? false,
  },
]

// ── REGISTRY BUILDER ──

const ALL_FIELDS: FilterFieldDef[] = [
  ...universalFields,
  ...nbaFields,
  ...mlbFields,
  ...nflFields,
]

/**
 * Get all filter fields available for a sport
 */
export function getFieldsForSport(sport: Sport): FilterFieldDef[] {
  return ALL_FIELDS.filter(f => f.sport === 'all' || f.sport === sport)
}

/**
 * Get a specific field definition by key
 */
export function getFieldDef(key: string): FilterFieldDef | undefined {
  return ALL_FIELDS.find(f => f.key === key)
}

/**
 * Get fields grouped by category for UI rendering
 */
export function getFieldsByCategory(sport: Sport): Record<string, FilterFieldDef[]> {
  const fields = getFieldsForSport(sport)
  const grouped: Record<string, FilterFieldDef[]> = {}

  for (const field of fields) {
    if (!grouped[field.category]) {
      grouped[field.category] = []
    }
    grouped[field.category].push(field)
  }

  return grouped
}

/**
 * Get all unique categories for a sport
 */
export function getCategories(sport: Sport): string[] {
  const fields = getFieldsForSport(sport)
  return [...new Set(fields.map(f => f.category))]
}
