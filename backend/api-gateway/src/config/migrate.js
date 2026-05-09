require('dotenv').config();
const { query } = require('../../../shared/database');

const SCHEMA = `
-- ═══════════════════════════════════════════════════════════
-- NOOR AL-ILM v2.0 — COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── Users & Auth ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user'
    CHECK (role IN ('user','student','teacher','scholar','moderator','admin','superadmin')),
  avatar_url TEXT,
  bio TEXT,
  bio_ar TEXT,
  locale VARCHAR(10) DEFAULT 'ar',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_2fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(100),
  oauth_provider VARCHAR(20),
  oauth_id VARCHAR(100),
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  reputation_points INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('simple', name || ' ' || COALESCE(email,'')));

-- ── Refresh Tokens ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  device_info TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── Creators ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  channel_name VARCHAR(100) NOT NULL,
  channel_slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  description_ar TEXT,
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

-- ── Quran Data ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quran_surahs (
  id INTEGER PRIMARY KEY,
  name_arabic VARCHAR(100) NOT NULL,
  name_transliteration VARCHAR(100),
  name_english VARCHAR(100),
  revelation_type VARCHAR(10) CHECK (revelation_type IN ('Meccan','Medinan')),
  verses_count INTEGER NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quran_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surah_id INTEGER REFERENCES quran_surahs(id),
  verse_number INTEGER NOT NULL,
  text_arabic TEXT NOT NULL,
  text_uthmani TEXT,
  translation_en TEXT,
  translation_ru TEXT,
  transliteration TEXT,
  audio_url TEXT,
  juz INTEGER,
  hizb INTEGER,
  page INTEGER,
  UNIQUE(surah_id, verse_number)
);

CREATE INDEX IF NOT EXISTS idx_quran_verses_surah ON quran_verses(surah_id);
CREATE INDEX IF NOT EXISTS idx_quran_verses_search ON quran_verses USING gin(to_tsvector('arabic', text_arabic));

-- ── Quran Progress ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quran_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  surah_id INTEGER REFERENCES quran_surahs(id),
  verse_id UUID REFERENCES quran_verses(id),
  progress_type VARCHAR(20) CHECK (progress_type IN ('reading','memorization','recitation')),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('not_started','in_progress','completed','reviewing')),
  accuracy_score INTEGER,
  repetitions INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id, progress_type)
);

CREATE INDEX IF NOT EXISTS idx_quran_progress_user ON quran_progress(user_id);

-- ── Courses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500),
  title_ru VARCHAR(500),
  description TEXT,
  description_ar TEXT,
  description_ru TEXT,
  slug VARCHAR(600) UNIQUE,
  category VARCHAR(50) NOT NULL,
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced','all')),
  language VARCHAR(10) DEFAULT 'ar',
  thumbnail_url TEXT,
  trailer_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  duration_hours INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  certificate_enabled BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  outcomes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('simple', COALESCE(title,'') || ' ' || COALESCE(title_ar,'')));

-- ── Course Sections & Lessons ─────────────────────────────
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  content TEXT,
  video_url TEXT,
  video_duration_seconds INTEGER DEFAULT 0,
  lesson_type VARCHAR(20) DEFAULT 'video' CHECK (lesson_type IN ('video','text','quiz','assignment','live')),
  is_free BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id);

-- ── Enrollments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed_lessons UUID[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  certificate_issued_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ── Quizzes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT,
  question_type VARCHAR(20) DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Forum ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  name_ru VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#16a34a',
  icon VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_search ON forum_posts USING gin(to_tsvector('simple', title || ' ' || content));

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post ON forum_replies(post_id);

CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- ── AI Imam ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  category VARCHAR(50) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'ar',
  message_count INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  references JSONB DEFAULT '[]',
  confidence_score DECIMAL(3,2),
  tokens_used INTEGER DEFAULT 0,
  model_used VARCHAR(100),
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);

-- ── RAG Knowledge Base ────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500),
  content TEXT NOT NULL,
  source_type VARCHAR(50) CHECK (source_type IN ('quran','hadith','fatwa','article','book','scholar')),
  source_name VARCHAR(255),
  language VARCHAR(10) DEFAULT 'ar',
  tags TEXT[] DEFAULT '{}',
  embedding_id VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_documents(source_type);

-- ── Videos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500),
  title_ru VARCHAR(500),
  description TEXT,
  description_ar TEXT,
  slug VARCHAR(600) UNIQUE,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'ar',
  original_file_key TEXT,
  storage_provider VARCHAR(20) DEFAULT 'local',
  hls_manifest_key TEXT,
  variants JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  ai_thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  file_size_bytes BIGINT DEFAULT 0,
  resolution VARCHAR(20),
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_script TEXT,
  transcript TEXT,
  subtitles JSONB DEFAULT '[]',
  status VARCHAR(30) DEFAULT 'processing'
    CHECK (status IN ('draft','processing','transcoding','ready','failed','deleted','scheduled')),
  visibility VARCHAR(20) DEFAULT 'private'
    CHECK (visibility IN ('public','private','unlisted','members_only')),
  is_approved BOOLEAN DEFAULT FALSE,
  moderation_status VARCHAR(20) DEFAULT 'pending',
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status, visibility, is_approved);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- ── Video subtitles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_subtitles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  label VARCHAR(50) NOT NULL,
  file_url TEXT,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Generation Jobs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'queued'
    CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  model_used VARCHAR(100),
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Transcoding Jobs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcoding_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'queued',
  input_key TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Watch History ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  last_position_seconds INTEGER DEFAULT 0,
  completion_percent INTEGER DEFAULT 0,
  watch_duration_seconds INTEGER DEFAULT 0,
  device_type VARCHAR(20),
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- ── Video Likes & Bookmarks ───────────────────────────────
CREATE TABLE IF NOT EXISTS video_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS video_bookmarks (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- ── Video Comments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Playlists ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  visibility VARCHAR(20) DEFAULT 'public',
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_videos (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, video_id)
);

-- ── Live Streams ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  rtmp_url TEXT,
  hls_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle','live','ended','error')),
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  chat_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Media Library ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  title_ru VARCHAR(255),
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('audio','video','pdf','article','podcast','book','magazine')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'ar',
  duration_minutes INTEGER,
  file_size_mb DECIMAL(10,2),
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  notify_on_upload BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, creator_id)
);

-- ── Notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  message TEXT,
  message_ar TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ── Video Analytics ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  watch_time_seconds BIGINT DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  UNIQUE(video_id, date)
);

-- ── Content Reports ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('video','post','reply','comment','user','ai_message')),
  content_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Prayer Times Cache ────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_times_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  fajr TIME NOT NULL,
  sunrise TIME,
  dhuhr TIME NOT NULL,
  asr TIME NOT NULL,
  maghrib TIME NOT NULL,
  isha TIME NOT NULL,
  method INTEGER DEFAULT 4,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city, country, date)
);

-- ── Islamic Calendar Events ───────────────────────────────
CREATE TABLE IF NOT EXISTS islamic_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  name_ru VARCHAR(255),
  description_ar TEXT,
  hijri_month INTEGER,
  hijri_day INTEGER,
  is_recurring BOOLEAN DEFAULT TRUE,
  event_type VARCHAR(30) DEFAULT 'holiday',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Activity Logs (IP tracking, page views, sessions) ──
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id      VARCHAR(255),
  ip_address      INET,
  user_agent      VARCHAR(500),
  method          VARCHAR(10) NOT NULL,
  path            VARCHAR(500) NOT NULL,
  query_string    TEXT,
  status_code     SMALLINT,
  response_time_ms INTEGER,
  referer         VARCHAR(500),
  country         VARCHAR(100),
  city            VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user    ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_ip      ON user_activity_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_path    ON user_activity_logs(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_session ON user_activity_logs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_logs(created_at DESC);

-- ── Page Views (aggregated daily) ────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         BIGSERIAL PRIMARY KEY,
  path       VARCHAR(500) NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  referrer   VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_path    ON page_views(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_user    ON page_views(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);

-- ── Sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id              VARCHAR(255) PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address      INET,
  user_agent      VARCHAR(500),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_count      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON user_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active  ON user_sessions(is_active, last_active_at DESC);

-- ── Site Analytics ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_page_views BIGINT DEFAULT 0,
  total_video_views BIGINT DEFAULT 0,
  total_ai_queries INTEGER DEFAULT 0,
  total_course_enrollments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Updated_at triggers ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','creators','courses','forum_posts','forum_replies','ai_conversations','ai_generation_jobs','videos','video_comments','quran_progress']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;
`;

async function migrate() {
  try {
    console.log('Running Noor Al-Ilm v2.0 migrations...');
    await query(SCHEMA);
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
