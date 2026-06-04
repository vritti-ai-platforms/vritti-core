# syntax=docker/dockerfile:1
# Build context = repo root (vritti-core). @vritti/* resolve from public npm.

# ============================================================================
# Builder — install the pnpm workspace and build just this app via Nx
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

# Build only this project — output lands in apps/core-server/dist
RUN pnpm exec nx build vritti-core-server

# ============================================================================
# Production — prod-only deps + compiled output, non-root
# ============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
RUN apk add --no-cache wget

COPY --from=builder /repo/apps/core-server/package.json ./package.json
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
 && npm install --omit=dev --no-audit --no-fund \
 && apk del .build-deps

COPY --from=builder /repo/apps/core-server/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs \
 && chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:3002/ || exit 1

CMD ["node", "dist/main.js"]
