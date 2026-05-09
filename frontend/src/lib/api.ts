import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({ baseURL, withCredentials: true, headers: { 'Content-Type': 'application/json' } });

  client.interceptors.request.use((config) => {
    const token = Cookies.get('access_token') || Cookies.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res.data,
    async (err) => {
      if (err.response?.status === 401 && err.config && !err.config._retry) {
        err.config._retry = true;
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
          if (data.accessToken) {
            Cookies.set('access_token', data.accessToken, { expires: 1/96, secure: true, sameSite: 'strict' });
            err.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return client(err.config);
          }
        } catch {
          Cookies.remove('access_token');
          if (typeof window !== 'undefined') window.location.href = '/auth/login';
        }
      }
      return Promise.reject(err);
    }
  );

  return client;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const api = createApiClient(API_URL);

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; locale?: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string; totpCode?: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  verifyEmail: (token: string) => api.get(`/auth/verify/${token}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),
  disable2FA: () => api.delete('/auth/2fa'),
};

// ── Quran ─────────────────────────────────────────────────
export const quranApi = {
  getSurahs: () => api.get('/quran/surahs'),
  getVerses: (surahId: number, lang?: string) => api.get(`/quran/surahs/${surahId}/verses`, { params: { lang } }),
  search: (q: string, lang?: string) => api.get('/quran/search', { params: { q, lang } }),
  getProgress: () => api.get('/quran/progress'),
  updateProgress: (data: { surahId: number; verseId: string; progressType: string; status: string; accuracyScore?: number }) => api.post('/quran/progress', data),
  getPrayerTimes: (city?: string, country?: string) => api.get('/quran/prayer-times', { params: { city, country } }),
  getIslamicEvents: () => api.get('/quran/islamic-events'),
};

// ── Courses ───────────────────────────────────────────────
export const coursesApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/courses', { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: Record<string, unknown>) => api.post('/courses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/courses/${id}`, data),
  enroll: (id: string) => api.post(`/courses/${id}/enroll`),
  updateProgress: (id: string, lessonId: string) => api.post(`/courses/${id}/progress`, { lessonId }),
  getMyEnrolled: () => api.get('/courses/my/enrolled'),
  getMyTeaching: () => api.get('/courses/my/teaching'),
};

// ── Forum ─────────────────────────────────────────────────
export const forumApi = {
  getCategories: () => api.get('/forum/categories'),
  getPosts: (params?: Record<string, string | number>) => api.get('/forum/posts', { params }),
  getPost: (id: string) => api.get(`/forum/posts/${id}`),
  createPost: (data: { title: string; content: string; category: string; tags?: string[] }) => api.post('/forum/posts', data),
  replyToPost: (id: string, content: string) => api.post(`/forum/posts/${id}/replies`, { content }),
  likePost: (id: string) => api.post(`/forum/posts/${id}/like`),
};

// ── AI Imam ───────────────────────────────────────────────
export const aiApi = {
  chat: (data: { message: string; language?: string; category?: string; conversationId?: string }) => api.post('/ai/chat', data),
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id: string) => api.get(`/ai/conversations/${id}`),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),
  generateScript: (data: Record<string, unknown>) => api.post('/ai/generate-script', data),
  generateVoiceover: (data: Record<string, unknown>) => api.post('/ai/generate-voiceover', data),
  generateSubtitles: (videoId: string, language: string) => api.post(`/ai/generate-subtitles/${videoId}`, { language }),
  translateSubtitles: (videoId: string, targetLanguage: string, sourceLanguage: string) => api.post(`/ai/translate-subtitles/${videoId}`, { targetLanguage, sourceLanguage }),
  generateThumbnail: (videoId: string) => api.post(`/ai/generate-thumbnail/${videoId}`),
  getJob: (jobId: string) => api.get(`/ai/job/${jobId}`),
  getJobs: () => api.get('/ai/jobs'),
};

// ── Videos ────────────────────────────────────────────────
export const videoApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/videos', { params }),
  getById: (id: string) => api.get(`/videos/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
  like: (id: string, isLike: boolean) => api.post(`/videos/${id}/like`, { isLike }),
  bookmark: (id: string) => api.post(`/videos/${id}/bookmark`),
  updateProgress: (id: string, position: number, percent: number) => api.post(`/videos/${id}/watch-progress`, { positionSeconds: position, completionPercent: percent }),
  getRecommended: (limit?: number) => api.get('/videos/feed/recommended', { params: { limit } }),
  getComments: (id: string, page?: number) => api.get(`/videos/${id}/comments`, { params: { page } }),
  addComment: (id: string, content: string, parentId?: string) => api.post(`/videos/${id}/comments`, { content, parentId }),
  getManifest: (id: string) => api.get(`/stream/${id}/manifest`),
  getSubtitles: (id: string) => api.get(`/stream/${id}/subtitles`),
};

// ── Upload ────────────────────────────────────────────────
export const uploadApi = {
  uploadVideo: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / (e.total || 1)) * 100)),
    }),
  getPresignedUrl: (filename: string, contentType: string, title: string, category: string) =>
    api.post('/upload/presigned', { filename, contentType, title, category }),
  confirmUpload: (videoId: string) => api.post(`/upload/confirm/${videoId}`),
  uploadThumbnail: (videoId: string, formData: FormData) =>
    api.post(`/upload/thumbnail/${videoId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus: (videoId: string) => api.get(`/upload/status/${videoId}`),
};

// ── Studio ────────────────────────────────────────────────
export const studioApi = {
  getDashboard: () => api.get('/studio/dashboard'),
  publishVideo: (videoId: string) => api.put(`/studio/videos/${videoId}/publish`),
};

// ── Live ──────────────────────────────────────────────────
export const liveApi = {
  getStreams: () => api.get('/live'),
  getStream: (id: string) => api.get(`/live/${id}`),
  createStream: (data: Record<string, unknown>) => api.post('/live/create', data),
  endStream: (id: string) => api.post(`/live/${id}/end`),
};

// ── Playlists ─────────────────────────────────────────────
export const playlistApi = {
  getAll: (creatorId?: string) => api.get('/playlists', { params: { creatorId } }),
  create: (data: Record<string, unknown>) => api.post('/playlists', data),
  addVideo: (playlistId: string, videoId: string) => api.post(`/playlists/${playlistId}/videos`, { videoId }),
  getVideos: (playlistId: string) => api.get(`/playlists/${playlistId}/videos`),
};

// ── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  getVideoAnalytics: (videoId: string) => api.get(`/analytics/video/${videoId}`),
  getCreatorAnalytics: () => api.get('/analytics/creator'),
};

// ── Admin ─────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, string | number>) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getPendingContent: () => api.get('/admin/content/pending'),
  moderateContent: (id: string, action: string, type: string, notes?: string) => api.post(`/admin/content/${id}/moderate`, { action, type, notes }),
  getAIMonitoring: () => api.get('/admin/ai-monitoring'),
  getAnalytics: (period?: string) => api.get('/admin/analytics', { params: { period } }),
  approveCreator: (id: string) => api.post(`/admin/creators/approve/${id}`),
};

// ── Media ─────────────────────────────────────────────────
export const mediaApi = {
  getAll: (params?: Record<string, string | number>) => api.get('/media', { params }),
  getById: (id: string) => api.get(`/media/${id}`),
};

// ── Search ────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, types?: string[]) => api.get('/search', { params: { q, types: types?.join(',') } }),
};

// ── Notifications ─────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: () => api.put('/notifications/read'),
};

// ── GraphQL ───────────────────────────────────────────────
export const graphqlQuery = async (query: string, variables?: Record<string, unknown>) => {
  const token = Cookies.get('access_token') || Cookies.get('token');
  const response = await fetch(`${API_URL.replace('/api', '')}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
};

export default api;
