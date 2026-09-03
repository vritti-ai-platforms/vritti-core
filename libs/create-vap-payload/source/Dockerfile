FROM node:22-alpine AS base

FROM base AS deps
# https://github.com/nodejs/docker-node — libc6-compat for musl/glibc shims
RUN apk add --no-cache libc6-compat
WORKDIR /app
# pnpm-workspace.yaml carries allowBuilds (sharp/esbuild native install scripts) —
# without it pnpm skips them and sharp breaks at runtime, on the first resize.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# corepack, not a global install: it takes the version from package.json's
# `packageManager` field, so the image can't drift onto a newer pnpm than the
# one the lockfile was written with.
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM deps AS source
WORKDIR /app
COPY . .

FROM source AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# No build-time env, and no database: every frontend route is force-dynamic,
# migrations run at server startup (prodMigrations in src/payload.config.ts), and
# the site origin is an admin setting rather than build config. Nothing is
# inlined at build, so one image runs any environment — keep it that way.
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# No `COPY /app/public`: the repo has no public/ and needs none. Adding static
# assets later means recreating both the directory and its COPY, since
# next build leaves public/ out of .next/standalone.

# Correct permissions for the prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# #region feature:media
# No uploads mount point: media goes to the S3 bucket only, and Payload writes
# nothing to this filesystem (src/collections/Media.ts).
# #endregion feature:media

# Runtime env — all of it, supplied by the deployment (`--env-file` / compose
# `env_file:`) and deliberately NOT baked in here: these are secrets and would
# otherwise sit in a pushed image layer.
#
#   DATABASE_URL           required. Postgres — note _URL, not _URI
#   DATABASE_SCHEMA        required. The site code; every migration hardcodes it
#   PAYLOAD_SECRET         required; changing it logs everyone out
# #region feature:media
#   S3_BUCKET              media -> S3/R2; required, there is no disk fallback
#   S3_ENDPOINT            https://<accountid>.r2.cloudflarestorage.com
#   S3_ACCESS_KEY_ID       required with S3_BUCKET
#   S3_SECRET_ACCESS_KEY   required with S3_BUCKET
#   S3_REGION              optional, defaults to 'auto' (correct for R2)
# #endregion feature:media
# #region feature:vap
#   CORE_GRAPHQL_URL            shopper sign-in. Without these /login says so in
#   VRITTI_APP_CLIENT_ID        the editor's words; nothing else is affected.
#   VRITTI_APP_CLIENT_SECRET
# #endregion feature:vap
# #region feature:cloudAuth
#   VRITTI_OAUTH_CONSENT_URL    admin sign-in with a Vritti Cloud account.
#   VRITTI_OAUTH_API_URL        Nothing is read at config time, so the site still
#   VRITTI_OAUTH_CLIENT_ID      serves with these unset — only the cloud login
#   VRITTI_OAUTH_CLIENT_SECRET  button stops working.
# #endregion feature:cloudAuth
#   PORT                   optional, defaults to 3000
#   HOSTNAME               optional, defaults to 0.0.0.0 (must stay 0.0.0.0 to
#                          be reachable from outside the container)

# Leverage output file tracing to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
