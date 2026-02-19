-- ============================================================
-- 004_check_my_prop_schema.sql
-- Database schema for Check My Prop, Edge Lab, and Community features
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CUSTOM FILTERS (Edge Lab)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sport VARCHAR(10) NOT NULL,
  prop_type VARCHAR(50),
  direction VARCHAR(10),
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,

  -- Cached backtest
  cached_backtest JSONB,
  backtest_seasons TEXT[],
  backtest_updated_at TIMESTAMPTZ,

  -- Live season tracking
  live_season VARCHAR(10),
  live_matches INTEGER DEFAULT 0,
  live_hits INTEGER DEFAULT 0,
  live_hit_rate DECIMAL(5,4),
  live_roi DECIMAL(8,4),
  live_updated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_fired_at TIMESTAMPTZ,
  times_fired INTEGER DEFAULT 0,

  -- Community fields
  published_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  forked_from_id UUID REFERENCES custom_filters(id),

  CONSTRAINT valid_sport CHECK (sport IN ('nba', 'mlb', 'nfl'))
);

CREATE INDEX IF NOT EXISTS idx_filters_user ON custom_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_filters_public ON custom_filters(is_public, follower_count DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_filters_sport ON custom_filters(sport);

-- ============================================================
-- FILTER MATCH LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS filter_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  stat VARCHAR(50) NOT NULL,
  line DECIMAL(8,2) NOT NULL,
  direction VARCHAR(10) NOT NULL,

  matched_conditions JSONB,
  convergence_score INTEGER,

  actual_value DECIMAL(8,2),
  result VARCHAR(10),
  margin DECIMAL(8,2),

  game_date DATE NOT NULL,
  season VARCHAR(10) NOT NULL,
  is_live_season BOOLEAN DEFAULT false,

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  scored_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_matches_filter ON filter_matches(filter_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_pending ON filter_matches(result) WHERE result IS NULL;
CREATE INDEX IF NOT EXISTS idx_matches_season ON filter_matches(filter_id, season);

-- ============================================================
-- BACKTEST RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS backtest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  seasons TEXT[] NOT NULL,

  total_games INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  misses INTEGER NOT NULL,
  hit_rate DECIMAL(5,4) NOT NULL,
  roi DECIMAL(8,4),
  total_profit DECIMAL(10,4),
  max_drawdown DECIMAL(10,4),
  longest_win INTEGER,
  longest_loss INTEGER,
  sharpe_ratio DECIMAL(8,4),

  results_json JSONB NOT NULL,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_filter ON backtest_runs(filter_id, created_at DESC);

-- ============================================================
-- RESEARCH CRITERIA (Saved Alerts)
-- ============================================================
CREATE TABLE IF NOT EXISTS research_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sport VARCHAR(10) NOT NULL,
  stat VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,

  total_matches INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  misses INTEGER DEFAULT 0,
  hit_rate DECIMAL(5,4) DEFAULT 0,
  avg_margin DECIMAL(8,2) DEFAULT 0,
  last_match_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_criteria_user ON research_criteria(user_id);

-- ============================================================
-- DAILY CHECK-INS & STREAKS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  steps JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, date DESC);

CREATE TABLE IF NOT EXISTS research_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days_completed INTEGER DEFAULT 0,
  streak_shields INTEGER DEFAULT 0,
  shield_used_dates DATE[],
  tier VARCHAR(20) DEFAULT 'starter',
  milestones JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_grades (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_grade VARCHAR(5) DEFAULT 'N/A',
  grade_history JSONB DEFAULT '[]',
  total_checks INTEGER DEFAULT 0,
  data_aligned_picks INTEGER DEFAULT 0,
  data_opposed_picks INTEGER DEFAULT 0,
  process_accuracy DECIMAL(5,4) DEFAULT 0,
  luck_rate DECIMAL(5,4) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER LEANS (saved prop checks)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_leans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  sport VARCHAR(10) NOT NULL,
  stat VARCHAR(50) NOT NULL,
  line DECIMAL(8,2) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  game_id VARCHAR(50),
  game_date DATE NOT NULL,
  convergence_score INTEGER,
  confidence INTEGER,

  actual_value DECIMAL(8,2),
  result VARCHAR(10),
  margin DECIMAL(8,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  scored_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leans_user ON user_leans(user_id, game_date DESC);
CREATE INDEX IF NOT EXISTS idx_leans_pending ON user_leans(result) WHERE result IS NULL;

-- ============================================================
-- STRATEGY FOLLOWS (Community)
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  notify_on_match BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_user ON strategy_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_filter ON strategy_follows(filter_id);

-- ============================================================
-- STRATEGY COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES strategy_comments(id),
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_filter ON strategy_comments(filter_id, created_at DESC);

-- ============================================================
-- STRATEGY VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, filter_id)
);

-- ============================================================
-- STRATEGY PERFORMANCE SNAPSHOTS (daily for sparklines)
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_performance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filter_id UUID NOT NULL REFERENCES custom_filters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cumulative_profit DECIMAL(10,4) NOT NULL,
  cumulative_games INTEGER NOT NULL,
  cumulative_hits INTEGER NOT NULL,
  hit_rate DECIMAL(5,4) NOT NULL,
  roi DECIMAL(8,4) NOT NULL,
  UNIQUE(filter_id, date)
);

CREATE INDEX IF NOT EXISTS idx_perf_filter_date ON strategy_performance_daily(filter_id, date DESC);

-- ============================================================
-- IMPORTED SHEETS
-- ============================================================
CREATE TABLE IF NOT EXISTS imported_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  row_count INTEGER NOT NULL,
  parsed_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'processing',
  bets JSONB NOT NULL,
  enriched BOOLEAN DEFAULT false,
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PROFILE EXTENSIONS (for community features)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_public_profile') THEN
    ALTER TABLE profiles ADD COLUMN is_public_profile BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_followers') THEN
    ALTER TABLE profiles ADD COLUMN total_followers INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'community_reputation') THEN
    ALTER TABLE profiles ADD COLUMN community_reputation INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE custom_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_leans ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_sheets ENABLE ROW LEVEL SECURITY;

-- Users can view/edit own data
CREATE POLICY "Users own filters" ON custom_filters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own matches" ON filter_matches FOR ALL USING (filter_id IN (SELECT id FROM custom_filters WHERE user_id = auth.uid()));
CREATE POLICY "Users own backtests" ON backtest_runs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own criteria" ON research_criteria FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own checkins" ON daily_checkins FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own streaks" ON research_streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own grades" ON research_grades FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own leans" ON user_leans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own follows" ON strategy_follows FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own comments" ON strategy_comments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own votes" ON strategy_votes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own imports" ON imported_sheets FOR ALL USING (user_id = auth.uid());

-- Public strategies are viewable by all authenticated users
CREATE POLICY "Public filters visible" ON custom_filters FOR SELECT USING (is_public = true);
CREATE POLICY "Public matches visible" ON filter_matches FOR SELECT USING (
  filter_id IN (SELECT id FROM custom_filters WHERE is_public = true)
);
-- Public performance snapshots
CREATE POLICY "Public perf visible" ON strategy_performance_daily FOR SELECT USING (
  filter_id IN (SELECT id FROM custom_filters WHERE is_public = true)
);
-- Public comments visible
CREATE POLICY "Public comments visible" ON strategy_comments FOR SELECT USING (
  filter_id IN (SELECT id FROM custom_filters WHERE is_public = true)
);
