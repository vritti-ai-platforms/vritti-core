# syntax=docker/dockerfile:1
# Build context = repo root (vritti-core). NATS microservice — no HTTP ingress.

# ============================================================================
# Builder — install the pnpm workspace and build just this service via Nx
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

# Build only this project — output lands in apps/microservices/commerce-service/dist
RUN pnpm exec nx build commerce-service

# ============================================================================
# Production — prod-only deps + compiled output, non-root
# ============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache procps

COPY --from=builder /repo/apps/microservices/commerce-service/package.json ./package.json
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
 && npm install --omit=dev --no-audit --no-fund \
 && apk del .build-deps

COPY --from=builder /repo/apps/microservices/commerce-service/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs \
 && chown -R nestjs:nodejs /app
USER nestjs

# NATS worker — liveness is "the node process is alive" (no HTTP port).
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "dist/main.js" > /dev/null || exit 1

CMD ["node", "dist/main.js"]
