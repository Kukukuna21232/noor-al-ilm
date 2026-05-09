#!/bin/bash
# ============================================================
# Noor Al-Ilm Video Platform - Local Dev Setup (Kali Linux)
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Node.js ───────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
NODE_VER=$(node --version | cut -dv -f2 | cut -d. -f1)
[ "$NODE_VER" -lt 18 ] && { warn "Node.js 18+ required"; exit 1; }
log "Node.js $(node --version) OK"

# ── FFmpeg ────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  log "Installing FFmpeg..."
  sudo apt-get update && sudo apt-get install -y ffmpeg
fi
log "FFmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}') OK"

# ── PostgreSQL ────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  log "Installing PostgreSQL..."
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
fi

log "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE noor_al_ilm;" 2>/dev/null || warn "DB may exist"
sudo -u postgres psql -c "CREATE USER noor_video WITH PASSWORD 'noor_video_dev';" 2>/dev/null || warn "User may exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE noor_al_ilm TO noor_video;" 2>/dev/null || true

# ── Redis ─────────────────────────────────────────────────
if ! command -v redis-server &>/dev/null; then
  log "Installing Redis..."
  sudo apt-get install -y redis-server
  sudo systemctl start redis-server
  sudo systemctl enable redis-server
fi
log "Redis OK"

# ── Backend setup ─────────────────────────────────────────
log "Setting up backend..."
cd "$PROJECT_DIR/backend"
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i 's/DB_USER=postgres/DB_USER=noor_video/' .env
  sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=noor_video_dev/' .env
  sed -i 's/REDIS_PASSWORD=.*/REDIS_PASSWORD=/' .env
  sed -i 's/STORAGE_PROVIDER=.*/STORAGE_PROVIDER=local/' .env
fi
npm install
node src/config/migrate.js
log "Backend setup complete"

# ── Frontend setup ────────────────────────────────────────
log "Setting up frontend..."
cd "$PROJECT_DIR/frontend"
if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
EOF
fi
npm install
log "Frontend setup complete"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Local setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Start development servers:"
echo "  Terminal 1: cd backend  && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:5001"
echo "  Studio:   http://localhost:3001/studio"
echo "  Health:   http://localhost:5001/health"
