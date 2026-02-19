// ============================================================
// lib/community-service.ts — Community Strategy Library Service
// ============================================================
// Handles strategy publishing, forking, voting, following,
// leaderboard computation, and author profile building.

import type {
  PublicStrategy,
  StrategyComment,
  CommunityLeaderboard,
  LeaderboardEntry,
  AuthorProfile,
} from '@/types/community'

// ---- Leaderboard Algorithms ----

export type LeaderboardSort = 'hot' | 'rising' | 'top_roi' | 'most_followed' | 'newest'

/** Sort strategies by leaderboard algorithm */
export function sortStrategies(strategies: PublicStrategy[], sort: LeaderboardSort): PublicStrategy[] {
  const sorted = [...strategies]

  switch (sort) {
    case 'hot':
      // Hot = weighted combo of recent activity, votes, and performance
      return sorted.sort((a, b) => hotScore(b) - hotScore(a))

    case 'rising':
      // Rising = highest vote velocity in last 7 days (approx by recent follower growth)
      return sorted.sort((a, b) => risingScore(b) - risingScore(a))

    case 'top_roi':
      // Top ROI = best live ROI with minimum sample
      return sorted
        .filter(s => s.livePerformance.games >= 10)
        .sort((a, b) => b.livePerformance.roi - a.livePerformance.roi)

    case 'most_followed':
      return sorted.sort((a, b) => b.followerCount - a.followerCount)

    case 'newest':
      return sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    default:
      return sorted
  }
}

function hotScore(s: PublicStrategy): number {
  const ageHours = (Date.now() - new Date(s.publishedAt).getTime()) / 3_600_000
  const decay = Math.pow(ageHours + 2, 1.5)
  const signal = s.voteScore * 2 + s.followerCount + s.commentCount * 0.5
  const performance = s.livePerformance.games >= 10 ? Math.max(0, s.livePerformance.roi * 100) : 0
  return (signal + performance) / decay
}

function risingScore(s: PublicStrategy): number {
  const ageDays = (Date.now() - new Date(s.publishedAt).getTime()) / 86_400_000
  if (ageDays > 30) return 0
  // Newer strategies with good engagement per day
  const engagementPerDay = (s.voteScore + s.followerCount) / Math.max(ageDays, 1)
  return engagementPerDay
}

/** Build a leaderboard from strategies */
export function buildLeaderboard(
  strategies: PublicStrategy[],
  sort: LeaderboardSort,
  limit: number = 25
): CommunityLeaderboard {
  const sorted = sortStrategies(strategies, sort)
  const entries: LeaderboardEntry[] = sorted.slice(0, limit).map((strategy, i) => ({
    rank: i + 1,
    strategy,
    metric: sort === 'top_roi' ? strategy.livePerformance.roi :
            sort === 'most_followed' ? strategy.followerCount :
            sort === 'hot' ? hotScore(strategy) :
            sort === 'rising' ? risingScore(strategy) :
            new Date(strategy.publishedAt).getTime(),
  }))

  return {
    period: 'all_time',
    entries,
  }
}

// ---- Publishing Validation ----

export interface PublishValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateForPublishing(strategy: Partial<PublicStrategy>): PublishValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!strategy.name?.trim()) errors.push('Strategy name is required')
  if ((strategy.name?.length ?? 0) > 60) errors.push('Name must be 60 characters or less')
  if (!strategy.description?.trim()) errors.push('Description is required')
  if ((strategy.description?.length ?? 0) < 20) errors.push('Description must be at least 20 characters')
  if (!strategy.conditions || strategy.conditions.length === 0) errors.push('At least one filter condition is required')
  if (!strategy.tags || strategy.tags.length === 0) errors.push('At least one tag is required')
  if ((strategy.tags?.length ?? 0) > 5) errors.push('Maximum 5 tags allowed')

  // Backtest checks
  if (!strategy.backtest || strategy.backtest.totalGames < 20) {
    errors.push('A backtest with at least 20 games is required before publishing')
  }

  // Warnings
  if (strategy.backtest && strategy.backtest.sampleSize === 'low') {
    warnings.push('Low sample size — results may not be reliable')
  }
  if (strategy.backtest && strategy.backtest.hitRate < 0.48) {
    warnings.push('Hit rate is below 48% — consider refining your strategy')
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ---- Author Profile Builder ----

export function buildAuthorProfile(
  author: { id: string; displayName: string; avatarUrl?: string; bio?: string; joinedAt: string },
  strategies: PublicStrategy[]
): AuthorProfile {
  const roiValues = strategies
    .filter(s => s.livePerformance.games >= 10)
    .map(s => s.livePerformance.roi)

  const avgROI = roiValues.length > 0
    ? roiValues.reduce((sum, r) => sum + r, 0) / roiValues.length
    : 0

  const bestROI = roiValues.length > 0 ? Math.max(...roiValues) : 0

  const totalFollowers = strategies.reduce((sum, s) => sum + s.followerCount, 0)

  return {
    id: author.id,
    displayName: author.displayName,
    avatarUrl: author.avatarUrl,
    bio: author.bio,
    reputation: computeReputation(strategies),
    joinedAt: author.joinedAt,
    totalStrategiesPublished: strategies.length,
    totalFollowers,
    totalFollowing: 0, // populated from DB
    avgStrategyROI: avgROI,
    bestStrategyROI: bestROI,
    strategies,
  }
}

function computeReputation(strategies: PublicStrategy[]): number {
  let rep = 0
  for (const s of strategies) {
    rep += s.voteScore * 2
    rep += s.followerCount * 3
    if (s.livePerformance.games >= 20 && s.livePerformance.roi > 0) rep += 50
    if (s.backtest.totalGames >= 200) rep += 20
  }
  return Math.round(rep)
}

// ---- DB Row Mappers ----

export function mapRowToStrategy(row: Record<string, unknown>): PublicStrategy {
  const backtest = typeof row.backtest_json === 'string'
    ? JSON.parse(row.backtest_json)
    : (row.backtest_json ?? { seasons: [], totalGames: 0, hitRate: 0, roi: 0, maxDrawdown: 0, sharpeRatio: 0, sampleSize: 'insufficient' })

  const livePerf = typeof row.live_performance_json === 'string'
    ? JSON.parse(row.live_performance_json)
    : (row.live_performance_json ?? { season: '', games: 0, hits: 0, hitRate: 0, roi: 0, lastMatchDate: '' })

  const conditions = typeof row.conditions_json === 'string'
    ? JSON.parse(row.conditions_json)
    : (row.conditions_json ?? [])

  const sparkline = typeof row.equity_sparkline_json === 'string'
    ? JSON.parse(row.equity_sparkline_json)
    : (row.equity_sparkline_json ?? [])

  const tags = typeof row.tags === 'string'
    ? JSON.parse(row.tags)
    : (row.tags ?? [])

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    sport: row.sport as PublicStrategy['sport'],
    propType: (row.prop_type as string) ?? '',
    direction: (row.direction as PublicStrategy['direction']) ?? 'both',
    conditions,
    author: {
      id: (row.author_id as string) ?? '',
      displayName: (row.author_display_name as string) ?? 'Unknown',
      avatarUrl: row.author_avatar_url as string | undefined,
      reputation: (row.author_reputation as number) ?? 0,
      totalPublished: (row.author_total_published as number) ?? 0,
    },
    backtest,
    livePerformance: livePerf,
    equitySparkline: sparkline,
    followerCount: (row.follower_count as number) ?? 0,
    forkCount: (row.fork_count as number) ?? 0,
    commentCount: (row.comment_count as number) ?? 0,
    voteScore: (row.vote_score as number) ?? 0,
    forkedFrom: row.forked_from_id ? {
      id: row.forked_from_id as string,
      name: (row.forked_from_name as string) ?? '',
      authorName: (row.forked_from_author as string) ?? '',
    } : undefined,
    publishedAt: (row.published_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
    tags,
  }
}

export function mapRowToComment(row: Record<string, unknown>): StrategyComment {
  return {
    id: row.id as string,
    authorId: (row.author_id as string) ?? '',
    authorDisplayName: (row.author_display_name as string) ?? 'Unknown',
    authorAvatarUrl: row.author_avatar_url as string | undefined,
    body: (row.body as string) ?? '',
    parentId: row.parent_id as string | undefined,
    upvotes: (row.upvotes as number) ?? 0,
    createdAt: (row.created_at as string) ?? '',
  }
}
