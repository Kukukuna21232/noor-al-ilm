require('dotenv').config();
const { query } = require('./database');
const logger = require('../utils/logger');

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  channel_name VARCHAR(100) NOT NULL,
  channel_slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  subscriber_count INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500),
  title_ru VARCHAR(500),
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  slug VARCHAR(600) UNIQUE,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'ar',
  original_file_key TEXT,
  storage_provider VARCHAR(20) DEFAULT 'local',
  hls_manifest_key TEXT,
  variants JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  ai_thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  resolution VARCHAR(20),
  fps INTEGER,
  codec VARCHAR(20),
  format VARCHAR(10),
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_script TEXT,
  ai_voice_id VARCHAR(100),
  subtitles JSONB DEFAULT '[]',
  transcript TEXT,
  status VARCHAR(30) DEFAULT 'processing'
    CHECK (status IN ('draft','processing','transcoding','ready','failed','deleted','scheduled')),
  visibility VARCHAR(20) DEFAULT 'private'
    CHECK (visibility IN ('public','private','unlisted','members_only')),
  is_approved BOOLEAN DEFAULT FALSE,
  moderation_status VARCHAR(20) DEFAULT 'pending'
    CHECK (moderation_status IN ('pending','approved','rejected','flagged')),
  moderation_notes TEXT,
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  course_id UUID,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status, visibility, is_approved);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);

-- AI Generation Jobs
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  job_type VARCHAR(50) NOT NULL
    CHECK (job_type IN ('text_to_video','script_gen','voiceover','subtitle_gen','translation','thumbnail','avatar')),
  status VARCHAR(20) DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  model_used VARCHAR(100),
  tokens_used INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_creator ON ai_generation_jobs(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_generation_jobs(status);

-- Transcoding Jobs
CREATE TABLE IF NOT EXISTS transcoding_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed')),
  input_key TEXT NOT NULL,
  output_keys JSONB DEFAULT '[]',
  profiles JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  worker_id VARCHAR(100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtitles
CREATE TABLE IF NOT EXISTS subtitles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  label VARCHAR(50) NOT NULL,
  file_key TEXT NOT NULL,
  file_url TEXT,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch History
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  watch_duration_seconds INTEGER DEFAULT 0,
  completion_percent INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  device_type VARCHAR(20),
  quality_watched VARCHAR(10),
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, watched_at DESC);

-- Video Likes
CREATE TABLE IF NOT EXISTS video_likes (
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS video_bookmarks (
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  note TEXT,
  timestamp_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER,
  likes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_video ON video_comments(video_id, created_at DESC);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_videos (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (playlist_id, video_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  notify_on_upload BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, creator_id)
);

-- Live Streams
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  rtmp_url TEXT,
  hls_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'idle'
    CHECK (status IN ('idle','live','ended','error')),
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  chat_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Analytics
CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  watch_time_seconds BIGINT DEFAULT 0,
  avg_view_duration_seconds INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  UNIQUE(video_id, date)
);

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL
    CHECK (reason IN ('spam','inappropriate','copyright','misinformation','other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER ai_jobs_updated_at BEFORE UPDATE ON ai_generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function migrate() {
  try {
    logger.info('Running video platform migrations...');
    await query(SCHEMA);
    logger.info('Video platform migrations complete');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
