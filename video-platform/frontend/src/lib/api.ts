import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) { Cookies.remove('token'); window.location.href = '/auth/login'; }
    return Promise.reject(err);
  }
);

export const videoApi = {
  listVideos: (params?: Record<string, string>) => api.get('/videos', { params }),
  getVideo: (id: string) => api.get(`/videos/${id}`),
  updateVideo: (id: string, data: Record<string, unknown>) => api.put(`/videos/${id}`, data),
  deleteVideo: (id: string) => api.delete(`/videos/${id}`),
  likeVideo: (id: string, isLike: boolean) => api.post(`/videos/${id}/like`, { isLike }),
  bookmarkVideo: (id: string) => api.post(`/videos/${id}/bookmark`),
  updateWatchProgress: (id: string, position: number, percent: number) =>
    api.post(`/videos/${id}/watch-progress`, { positionSeconds: position, completionPercent: percent }),
  getRecommended: (limit?: number) => api.get('/videos/feed/recommended', { params: { limit } }),
  getComments: (videoId: string, page?: number) => api.get(`/videos/${videoId}/comments`, { params: { page } }),
  addComment: (videoId: string, content: string, parentId?: string) =>
    api.post(`/videos/${videoId}/comments`, { content, parentId }),
  getManifest: (videoId: string) => api.get(`/stream/${videoId}/manifest`),
  getSubtitles: (videoId: string) => api.get(`/stream/${videoId}/subtitles`),
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
  getUploadStatus: (videoId: string) => api.get(`/upload/status/${videoId}`),
  generateScript: (data: Record<string, unknown>) => api.post('/ai/generate-script', data),
  generateVoiceover: (data: Record<string, unknown>) => api.post('/ai/generate-voiceover', data),
  generateSubtitles: (videoId: string, language: string) => api.post(`/ai/generate-subtitles/${videoId}`, { language }),
  translateSubtitles: (videoId: string, targetLanguage: string, sourceLanguage: string) =>
    api.post(`/ai/translate-subtitles/${videoId}`, { targetLanguage, sourceLanguage }),
  generateThumbnail: (videoId: string) => api.post(`/ai/generate-thumbnail/${videoId}`),
  getAIJob: (jobId: string) => api.get(`/ai/job/${jobId}`),
  getAIJobs: () => api.get('/ai/jobs'),
  getStudioDashboard: () => api.get('/studio/dashboard'),
  publishVideo: (videoId: string) => api.put(`/studio/videos/${videoId}/publish`),
  getVideoAnalytics: (videoId: string) => api.get(`/analytics/video/${videoId}`),
  getCreatorAnalytics: () => api.get('/analytics/creator'),
  getPlaylists: (creatorId?: string) => api.get('/playlists', { params: { creatorId } }),
  createPlaylist: (data: Record<string, unknown>) => api.post('/playlists', data),
  addToPlaylist: (playlistId: string, videoId: string) => api.post(`/playlists/${playlistId}/videos`, { videoId }),
  getPlaylistVideos: (playlistId: string) => api.get(`/playlists/${playlistId}/videos`),
  getLiveStreams: () => api.get('/live'),
  getLiveStream: (id: string) => api.get(`/live/${id}`),
  createLiveStream: (data: Record<string, unknown>) => api.post('/live/create', data),
  endLiveStream: (id: string) => api.post(`/live/${id}/end`),
  reportVideo: (videoId: string, reason: string, description?: string) =>
    api.post('/moderation/report', { videoId, reason, description }),
  getPendingVideos: () => api.get('/moderation/pending'),
  reviewVideo: (videoId: string, action: string, notes?: string) =>
    api.post(`/moderation/review/${videoId}`, { action, notes }),
};

export default api;
