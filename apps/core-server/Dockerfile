# syntax=docker/dockerfile:1
# Build context = repo root (vritti-core). @vritti/* resolve from public npm.

# ============================================================================
# Builder — fetch deps (cached on the lockfile alone), install offline, build
# via Nx, then emit a self-contained prod bundle with `pnpm deploy`.
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /repo
RUN npm install -g pnpm@10.28.0
# Toolchain for native module builds (argon2). Lives ONLY in the builder — the
# compiled binary is carried into the prod bundle, so the final image never
# needs a compiler or a second install.
RUN apk add --no-cache python3 make g++

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

# Build the workspace-only permissions libs (no nx project, and dist/ is gitignored) so `pnpm deploy`
# bundles their compiled dist, then build this app. Every lib core-server imports must be listed —
# a missing one fails the tsc pass with "cannot find module", not at runtime.
RUN pnpm --filter @vritti/commerce-permissions --filter @vritti/communications-permissions --filter @vritti/gitea-permissions build
RUN pnpm exec nx build vritti-core-server

# Self-contained prod deployment: prod-only, flat node_modules — including the
# @vritti/commerce-permissions workspace lib (pnpm resolves `workspace:*`, so no
# hand-copy is needed) — in /prod. Then compile argon2 once here: it's not in the
# build-script allowlist, and alpine/musl has no prebuilt, so pnpm ships it unbuilt.
# allowUnusedPatches: the workspace patches RN packages (bottom-sheet/zeego/…) that a
# core-server-only deploy doesn't include, which is otherwise a hard error.
RUN pnpm --filter vritti-core-server deploy --prod --legacy --config.allowUnusedPatches=true /prod \
 && npm rebuild --prefix /prod argon2

# ============================================================================
# Production — prod bundle + compiled output, non-root. No install, no compiler.
# ============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
RUN apk add --no-cache wget

# Prod deps (built, incl. the bundled workspace lib) + the compiled app.
COPY --from=builder /prod/node_modules ./node_modules
COPY --from=builder /repo/apps/core-server/dist ./dist
# SQL migration files aren't compiled by SWC — copy them next to dist/db/migrate.js for `db:deploy`.
COPY --from=builder /repo/apps/core-server/src/db/migrations ./dist/db/migrations

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs \
 && chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:3002/ || exit 1

CMD ["node", "dist/main.js"]
