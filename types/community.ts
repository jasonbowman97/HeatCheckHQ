// ============================================================
// types/community.ts — Community Strategy Library types
// ============================================================

import type { Sport } from './shared'
import type { FilterCondition, BacktestResult } from './edge-lab'

export interface PublicStrategy {
  id: string
  name: string
  description: string
  sport: Sport
  propType: string
  direction: 'over' | 'under' | 'both'
  conditions: FilterCondition[]

  author: {
    id: string
    displayName: string
    avatarUrl?: string
    reputation: number
    totalPublished: number
  }

  backtest: {
    seasons: string[]
    totalGames: number
    hitRate: number
    roi: number
    maxDrawdown: number
    sharpeRatio: number
    sampleSize: 'insufficient' | 'low' | 'moderate' | 'high'
  }

  livePerformance: {
    season: string
    games: number
    hits: number
    hitRate: number
    roi: number
    lastMatchDate: string
  }

  equitySparkline: Array<{ date: string; value: number }>

  // Social
  followerCount: number
  forkCount: number
  commentCount: number
  voteScore: number

  // Fork info
  forkedFrom?: {
    id: string
    name: string
    authorName: string
  }

  // User's relationship
  userFollowing?: boolean
  userVote?: 1 | -1 | null
  userForked?: boolean

  // Metadata
  publishedAt: string
  updatedAt: string
  tags: string[]
}

export interface StrategyComment {
  id: string
  authorId: string
  authorDisplayName: string
  authorAvatarUrl?: string
  body: string
  parentId?: string
  upvotes: number
  createdAt: string
  replies?: StrategyComment[]
}

export interface CommunityLeaderboard {
  period: 'all_time' | 'this_season' | 'last_30_days' | 'this_week'
  entries: LeaderboardEntry[]
}

export interface LeaderboardEntry {
  rank: number
  strategy: PublicStrategy
  metric: number
}

export interface AuthorProfile {
  id: string
  displayName: string
  avatarUrl?: string
  bio?: string
  reputation: number
  joinedAt: string
  totalStrategiesPublished: number
  totalFollowers: number
  totalFollowing: number
  avgStrategyROI: number
  bestStrategyROI: number
  strategies: PublicStrategy[]
}

// Verification badge types
export type VerificationBadge = 'backtested' | 'high_sample' | 'live_verified' | 'profitable' | 'consistent'

export interface StrategyBadge {
  type: VerificationBadge
  label: string
  description: string
  earned: boolean
}

export function getStrategyBadges(strategy: PublicStrategy): StrategyBadge[] {
  return [
    {
      type: 'backtested',
      label: 'Backtested',
      description: 'Backtest with 50+ games',
      earned: strategy.backtest.totalGames >= 50,
    },
    {
      type: 'high_sample',
      label: 'High Sample',
      description: 'Backtest with 200+ games',
      earned: strategy.backtest.totalGames >= 200,
    },
    {
      type: 'live_verified',
      label: 'Live Verified',
      description: '20+ live season matches tracked',
      earned: strategy.livePerformance.games >= 20,
    },
    {
      type: 'profitable',
      label: 'Profitable',
      description: 'Live season ROI > 0% with 20+ games',
      earned: strategy.livePerformance.games >= 20 && strategy.livePerformance.roi > 0,
    },
    {
      type: 'consistent',
      label: 'Consistent',
      description: 'Profitable in 2+ of last 3 seasons',
      earned: false, // requires checking season breakdown
    },
  ]
}
