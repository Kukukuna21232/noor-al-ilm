// ═════════════════════════════════════════════════════════════════════════════
// NOOR AL-ILM MSW SERVER SETUP
// Version: 1.0.0
// Description: Mock Service Worker setup for API mocking
// ═════════════════════════════════════════════════════════════════════════════

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Mock data
const mockUsers = [
  {
    id: '1',
    email: 'admin@noor-al-ilm.com',
    username: 'admin',
    display_name: 'Administrator',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    is_active: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'teacher@noor-al-ilm.com',
    username: 'teacher1',
    display_name: 'Ahmed Teacher',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
    is_active: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockCourses = [
  {
    id: '1',
    title: 'Quran Recitation Basics',
    arabic_title: 'أساسيات تلاوة القرآن',
    russian_title: 'Основы чтения Корана',
    description: 'Learn the basics of Quran recitation with proper Tajweed rules',
    instructor_id: '2',
    category_id: '1',
    level: 'beginner',
    duration_weeks: 8,
    price: 0,
    currency: 'USD',
    is_free: true,
    is_published: true,
    current_students: 45,
    rating: 4.8,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Advanced Tajweed Mastery',
    arabic_title: 'إتقان التجويد المتقدم',
    russian_title: 'Продвинутое владение Таджвидом',
    description: 'Master advanced Tajweed rules and perfect your Quran recitation',
    instructor_id: '2',
    category_id: '1',
    level: 'advanced',
    duration_weeks: 12,
    price: 99.99,
    currency: 'USD',
    is_free: false,
    is_published: true,
    current_students: 28,
    rating: 4.9,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockForumPosts = [
  {
    id: '1',
    title: 'Welcome to Noor Al-Ilm Community!',
    content: 'Assalamu Alaikum wa Rahmatullahi Wa Barakatuh! Welcome to our Islamic educational community.',
    author_id: '1',
    category_id: '1',
    view_count: 1250,
    like_count: 89,
    reply_count: 45,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockQuranSurahs = [
  { id: 1, surah_number: 1, arabic_name: 'الفاتحة', english_name: 'Al-Fatiha', russian_name: 'Открывающая', total_verses: 7 },
  { id: 2, surah_number: 2, arabic_name: 'البقرة', english_name: 'Al-Baqarah', russian_name: 'Корова', total_verses: 286 },
];

const mockQuranVerses = [
  {
    id: 1,
    surah_id: 1,
    verse_number: 1,
    arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    russian_translation: 'Во имя Аллаха, Милостивого, Милостивейшего',
    english_translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
  },
  {
    id: 2,
    surah_id: 1,
    verse_number: 2,
    arabic_text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    russian_translation: 'Хвала Аллаху, Господу миров',
    english_translation: 'All praise is due to Allah, Lord of the worlds',
  },
];

// API handlers
export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE_URL}/api/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as any;
    
    if (email === 'admin@noor-al-ilm.com' && password === 'Admin@NoorIlm2024') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: mockUsers[0],
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
          },
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/auth/register`, (req, res, ctx) => {
    const { email, username, password } = req.body as any;
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === email || u.username === username)) {
      return res(
        ctx.status(409),
        ctx.json({
          success: false,
          error: {
            message: 'User already exists',
            code: 'USER_EXISTS',
          },
        })
      );
    }
    
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      username,
      display_name: username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      is_active: true,
      is_verified: false,
      created_at: new Date().toISOString(),
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          user: newUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/auth/refresh`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          token: 'mock-new-jwt-token',
        },
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully',
      })
    );
  }),

  // User endpoints
  rest.get(`${API_BASE_URL}/api/users/profile`, (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockUsers[0],
      })
    );
  }),

  rest.put(`${API_BASE_URL}/api/users/profile`, (req, res, ctx) => {
    const updates = req.body as any;
    const updatedUser = { ...mockUsers[0], ...updates };
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: updatedUser,
      })
    );
  }),

  // Course endpoints
  rest.get(`${API_BASE_URL}/api/courses`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const category = req.url.searchParams.get('category');
    const level = req.url.searchParams.get('level');
    
    let filteredCourses = [...mockCourses];
    
    if (category) {
      filteredCourses = filteredCourses.filter(course => course.category_id === category);
    }
    
    if (level) {
      filteredCourses = filteredCourses.filter(course => course.level === level);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          courses: paginatedCourses,
          pagination: {
            page,
            limit,
            total: filteredCourses.length,
            totalPages: Math.ceil(filteredCourses.length / limit),
          },
        },
      })
    );
  }),

  rest.get(`${API_BASE_URL}/api/courses/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const course = mockCourses.find(c => c.id === id);
    
    if (!course) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: course,
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/courses/:id/enroll`, (req, res, ctx) => {
    const { id } = req.params;
    const course = mockCourses.find(c => c.id === id);
    
    if (!course) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          enrollment_id: 'mock-enrollment-id',
          course_id: id,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
        },
      })
    );
  }),

  // Forum endpoints
  rest.get(`${API_BASE_URL}/api/forum/posts`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const category = req.url.searchParams.get('category');
    
    let filteredPosts = [...mockForumPosts];
    
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category_id === category);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          posts: paginatedPosts,
          pagination: {
            page,
            limit,
            total: filteredPosts.length,
            totalPages: Math.ceil(filteredPosts.length / limit),
          },
        },
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/forum/posts`, (req, res, ctx) => {
    const { title, content, category_id } = req.body as any;
    
    const newPost = {
      id: String(mockForumPosts.length + 1),
      title,
      content,
      author_id: '1',
      category_id,
      view_count: 0,
      like_count: 0,
      reply_count: 0,
      created_at: new Date().toISOString(),
    };
    
    mockForumPosts.push(newPost);
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newPost,
      })
    );
  }),

  rest.get(`${API_BASE_URL}/api/forum/posts/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const post = mockForumPosts.find(p => p.id === id);
    
    if (!post) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND',
          },
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: post,
      })
    );
  }),

  // Quran endpoints
  rest.get(`${API_BASE_URL}/api/quran/surahs`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockQuranSurahs,
      })
    );
  }),

  rest.get(`${API_BASE_URL}/api/quran/surahs/:id/verses`, (req, res, ctx) => {
    const { id } = req.params;
    const verses = mockQuranVerses.filter(v => v.surah_id === parseInt(id as string));
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: verses,
      })
    );
  }),

  rest.get(`${API_BASE_URL}/api/quran/verses/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const verse = mockQuranVerses.find(v => v.id === parseInt(id as string));
    
    if (!verse) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: {
            message: 'Verse not found',
            code: 'VERSE_NOT_FOUND',
          },
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: verse,
      })
    );
  }),

  // AI Imam endpoints
  rest.post(`${API_BASE_URL}/api/ai/chat`, (req, res, ctx) => {
    const { message, session_id } = req.body as any;
    
    // Simulate AI response delay
    return res(
      ctx.delay(1000),
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          message: 'This is a mock AI response to: ' + message,
          session_id: session_id || 'mock-session-id',
          tokens_used: 150,
          model: 'gpt-4o-mini',
        },
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/ai/chat/sessions`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          session_id: 'mock-session-id',
          title: 'New Chat Session',
        },
      })
    );
  }),

  // Health check
  rest.get(`${API_BASE_URL}/api/health`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          redis: 'healthy',
          elasticsearch: 'healthy',
        },
      })
    );
  }),

  // Error simulation
  rest.get(`${API_BASE_URL}/api/error/test`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: {
          message: 'Test error for error handling',
          code: 'TEST_ERROR',
        },
      })
    );
  }),
];

// Create MSW server
export const server = setupServer(...handlers);
