---
description: Auth system architecture facts and constraints
paths:
  - "src/**/auth/**/*.ts"
---

# Auth Architecture

These are established facts. Do NOT change these patterns without explicit approval.

## Password & Encryption
- Password hashing: **Argon2id** via EncryptionService (NOT bcrypt)

## Routes
- Auth routes: `/auth/*` (top-level, NOT nested under another prefix)

## Sessions & Tokens
- Session types: ONBOARDING, CLOUD, COMPANY, RESET, ADMIN
- Use `@RequireSession(SessionTypeValues.NEXUS)` to restrict endpoints to a session type
- `@RequireSession()` replaces the old `@Admin()`, `@Onboarding()`, `@Reset()` decorators
- Default session types configured via `configureApiSdk({ guard: { defaultSessionTypes: ['NEXUS'] } })`
- core-server defaults to `['NEXUS']`
- ONBOARDING session: 24h expiry (NOT 10 min)
- Refresh token: httpOnly cookie only (NOT in response body)
- JWT payload: `{ userId, type, refreshTokenHash }` (NOT sub/email/sessionType)
- sameSite cookie: `strict` (NOT lax)

## OAuth
- OAuth state: PostgreSQL `oauth_states` table (NOT Redis)

## MFA
- MFA challenge store: in-memory Map (NOT database)

## Cookie Configuration
- Cookie name from `REFRESH_COOKIE_NAME` env var (default: `vritti_refresh`)
- Cookie domain from `REFRESH_COOKIE_DOMAIN` env var
- Use `getRefreshCookieName()` and `getRefreshCookieOptionsFromConfig()` helpers
