-- FlowCast Initial Schema
-- Run this in Supabase SQL Editor or via migration tool

-- ─── OPPORTUNITIES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  niche        text NOT NULL,
  score        int NOT NULL DEFAULT 0,
  trend_pct    int NOT NULL DEFAULT 0,
  competition  text NOT NULL DEFAULT 'Medium',
  cpm_range    text NOT NULL DEFAULT '',
  why          text NOT NULL DEFAULT '',
  format       text NOT NULL DEFAULT '',
  platforms    text[] NOT NULL DEFAULT '{}',
  drafts       jsonb NOT NULL DEFAULT '[]',
  status       text NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── CHANNELS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS channels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id   uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  name             text NOT NULL,
  niche            text NOT NULL,
  prompt           text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'active',
  platforms        text[] NOT NULL DEFAULT '{}',
  posting_freq     int NOT NULL DEFAULT 1,
  subscribers      int NOT NULL DEFAULT 0,
  total_views      int NOT NULL DEFAULT 0,
  monthly_revenue  decimal(12,2) NOT NULL DEFAULT 0,
  health_score     int NOT NULL DEFAULT 50,
  next_upload_at   timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── VIDEOS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id           uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title                text NOT NULL,
  script               text NOT NULL DEFAULT '',
  hashtags             text[] NOT NULL DEFAULT '{}',
  status               text NOT NULL DEFAULT 'queued',
  platform_urls        jsonb NOT NULL DEFAULT '{}',
  views                int NOT NULL DEFAULT 0,
  watch_time_seconds   int NOT NULL DEFAULT 0,
  ctr                  decimal(5,4) NOT NULL DEFAULT 0,
  revenue              decimal(12,2) NOT NULL DEFAULT 0,
  published_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── ANALYTICS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id           uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  date                 date NOT NULL,
  views                int NOT NULL DEFAULT 0,
  new_subscribers      int NOT NULL DEFAULT 0,
  watch_time_seconds   int NOT NULL DEFAULT 0,
  revenue              decimal(12,2) NOT NULL DEFAULT 0,
  avg_ctr              decimal(5,4) NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, date)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_opportunities_status    ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_score     ON opportunities(score DESC);
CREATE INDEX IF NOT EXISTS idx_channels_status         ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_opportunity    ON channels(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel          ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status           ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_published        ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_channel_date  ON analytics(channel_id, date DESC);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and write all rows.
-- The API uses the service key which bypasses RLS entirely.
-- These policies protect direct anon/user key access.

CREATE POLICY "authenticated_all_opportunities" ON opportunities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_channels" ON channels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_videos" ON videos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_analytics" ON analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
