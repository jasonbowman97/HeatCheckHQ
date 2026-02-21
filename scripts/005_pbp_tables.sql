-- ============================================================
-- 005_pbp_tables.sql — Play-by-Play data pipeline tables
-- ============================================================
-- Stores extracted scoring events from ESPN play-by-play data.
-- Powers: First Basket, First Team FG, First 3 Min, 2nd Half props.
-- ============================================================

-- ──── Core play-by-play scoring events ────
CREATE TABLE IF NOT EXISTS pbp_game_events (
  id              BIGSERIAL PRIMARY KEY,
  game_id         TEXT NOT NULL,           -- ESPN event ID (e.g. "401584714")
  game_date       DATE NOT NULL,
  season          INT NOT NULL,            -- e.g. 2025
  home_team       TEXT NOT NULL,           -- ESPN abbreviation (e.g. "LAL")
  away_team       TEXT NOT NULL,
  period          INT NOT NULL,            -- 1-4 (or 5+ for OT)
  clock_seconds   REAL NOT NULL,           -- seconds remaining in quarter (720 = start of quarter)
  event_type      TEXT NOT NULL,           -- 'field_goal', 'three_pointer', 'free_throw', 'dunk', 'layup', etc.
  scoring_play    BOOLEAN NOT NULL DEFAULT FALSE,
  score_value     INT,                     -- 1, 2, or 3 (NULL for non-scoring plays)
  athlete_id      TEXT,                    -- ESPN athlete ID (e.g. "3032977")
  athlete_name    TEXT,                    -- Full name for convenience (e.g. "LeBron James")
  team            TEXT NOT NULL,           -- team abbreviation of the player/play
  play_text       TEXT,                    -- ESPN play description text
  home_score      INT,
  away_score      INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──── Indexes for fast dashboard queries ────

-- Date-based queries (all dashboards filter by date range)
CREATE INDEX IF NOT EXISTS idx_pbp_game_date ON pbp_game_events(game_date);

-- Player lookups across dates (First Basket, First 3 Min, 2H First Basket)
CREATE INDEX IF NOT EXISTS idx_pbp_athlete ON pbp_game_events(athlete_id, game_date DESC);

-- Team lookups (First Team FG, 2H First Team FG)
CREATE INDEX IF NOT EXISTS idx_pbp_team ON pbp_game_events(team, game_date DESC);

-- Per-game queries (ingestion dedup check, per-game aggregation)
CREATE INDEX IF NOT EXISTS idx_pbp_game ON pbp_game_events(game_id);

-- Scoring play + period filter (used by all "first of period" queries)
CREATE INDEX IF NOT EXISTS idx_pbp_scoring_period ON pbp_game_events(scoring_play, period, game_id, clock_seconds DESC)
  WHERE scoring_play = TRUE;

-- Dedup constraint: no two identical plays in the same game
CREATE UNIQUE INDEX IF NOT EXISTS idx_pbp_dedup
  ON pbp_game_events(game_id, period, clock_seconds, athlete_id, event_type);

-- ──── Materialized View: precomputed "firsts" per game ────
-- Avoids scanning all plays at query time. Refreshed after ingestion.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_game_firsts AS
WITH ranked_plays AS (
  SELECT
    game_id, game_date, season, home_team, away_team,
    period, clock_seconds, athlete_id, athlete_name, team,
    score_value, play_text,
    -- Q1 first basket overall (highest clock_seconds = earliest in the quarter)
    ROW_NUMBER() OVER (
      PARTITION BY game_id
      ORDER BY clock_seconds DESC
    ) AS rn_q1_first_basket,
    -- Q1 first scoring play per team
    ROW_NUMBER() OVER (
      PARTITION BY game_id, team
      ORDER BY clock_seconds DESC
    ) AS rn_q1_first_team_fg
  FROM pbp_game_events
  WHERE scoring_play = TRUE AND period = 1
),
ranked_q3 AS (
  SELECT
    game_id, game_date, season, home_team, away_team,
    period, clock_seconds, athlete_id, athlete_name, team,
    score_value, play_text,
    -- Q3 first basket overall
    ROW_NUMBER() OVER (
      PARTITION BY game_id
      ORDER BY clock_seconds DESC
    ) AS rn_q3_first_basket,
    -- Q3 first scoring play per team
    ROW_NUMBER() OVER (
      PARTITION BY game_id, team
      ORDER BY clock_seconds DESC
    ) AS rn_q3_first_team_fg
  FROM pbp_game_events
  WHERE scoring_play = TRUE AND period = 3
)
-- Q1 first basket (1 per game)
SELECT game_id, game_date, season, home_team, away_team,
       period, clock_seconds, athlete_id, athlete_name, team,
       score_value, play_text, 'q1_first_basket' AS category
FROM ranked_plays WHERE rn_q1_first_basket = 1

UNION ALL

-- Q1 first team FG (1 per team per game = 2 per game)
SELECT game_id, game_date, season, home_team, away_team,
       period, clock_seconds, athlete_id, athlete_name, team,
       score_value, play_text, 'q1_first_team_fg' AS category
FROM ranked_plays WHERE rn_q1_first_team_fg = 1

UNION ALL

-- Q3 first basket (1 per game)
SELECT game_id, game_date, season, home_team, away_team,
       period, clock_seconds, athlete_id, athlete_name, team,
       score_value, play_text, 'q3_first_basket' AS category
FROM ranked_q3 WHERE rn_q3_first_basket = 1

UNION ALL

-- Q3 first team FG (1 per team per game = 2 per game)
SELECT game_id, game_date, season, home_team, away_team,
       period, clock_seconds, athlete_id, athlete_name, team,
       score_value, play_text, 'q3_first_team_fg' AS category
FROM ranked_q3 WHERE rn_q3_first_team_fg = 1;

-- Index on materialized view for fast category lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_firsts_pk
  ON mv_game_firsts(game_id, category, team);

CREATE INDEX IF NOT EXISTS idx_mv_firsts_category
  ON mv_game_firsts(category, athlete_id, game_date DESC);

CREATE INDEX IF NOT EXISTS idx_mv_firsts_team
  ON mv_game_firsts(category, team, game_date DESC);

-- ──── Function to refresh the materialized view (called from API route via RPC) ────
CREATE OR REPLACE FUNCTION refresh_mv_game_firsts()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_game_firsts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
