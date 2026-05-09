# 🕌 Noor Al-Ilm - نور العلم
## Global Islamic Educational Ecosystem

<div align="center">
  <img src="https://raw.githubusercontent.com/noor-al-ilm/assets/main/logo.png" alt="Noor Al-Ilm Logo" width="200"/>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](package.json)
  [![Next.js](https://img.shields.io/badge/next.js-14.2.5-black.svg)](frontend/package.json)
  [![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)](package.json)
  [![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](database/migrations)
  [![Redis](https://img.shields.io/badge/redis-7-red.svg)](docker-compose.dev.yml)
</div>

---

## 📖 Table of Contents

- [🌟 Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Development Setup](#️-development-setup)
- [📚 Documentation](#-documentation)
- [🏗️ Architecture](#️-architecture)
- [🌍 Bilingual Support](#-bilingual-support)
- [🔧 Configuration](#-configuration)
- [📊 Database](#-database)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🎓 **Educational Platform**
- **Quran Learning**: Interactive Quran reader with Tajweed rules
- **Arabic Courses**: Comprehensive Arabic language programs
- **Islamic Studies**: Fiqh, Hadith, Seerah, and Aqeedah courses
- **Live Classes**: Real-time video streaming with interactive features

### 🤖 **AI-Powered Features**
- **AI Imam**: Advanced chatbot for Islamic questions
- **Smart Recommendations**: Personalized course suggestions
- **Automated Assessments**: AI-powered quiz and assignment grading
- **Content Translation**: Real-time translation between Arabic, Russian, and English

### 👥 **Community & Social**
- **Discussion Forums**: Topic-based Islamic discussions
- **Study Groups**: Collaborative learning environments
- **Mentorship Programs**: Connect with qualified teachers
- **Events & Webinars**: Regular online Islamic events

### 📱 **Modern Web Experience**
- **Responsive Design**: Works seamlessly on all devices
- **PWA Support**: Install as a mobile app
- **Offline Access**: Download content for offline learning
- **Real-time Notifications**: Stay updated with community activities

### 🌍 **Bilingual Support**
- **Arabic (RTL)**: Complete Arabic interface with RTL layout
- **Russian (LTR)**: Full Russian translation and localization
- **English (LTR)**: English interface for global users
- **Dynamic Switching**: Instant language change without page reload

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 15
- Redis >= 7
- Docker & Docker Compose (optional)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/noor-al-ilm/noor-al-ilm.git
cd noor-al-ilm

# Copy environment files
cp .env.example .env.local
cp backend/api-gateway/.env.example backend/api-gateway/.env

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
./database/migrations/migrate.sh

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5000
# pgAdmin: http://localhost:8080
# Redis Commander: http://localhost:8081
# MinIO: http://localhost:9001
```

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/noor-al-ilm/noor-al-ilm.git
cd noor-al-ilm

# Install dependencies
npm install

# Setup frontend
cd frontend
npm install
npm run dev

# Setup backend (new terminal)
cd ../backend/api-gateway
npm install
npm run dev

# Setup database
cd ../../database
./migrations/migrate.sh
```

---

## 🛠️ Development Setup

### Environment Variables

Create `.env.local` in the root directory:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/noor_ilm
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key

# External Services
GOOGLE_CLIENT_ID=your-google-client-id
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Development Scripts

```bash
# Frontend development
npm run dev:frontend

# Backend development
npm run dev:backend

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Linting and formatting
npm run lint
npm run format
npm run type-check
```

### Useful Commands

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start specific service
docker-compose -f docker-compose.dev.yml up postgres redis

# View logs
docker-compose -f docker-compose.dev.yml logs -f api-gateway

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (WARNING: This deletes all data)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 📚 Documentation

### API Documentation
- **Swagger UI**: http://localhost:5000/api-docs
- **GraphQL Playground**: http://localhost:5000/graphql
- **API Reference**: [docs/api.md](docs/api.md)

### Frontend Documentation
- **Component Library**: [docs/components.md](docs/components.md)
- **State Management**: [docs/state.md](docs/state.md)
- **Styling Guide**: [docs/styling.md](docs/styling.md)

### Database Documentation
- **Schema**: [docs/database-schema.md](docs/database-schema.md)
- **Migrations**: [docs/migrations.md](docs/migrations.md)
- **Queries**: [docs/queries.md](docs/queries.md)

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │   Microservices │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
│ • React         │    │ • Auth          │    │ • Users         │
│ • TypeScript    │    │ • Routing       │    │ • Courses       │
│ • TailwindCSS   │    │ • Rate Limiting │    │ • Forum         │
│ • i18n          │    │ • WebSocket     │    │ • Quran         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ • PostgreSQL    │
                    │ • Redis         │
                    │ • Elasticsearch │
                    │ • MinIO (S3)    │
                    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14.2.5 with App Router
- **Language**: TypeScript 5.0
- **Styling**: TailwindCSS + Shadcn/ui
- **State Management**: Zustand + React Query
- **Internationalization**: Custom i18n system
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7
- **Search**: Elasticsearch 8
- **Authentication**: JWT + Refresh Tokens
- **File Storage**: MinIO (S3 compatible)
- **Real-time**: Socket.io

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack
- **Deployment**: Kubernetes + Helm

---

## 🌍 Bilingual Support

### Arabic (RTL) Support
- **Complete RTL Layout**: Full right-to-left text direction
- **Arabic Typography**: Beautiful Quranic fonts (Amiri Quran, Noto Naskh)
- **Cultural Context**: Proper Islamic terminology and cultural nuances
- **Prayer Times**: Arabic prayer names and formats

### Russian Support
- **Full Localization**: Complete Russian translation
- **Cyrillic Typography**: Proper Russian font support
- **Cultural Adaptation**: Appropriate Russian translations
- **Religious Terms**: Accurate Islamic terminology in Russian

### Language Features
- **Instant Switching**: Change language without page reload
- **Persistent Preferences**: Language choice saved in localStorage
- **SEO Optimized**: Proper `lang` and `dir` attributes
- **Accessible**: Screen reader support for both languages

### Implementation
```typescript
// Language switching example
import { useI18n } from '@/lib/i18n';

function LanguageSwitcher() {
  const { locale, setLocale, dir } = useI18n();
  
  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };
  
  return (
    <button onClick={() => handleLanguageChange('ar')}>
      العربية
    </button>
  );
}
```

---

## 🔧 Configuration

### Frontend Configuration
```typescript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  i18n: {
    locales: ['ar', 'ru', 'en'],
    defaultLocale: 'ar',
  },
  images: {
    domains: ['cdn.noor-al-ilm.com'],
  },
};
```

### Backend Configuration
```typescript
// server.js
const config = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
};
```

### Database Configuration
```sql
-- PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

---

## 📊 Database

### Schema Overview
- **Users**: Authentication, profiles, preferences
- **Courses**: Educational content and enrollments
- **Quran**: Surahs, verses, translations
- **Forum**: Posts, replies, categories
- **Payments**: Transactions, subscriptions
- **Analytics**: User activity, system logs

### Migration System
```bash
# Run migrations
./database/migrations/migrate.sh

# Rollback migration
./database/migrations/migrate.sh rollback 001_initial_schema

# Check migration status
./database/migrations/migrate.sh status

# Reset database
./database/migrations/migrate.sh reset
```

### Seeding Data
```bash
# Run all seeds
./database/migrations/migrate.sh seed

# Run specific seed
psql -h localhost -U postgres -d noor_ilm -f database/seeds/001_initial_data.sql
```

---

## 🚀 Deployment

### Production Deployment with Docker

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec api-gateway ./database/migrations/migrate.sh

# Check health
curl http://localhost/api/health
```

### Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f infrastructure/kubernetes/

# Check deployment
kubectl get pods -n noor-al-ilm

# View logs
kubectl logs -f deployment/api-gateway -n noor-al-ilm
```

### Environment Setup

#### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_PLAYGROUND=true
```

#### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
ENABLE_SWAGGER=false
ENABLE_PLAYGROUND=false
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Auto-format on save
- **Husky**: Pre-commit hooks for quality
- **Testing**: Jest + Testing Library

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Allah** - For the knowledge and guidance
- **Islamic Community** - For inspiration and feedback
- **Open Source** - For the amazing tools and libraries
- **Contributors** - For their valuable contributions

---

## 📞 Contact

- **Website**: https://noor-al-ilm.com
- **Email**: info@noor-al-ilm.com
- **Twitter**: @noor_al_ilm
- **GitHub**: https://github.com/noor-al-ilm

---

<div align="center">
  <p>Made with ❤️ for the global Muslim community</p>
  <p>وَقُل رَّبِّ زِدْنِي عِلْمًا - "My Lord, increase me in knowledge" (Quran 20:114)</p>
</div>
