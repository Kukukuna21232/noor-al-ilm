#!/bin/bash
# ============================================================
# Noor Al-Ilm Video Platform - Deployment Script
# Kali Linux / Ubuntu / Debian
# ============================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
err()  { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log "Noor Al-Ilm Video Platform Deployment"
log "Project: $PROJECT_DIR"

# ── Check dependencies ────────────────────────────────────
for cmd in docker git openssl curl; do
  command -v "$cmd" &>/dev/null || err "$cmd not installed"
done

# docker compose v2 or v1
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  err "docker compose not found"
fi

# ── Environment setup ─────────────────────────────────────
ENV_FILE="$PROJECT_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  cp "$PROJECT_DIR/backend/.env.example" "$ENV_FILE"
  warn ".env created from example - please edit with real values"
  read -rp "Press Enter after editing .env to continue..."
fi

# Auto-generate JWT secret if placeholder
if grep -q "your_jwt_secret" "$ENV_FILE"; then
  JWT=$(openssl rand -hex 64)
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT|" "$ENV_FILE"
  log "Generated JWT_SECRET"
fi

# ── SSL certificates ──────────────────────────────────────
SSL_DIR="$PROJECT_DIR/nginx/ssl"
mkdir -p "$SSL_DIR"
if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
  log "Generating self-signed SSL (replace with Let's Encrypt for production)"
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/C=SA/ST=Mecca/L=Mecca/O=NoorAlIlm/CN=video.noor-al-ilm.com" 2>/dev/null
fi

# ── Build & start ─────────────────────────────────────────
cd "$PROJECT_DIR"
log "Building Docker images..."
$DC build --no-cache

log "Starting database and Redis..."
$DC up -d postgres redis
sleep 12

log "Running migrations..."
$DC run --rm backend node src/config/migrate.js

log "Starting all services..."
$DC up -d

log "Waiting for services..."
sleep 20

# ── Health check ──────────────────────────────────────────
if curl -sf http://localhost:5001/health | grep -q '"status":"ok"'; then
  log "Backend healthy"
else
  warn "Backend health check failed - check: $DC logs backend"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Noor Al-Ilm Video Platform Running!${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  Frontend:  http://localhost"
echo -e "  Backend:   http://localhost:5001"
echo -e "  Studio:    http://localhost/studio"
echo -e "  Health:    http://localhost:5001/health"
echo ""
echo "Commands:"
echo "  Logs:     $DC logs -f"
echo "  Stop:     $DC down"
echo "  Restart:  $DC restart"
echo "  DB shell: $DC exec postgres psql -U postgres noor_al_ilm"
echo -e "${BLUE}============================================${NC}"
