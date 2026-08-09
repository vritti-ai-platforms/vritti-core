# syntax=docker/dockerfile:1
# Build context = repo root (vritti-core). NATS microservice — no HTTP ingress.

# ============================================================================
# Builder — fetch deps (cached on the lockfile alone), install offline, build
# via Nx, then emit a self-contained prod bundle with `pnpm deploy`.
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /repo
RUN npm install -g pnpm@10.28.0

# Dependency layer keyed ONLY on the lockfile: `pnpm fetch` populates the store
# straight from pnpm-lock.yaml (no source needed), so this heavy download is a
# cache hit on every source-only change and only re-runs when the lockfile moves.
# patches/ is needed because pnpm-workspace.yaml pins patchedDependencies.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm fetch

# Now the source. `--offline` links from the already-fetched store (no network).
COPY . .
RUN pnpm install --frozen-lockfile --offline
RUN pnpm exec nx build commerce-service

# Self-contained prod deployment: prod-only, flat node_modules in /prod — no
# install runs downstream. allowUnusedPatches: the workspace patches RN packages
# a commerce-service-only deploy doesn't include (otherwise a hard error).
RUN pnpm --filter commerce-service deploy --prod --legacy --config.allowUnusedPatches=true /prod

# ============================================================================
# Production — prod bundle + compiled output, non-root. No install, no compiler.
# ============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache procps

# Prod deps (already resolved) + the compiled app, straight from the deploy bundle.
COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /repo/apps/microservices/commerce-service/dist ./dist
# SQL migration files aren't compiled by SWC — copy them next to dist/db/migrate.js for `db:deploy`.
COPY --from=builder /repo/apps/microservices/commerce-service/src/db/migrations ./dist/db/migrations

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs \
 && chown -R nestjs:nodejs /app
USER nestjs

# NATS worker — liveness is "the node process is alive" (no HTTP port).
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "dist/main.js" > /dev/null || exit 1

CMD ["node", "dist/main.js"]
