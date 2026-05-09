# 🎬 نور العلم - منصة الفيديو التعليمي الإسلامي
## Noor Al-Ilm AI Video Platform — Module 11

> AI-powered Islamic educational video platform with HLS streaming, adaptive bitrate, AI generation, live streaming, and creator studio.

---

## 🏗️ Architecture

```
video-platform/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── server.js           # Main server + Socket.io
│       ├── config/
│       │   ├── database.js     # PostgreSQL pool
│       │   └── migrate.js      # Full DB schema
│       ├── middleware/
│       │   └── auth.js         # JWT + creator auth
│       ├── routes/
│       │   ├── videos.js       # CRUD, likes, bookmarks, comments
│       │   ├── upload.js       # Chunked upload + presigned URLs
│       │   ├── streaming.js    # HLS manifest + segments
│       │   ├── ai.js           # AI generation endpoints
│       │   ├── studio.js       # Creator dashboard
│       │   ├── analytics.js    # Video + creator analytics
│       │   ├── moderation.js   # Content moderation
│       │   ├── playlists.js    # Playlist management
│       │   └── live.js         # Live streaming
│       ├── services/
│       │   ├── ai/             # OpenAI: script, TTS, Whisper, DALL-E
│       │   ├── storage/        # Local / S3 / Cloudflare R2
│       │   ├── transcoding/    # FFmpeg HLS pipeline
│       │   ├── streaming/      # Socket.io handlers
│       │   └── queue/          # Bull job queues
│       └── workers/
│           ├── transcodingWorker.js
│           ├── aiWorker.js
│           └── uploadWorker.js
├── frontend/                   # Next.js 14 + TypeScript
│   └── src/
│       ├── app/
│       │   ├── watch/          # Video watch page
│       │   ├── studio/         # Creator studio
│       │   └── live/           # Live streaming
│       ├── components/
│       │   ├── player/         # HLS VideoPlayer
│       │   ├── video/          # VideoCard, CommentSection
│       │   └── studio/         # VideoUploader, AIGeneratorPanel, Analytics
│       ├── lib/api.ts          # Full API client
│       └── store/authStore.ts  # Zustand auth
├── nginx/                      # Reverse proxy config
├── scripts/                    # Deploy + setup scripts
└── docker-compose.yml          # Full stack orchestration
```

---

## 🚀 Quick Start (Kali Linux)

### Local Development
```bash
cd video-platform
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh

# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### Production (Docker)
```bash
cd video-platform
cp backend/.env.example backend/.env
# Edit backend/.env with your values
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

## ⚙️ Environment Variables

```bash
# backend/.env
NODE_ENV=production
VIDEO_PORT=5001
FRONTEND_URL=http://localhost:3001

# Database
DB_HOST=localhost
DB_NAME=noor_al_ilm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_64_char_secret

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=your_redis_password

# Storage: local | s3 | r2
STORAGE_PROVIDER=local
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=noor-al-ilm-videos
CDN_BASE_URL=https://cdn.example.com

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## 🎯 API Endpoints

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/videos | List public videos |
| GET | /api/videos/:id | Get video details |
| PUT | /api/videos/:id | Update video |
| DELETE | /api/videos/:id | Delete video |
| POST | /api/videos/:id/like | Like/dislike |
| POST | /api/videos/:id/bookmark | Bookmark |
| POST | /api/videos/:id/watch-progress | Save progress |
| GET | /api/videos/:id/comments | Get comments |
| POST | /api/videos/:id/comments | Add comment |
| GET | /api/videos/feed/recommended | Recommendations |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload/video | Direct upload (multipart) |
| POST | /api/upload/presigned | Get presigned S3 URL |
| POST | /api/upload/confirm/:id | Confirm presigned upload |
| POST | /api/upload/thumbnail/:id | Upload thumbnail |
| GET | /api/upload/status/:id | Upload/transcode status |

### Streaming
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stream/:id/manifest | HLS manifest URL |
| GET | /api/stream/:id/subtitles | Subtitle tracks |

### AI Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/generate-script | Generate video script |
| POST | /api/ai/generate-voiceover | Text-to-speech |
| POST | /api/ai/generate-subtitles/:id | Auto-transcribe |
| POST | /api/ai/translate-subtitles/:id | Translate subtitles |
| POST | /api/ai/generate-thumbnail/:id | AI thumbnail |
| GET | /api/ai/job/:jobId | Poll job status |

### Studio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/studio/dashboard | Creator dashboard |
| PUT | /api/studio/videos/:id/publish | Publish video |

### Live
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/live | Active streams |
| POST | /api/live/create | Create stream |
| POST | /api/live/:id/end | End stream |

---

## 🎬 Video Processing Pipeline

```
Upload → Queue → FFmpeg Transcoding → HLS Segments → Storage → CDN
                      ↓
              [1080p, 720p, 480p, 360p, 240p]
                      ↓
              Master Playlist (master.m3u8)
                      ↓
              AI Thumbnail Generation
                      ↓
              Auto Subtitle (Whisper)
                      ↓
              Translation (GPT-4o-mini)
```

---

## 🤖 AI Features

| Feature | Model | Description |
|---------|-------|-------------|
| Script Generation | GPT-4o | Islamic educational scripts |
| Voiceover | TTS-1-HD | Arabic/Russian/English narration |
| Transcription | Whisper-1 | Auto-subtitle generation |
| Translation | GPT-4o-mini | AR ↔ RU ↔ EN subtitles |
| Thumbnail | DALL-E 3 | Islamic-themed thumbnails |
| Moderation | Moderation API | Content safety filtering |

---

## 📊 Database Schema

Key tables:
- `creators` — Creator profiles and channels
- `videos` — Video metadata, status, variants
- `transcoding_jobs` — FFmpeg job tracking
- `ai_generation_jobs` — AI task queue
- `subtitles` — Multi-language subtitle tracks
- `watch_history` — User viewing progress
- `video_likes` — Like/dislike tracking
- `video_bookmarks` — Saved videos
- `video_comments` — Threaded comments
- `playlists` / `playlist_videos` — Collections
- `live_streams` — Live stream sessions
- `video_analytics` — Daily metrics
- `content_reports` — Moderation reports

---

## 🔒 Security

- JWT authentication on all protected routes
- Creator approval workflow
- Content moderation pipeline (AI + manual)
- Rate limiting: 500 req/15min global, 20 uploads/hour
- File type validation (MIME + extension)
- Max file size: 2GB configurable
- CORS, Helmet, CSP headers
- Secure cookie settings

---

## 📡 Real-time Features (Socket.io)

- `/live` namespace — Live stream viewer count, chat
- `/chat` namespace — Real-time video comments
- Main namespace — Transcoding progress updates

---

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 (Bull queues) |
| backend | 5001 | Express API |
| transcoding_worker | — | FFmpeg worker (2 CPU, 4GB) |
| ai_worker | — | OpenAI tasks worker |
| frontend | 3001 | Next.js 14 |
| nginx | 80/443 | Reverse proxy + SSL |

---

## 🌐 Supported Languages

- Arabic (العربية) — RTL, Amiri font
- Russian (Русский) — LTR
- English — LTR

---

*Part of نور العلم (Noor Al-Ilm) Islamic Educational Platform*
