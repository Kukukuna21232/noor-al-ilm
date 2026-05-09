-- ═════════════════════════════════════════════════════════════════════════════
-- NOOR AL-ILM DATABASE SCHEMA - INITIAL MIGRATION
-- Version: 1.0.0
-- Created: 2024-01-01
-- Description: Core database schema for Islamic educational platform
-- ═════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ═════════════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═════════════════════════════════════════════════════════════════════════════

-- Users table with comprehensive profile information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'ar',
    preferred_locale VARCHAR(10) DEFAULT 'ar',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User roles and permissions
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'moderator', 'teacher', 'student', 'guest')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role)
);

-- User preferences and settings
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'ar',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',
    currency VARCHAR(10) DEFAULT 'USD',
    privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
    show_profile BOOLEAN DEFAULT true,
    allow_messages BOOLEAN DEFAULT true,
    allow_friend_requests BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- ISLAMIC CONTENT
-- ═════════════════════════════════════════════════════════════════════════════

-- Quran Surahs
CREATE TABLE quran_surahs (
    id SERIAL PRIMARY KEY,
    surah_number INTEGER UNIQUE NOT NULL,
    arabic_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100) NOT NULL,
    russian_name VARCHAR(100) NOT NULL,
    urdu_name VARCHAR(100),
    revelation_type VARCHAR(20) CHECK (revelation_type IN ('meccan', 'medinan')),
    total_verses INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quran Verses
CREATE TABLE quran_verses (
    id SERIAL PRIMARY KEY,
    surah_id INTEGER REFERENCES quran_surahs(id),
    verse_number INTEGER NOT NULL,
    arabic_text TEXT NOT NULL,
    russian_translation TEXT,
    english_translation TEXT,
    urdu_translation TEXT,
    transliteration TEXT,
    word_by_word_arabic TEXT[],
    word_by_word_translation JSONB,
    tajweed_rules TEXT[],
    audio_url_mp3 TEXT,
    audio_url_wav TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(surah_id, verse_number)
);

-- Hadith Collections
CREATE TABLE hadith_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(100),
    english_name VARCHAR(100),
    russian_name VARCHAR(100),
    narrator VARCHAR(100),
    description TEXT,
    total_hadith INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hadiths
CREATE TABLE hadiths (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES hadith_collections(id),
    hadith_number VARCHAR(50),
    arabic_text TEXT NOT NULL,
    russian_translation TEXT,
    english_translation TEXT,
    urdu_translation TEXT,
    narrator_chain TEXT,
    chapter VARCHAR(100),
    book VARCHAR(100),
    authenticity VARCHAR(50) CHECK (authenticity IN ('sahih', 'hasan', 'daif', 'maudu')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prayer Times Calculation Methods
CREATE TABLE prayer_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    fajr_angle DECIMAL(4,2),
    isha_angle DECIMAL(4,2),
    isha_interval INTEGER,
    maghrib_interval INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════════════════════
-- EDUCATIONAL CONTENT
-- ═════════════════════════════════════════════════════════════════════════════

-- Course Categories
CREATE TABLE course_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(100),
    russian_name VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES course_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    arabic_title VARCHAR(200),
    russian_title VARCHAR(200),
    description TEXT,
    arabic_description TEXT,
    russian_description TEXT,
    instructor_id UUID REFERENCES users(id),
    category_id UUID REFERENCES course_categories(id),
    level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    thumbnail_url TEXT,
    preview_video_url TEXT,
    language VARCHAR(10) DEFAULT 'ar',
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tags TEXT[],
    requirements TEXT[],
    what_you_learn TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Course Lessons
CREATE TABLE course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    arabic_title VARCHAR(200),
    russian_title VARCHAR(200),
    description TEXT,
    content TEXT,
    video_url TEXT,
    audio_url TEXT,
    duration_minutes INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course Enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    UNIQUE(user_id, course_id)
);

-- Lesson Progress
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    watch_time_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- COMMUNITY & SOCIAL
-- ═════════════════════════════════════════════════════════════════════════════

-- Forum Categories
CREATE TABLE forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(100),
    russian_name VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    color VARCHAR(7) DEFAULT '#059669',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Posts
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES forum_categories(id),
    parent_id UUID REFERENCES forum_posts(id), -- For replies
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Post Reactions
CREATE TABLE post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- User Connections (Friends/Followers)
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')) DEFAULT 'pending',
    connection_type VARCHAR(20) CHECK (connection_type IN ('friend', 'follower')) DEFAULT 'friend',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id, connection_type),
    CHECK(requester_id != addressee_id)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- AI IMAM & CHAT
-- ═════════════════════════════════════════════════════════════════════════════

-- AI Chat Sessions
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(200),
    language VARCHAR(10) DEFAULT 'ar',
    model_version VARCHAR(50) DEFAULT 'gpt-4o-mini',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Chat Messages
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model VARCHAR(50),
    temperature DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Feedback
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ai_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════════════════════
-- MEDIA & CONTENT
-- ═════════════════════════════════════════════════════════════════════════════

-- Media Files
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    path TEXT NOT NULL,
    url TEXT,
    thumbnail_url TEXT,
    uploaded_by UUID REFERENCES users(id),
    category VARCHAR(50) CHECK (category IN ('video', 'audio', 'image', 'document', 'other')),
    metadata JSONB,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Live Streams
CREATE TABLE live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    streamer_id UUID NOT NULL REFERENCES users(id),
    rtmp_key VARCHAR(255) UNIQUE NOT NULL,
    stream_url TEXT,
    thumbnail_url TEXT,
    category VARCHAR(50),
    tags TEXT[],
    is_live BOOLEAN DEFAULT false,
    is_scheduled BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    viewer_count INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════════════════════
-- PAYMENTS & SUBSCRIPTIONS
-- ═════════════════════════════════════════════════════════════════════════════

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'paypal', 'razorpay', 'mollie', 'adyen')),
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    payment_type VARCHAR(50) CHECK (payment_type IN ('course', 'donation', 'subscription', 'other')),
    reference_id UUID, -- Reference to course, donation, etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(50),
    subscription_id VARCHAR(255), -- External subscription ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════════════════════
-- SYSTEM & LOGGING
-- ═════════════════════════════════════════════════════════════════════════════

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error', 'course', 'forum', 'payment', 'system')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_text VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Error Logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    error_code VARCHAR(100),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_headers JSONB,
    request_body TEXT,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═════════════════════════════════════════════════════════════════════════════

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Quran indexes
CREATE INDEX idx_quran_verses_surah_verse ON quran_verses(surah_id, verse_number);
CREATE INDEX idx_quran_verses_arabic_text ON quran_verses USING gin(to_tsvector('arabic', arabic_text));
CREATE INDEX idx_quran_verses_russian_translation ON quran_verses USING gin(to_tsvector('russian', russian_translation));

-- Course indexes
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_created_at ON courses(created_at);

-- Forum indexes
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX idx_forum_posts_parent ON forum_posts(parent_id);

-- AI Chat indexes
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Payment indexes
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Error logs indexes
CREATE INDEX idx_error_logs_user ON error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- ═════════════════════════════════════════════════════════════════════════════
-- TRIGGERS AND FUNCTIONS
-- ═════════════════════════════════════════════════════════════════════════════

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update course student count
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses SET current_students = current_students + 1 WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses SET current_students = current_students - 1 WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for course enrollment count
CREATE TRIGGER update_course_student_count_trigger
    AFTER INSERT OR DELETE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_course_student_count();

-- Function to update forum post reply count
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_posts SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for forum post reply count
CREATE TRIGGER update_post_reply_count_trigger
    AFTER INSERT OR DELETE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_post_reply_count();

-- ═════════════════════════════════════════════════════════════════════════════
-- CONSTRAINTS AND VALIDATIONS
-- ═════════════════════════════════════════════════════════════════════════════

-- Add check constraints for data integrity
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE courses ADD CONSTRAINT check_price_non_negative CHECK (price >= 0);
ALTER TABLE payment_transactions ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
ALTER TABLE subscriptions ADD CONSTRAINT check_price_positive CHECK (price > 0);

-- ═════════════════════════════════════════════════════════════════════════════
-- VIEWS FOR COMMON QUERIES
-- ═════════════════════════════════════════════════════════════════════════════

-- User profile view
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.country,
    u.city,
    u.language,
    u.is_active,
    u.is_verified,
    u.created_at,
    u.last_login_at,
    p.theme,
    p.notification_email,
    p.notification_push,
    p.privacy_level,
    p.show_profile
FROM users u
LEFT JOIN user_preferences p ON u.id = p.user_id
WHERE u.deleted_at IS NULL;

-- Course enrollment view
CREATE VIEW course_enrollment_details AS
SELECT 
    e.id,
    e.user_id,
    e.course_id,
    e.enrolled_at,
    e.progress_percentage,
    e.completed_at,
    e.certificate_issued,
    c.title as course_title,
    c.instructor_id,
    u.display_name as student_name
FROM course_enrollments e
JOIN courses c ON e.course_id = c.id
JOIN users u ON e.user_id = u.id;

-- Forum post view with author details
CREATE VIEW forum_posts_with_authors AS
SELECT 
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.category_id,
    p.parent_id,
    p.is_pinned,
    p.is_locked,
    p.view_count,
    p.like_count,
    p.reply_count,
    p.created_at,
    u.display_name as author_name,
    u.avatar_url as author_avatar,
    u.is_verified as author_verified
FROM forum_posts p
JOIN users u ON p.author_id = u.id;

-- ═════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert default data
INSERT INTO prayer_methods (name, fajr_angle, isha_angle, isha_interval, description) VALUES
('muslim_world_league', 18.0, 17.0, NULL, 'Muslim World League'),
('egyptian', 19.5, 17.5, NULL, 'Egyptian General Authority of Survey'),
('karachi', 18.0, 18.0, NULL, 'University of Islamic Sciences, Karachi'),
('umm_al_qura', 18.5, NULL, 90, 'Umm al-Qura University, Makkah'),
('dubai', 18.2, 18.2, NULL, 'Dubai (UAE)'),
('moonsighting', 18.0, 18.0, NULL, 'Moonsighting Committee'),
('north_america', 15.0, 15.0, NULL, 'Islamic Society of North America (ISNA)'),
('kuwait', 18.0, 17.5, NULL, 'Kuwait'),
('qatar', 18.0, NULL, 80, 'Qatar'),
('singapore', 20.0, NULL, 90, 'Singapore'),
('turkey', 18.0, 17.0, NULL, 'Turkey'),
('tehran', 17.7, 14.0, NULL, 'Institute of Geophysics, University of Tehran');

-- Insert default course categories
INSERT INTO course_categories (id, name, arabic_name, russian_name, description, sort_order) VALUES
(uuid_generate_v4(), 'Quran Studies', 'دراسات القرآن', 'Изучение Корана', 'Comprehensive Quran learning courses', 1),
(uuid_generate_v4(), 'Arabic Language', 'اللغة العربية', 'Арабский язык', 'Learn Arabic language for Quran understanding', 2),
(uuid_generate_v4(), 'Islamic History', 'التاريخ الإسلامي', 'Исламская история', 'Study Islamic history and civilization', 3),
(uuid_generate_v4(), 'Fiqh & Sharia', 'الفقه والشريعة', 'Фикх и Шариат', 'Islamic jurisprudence and legal studies', 4),
(uuid_generate_v4(), 'Aqeedah & Creed', 'العقيدة', 'Акыда', 'Islamic creed and beliefs', 5);

-- Insert default forum categories
INSERT INTO forum_categories (id, name, arabic_name, russian_name, description, sort_order) VALUES
(uuid_generate_v4(), 'General Discussion', 'النقاش العام', 'Общее обсуждение', 'General community discussions', 1),
(uuid_generate_v4(), 'Quran & Hadith', 'القرآن والحديث', 'Коран и Хадисы', 'Discussions about Quran and Hadith', 2),
(uuid_generate_v4(), 'Islamic Education', 'التعليم الإسلامي', 'Исламское образование', 'Educational discussions and questions', 3),
(uuid_generate_v4(), 'Community Support', 'دعم المجتمع', 'Поддержка сообщества', 'Help and support for community members', 4);

-- Create admin user (password: Admin@NoorIlm2024)
INSERT INTO users (id, email, username, password_hash, first_name, last_name, display_name, is_active, is_verified) VALUES
(uuid_generate_v4(), 'admin@noor-al-ilm.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Admin', 'User', 'Administrator', true, true);

-- Assign admin role
INSERT INTO user_roles (user_id, role, granted_by) VALUES
((SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), 'admin', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'));

-- Migration completed
SELECT 'Initial schema migration completed successfully' as status;
