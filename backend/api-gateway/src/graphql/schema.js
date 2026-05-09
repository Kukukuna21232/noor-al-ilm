const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    nameAr: String
    email: String!
    role: String!
    avatarUrl: String
    bio: String
    locale: String
    isVerified: Boolean!
    reputationPoints: Int
    createdAt: String!
  }

  type Course {
    id: ID!
    title: String!
    titleAr: String
    titleRu: String
    description: String
    category: String!
    level: String!
    language: String!
    thumbnailUrl: String
    price: Float!
    totalStudents: Int!
    rating: Float!
    totalLessons: Int!
    durationHours: Int!
    instructorName: String
    isPublished: Boolean!
    isFeatured: Boolean!
    createdAt: String!
  }

  type Video {
    id: ID!
    title: String!
    titleAr: String
    thumbnailUrl: String
    aiThumbnailUrl: String
    durationSeconds: Int!
    viewCount: Int!
    likeCount: Int!
    category: String!
    language: String!
    aiGenerated: Boolean!
    channelName: String
    channelSlug: String
    creatorVerified: Boolean
    publishedAt: String
  }

  type ForumPost {
    id: ID!
    title: String!
    content: String!
    authorName: String!
    categoryName: String
    likesCount: Int!
    viewsCount: Int!
    repliesCount: Int!
    isPinned: Boolean!
    createdAt: String!
  }

  type AIConversation {
    id: ID!
    title: String
    category: String!
    language: String!
    messageCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type PrayerTimes {
    fajr: String!
    sunrise: String
    dhuhr: String!
    asr: String!
    maghrib: String!
    isha: String!
    city: String!
    date: String!
  }

  type QuranSurah {
    id: Int!
    nameArabic: String!
    nameEnglish: String
    revelationType: String
    versesCount: Int!
  }

  type SearchResult {
    courses: [Course!]!
    videos: [Video!]!
    posts: [ForumPost!]!
    total: Int!
  }

  type DashboardStats {
    totalUsers: Int!
    totalCourses: Int!
    totalVideos: Int!
    totalPosts: Int!
    totalAIConversations: Int!
  }

  type Query {
    # Users
    me: User
    user(id: ID!): User

    # Courses
    courses(category: String, level: String, search: String, page: Int, limit: Int): [Course!]!
    course(id: ID!): Course
    featuredCourses: [Course!]!

    # Videos
    videos(category: String, search: String, page: Int, limit: Int): [Video!]!
    video(id: ID!): Video
    recommendedVideos(limit: Int): [Video!]!

    # Forum
    forumPosts(category: String, sort: String, page: Int): [ForumPost!]!
    forumPost(id: ID!): ForumPost

    # Quran
    surahs: [QuranSurah!]!
    prayerTimes(city: String, country: String): PrayerTimes

    # AI
    aiConversations: [AIConversation!]!

    # Search
    search(query: String!, types: [String!]): SearchResult!

    # Admin
    adminStats: DashboardStats
  }

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload
    register(name: String!, email: String!, password: String!, locale: String): AuthPayload

    # Courses
    enrollCourse(courseId: ID!): EnrollmentResult!
    updateProgress(courseId: ID!, lessonId: ID!): ProgressResult!

    # Forum
    createPost(title: String!, content: String!, category: String!, tags: [String!]): ForumPost!
    likePost(postId: ID!): LikeResult!

    # Videos
    likeVideo(videoId: ID!, isLike: Boolean!): LikeResult!
    bookmarkVideo(videoId: ID!): BookmarkResult!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type EnrollmentResult {
    success: Boolean!
    message: String!
  }

  type ProgressResult {
    progress: Int!
    isCompleted: Boolean!
  }

  type LikeResult {
    action: String!
    isLike: Boolean
  }

  type BookmarkResult {
    bookmarked: Boolean!
  }
`);

// Resolvers
const { query: dbQuery } = require('../../../shared/database');
const { cache } = require('../../../shared/redis');

const root = {
  // Queries
  me: async (args, context) => {
    if (!context.user) return null;
    const { rows } = await dbQuery('SELECT * FROM users WHERE id = $1', [context.user.id]);
    return rows[0] ? mapUser(rows[0]) : null;
  },

  courses: async ({ category, level, search, page = 1, limit = 12 }) => {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = ['is_published = true'];
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (level)    { params.push(level);    conditions.push(`level = $${params.length}`); }
    if (search)   { params.push(`%${search}%`); conditions.push(`title ILIKE $${params.length}`); }
    params.push(limit, offset);
    const { rows } = await dbQuery(`SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE ${conditions.join(' AND ')} ORDER BY total_students DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    return rows.map(mapCourse);
  },

  course: async ({ id }) => {
    const { rows } = await dbQuery('SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.id = $1', [id]);
    return rows[0] ? mapCourse(rows[0]) : null;
  },

  featuredCourses: async () => {
    const { rows } = await dbQuery('SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.is_published = true AND c.is_featured = true ORDER BY c.total_students DESC LIMIT 6');
    return rows.map(mapCourse);
  },

  videos: async ({ category, search, page = 1, limit = 24 }) => {
    const offset = (page - 1) * limit;
    const params = ["'ready'", "'public'", 'true'];
    const conditions = ["v.status = $1", "v.visibility = $2", "v.is_approved = $3"];
    if (category) { params.push(category); conditions.push(`v.category = $${params.length}`); }
    params.push(limit, offset);
    const { rows } = await dbQuery(`SELECT v.*, c.channel_name, c.is_verified as creator_verified FROM videos v JOIN creators c ON v.creator_id = c.id WHERE ${conditions.join(' AND ')} ORDER BY v.view_count DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    return rows.map(mapVideo);
  },

  surahs: async () => {
    const { rows } = await dbQuery('SELECT * FROM quran_surahs ORDER BY id').catch(() => ({ rows: [] }));
    return rows.map(s => ({ id: s.id, nameArabic: s.name_arabic, nameEnglish: s.name_english, revelationType: s.revelation_type, versesCount: s.verses_count }));
  },

  search: async ({ query: q, types = ['courses', 'videos', 'posts'] }) => {
    const results = { courses: [], videos: [], posts: [], total: 0 };
    const pattern = `%${q}%`;
    if (types.includes('courses')) {
      const { rows } = await dbQuery('SELECT c.*, u.name as instructor_name FROM courses c LEFT JOIN users u ON c.instructor_id = u.id WHERE c.is_published = true AND (c.title ILIKE $1 OR c.title_ar ILIKE $1) LIMIT 5', [pattern]);
      results.courses = rows.map(mapCourse);
    }
    if (types.includes('videos')) {
      const { rows } = await dbQuery("SELECT v.*, c.channel_name FROM videos v JOIN creators c ON v.creator_id = c.id WHERE v.status = 'ready' AND v.visibility = 'public' AND (v.title ILIKE $1 OR v.title_ar ILIKE $1) LIMIT 5", [pattern]);
      results.videos = rows.map(mapVideo);
    }
    if (types.includes('posts')) {
      const { rows } = await dbQuery("SELECT p.*, u.name as author_name, fc.name as category_name FROM forum_posts p LEFT JOIN users u ON p.author_id = u.id LEFT JOIN forum_categories fc ON p.category_id = fc.id WHERE p.is_approved = true AND p.title ILIKE $1 LIMIT 5", [pattern]);
      results.posts = rows.map(mapPost);
    }
    results.total = results.courses.length + results.videos.length + results.posts.length;
    return results;
  },
};

// Mappers
const mapUser = (u) => ({ id: u.id, name: u.name, nameAr: u.name_ar, email: u.email, role: u.role, avatarUrl: u.avatar_url, bio: u.bio, locale: u.locale, isVerified: u.is_verified, reputationPoints: u.reputation_points, createdAt: u.created_at });
const mapCourse = (c) => ({ id: c.id, title: c.title, titleAr: c.title_ar, titleRu: c.title_ru, description: c.description, category: c.category, level: c.level, language: c.language, thumbnailUrl: c.thumbnail_url, price: parseFloat(c.price || 0), totalStudents: c.total_students || 0, rating: parseFloat(c.rating || 0), totalLessons: c.total_lessons || 0, durationHours: c.duration_hours || 0, instructorName: c.instructor_name, isPublished: c.is_published, isFeatured: c.is_featured, createdAt: c.created_at });
const mapVideo = (v) => ({ id: v.id, title: v.title, titleAr: v.title_ar, thumbnailUrl: v.thumbnail_url, aiThumbnailUrl: v.ai_thumbnail_url, durationSeconds: v.duration_seconds || 0, viewCount: v.view_count || 0, likeCount: v.like_count || 0, category: v.category, language: v.language, aiGenerated: v.ai_generated, channelName: v.channel_name, channelSlug: v.channel_slug, creatorVerified: v.creator_verified, publishedAt: v.published_at });
const mapPost = (p) => ({ id: p.id, title: p.title, content: p.content, authorName: p.author_name, categoryName: p.category_name, likesCount: p.likes_count || 0, viewsCount: p.views_count || 0, repliesCount: p.replies_count || 0, isPinned: p.is_pinned, createdAt: p.created_at });

module.exports = schema;
module.exports.rootValue = root;
