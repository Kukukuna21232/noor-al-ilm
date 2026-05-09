FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nodeuser:nodejs . .
RUN mkdir -p logs uploads/temp uploads/thumbnails hls && \
    chown -R nodeuser:nodejs logs uploads hls

USER nodeuser
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

CMD ["node", "src/server.js"]
