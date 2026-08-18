import { index, jsonb, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { sessionTypeEnum } from './enums';
import { users } from './users';

/**
 * Staff sessions.
 *
 * Storefront shoppers are deliberately absent: their sessions live in the
 * storefront application itself, which owns the credential and the cookie. Core
 * keeps a `party_identities` mirror for commerce to reference and takes no
 * part in the shopper login.
 */
export const sessions = coreSchema.table(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: sessionTypeEnum('type').notNull().default('WEB'),
    accessTokenHash: text('access_token_hash').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // The hot path. Authentication resolves a session by access token hash on
    // every request, and this table carried no index at all — a sequential scan
    // per request, survivable only because staff sessions are few. Unrelated to
    // the storefront work that briefly shared this table, and kept for its own
    // sake.
    index('idx_sessions_access_token_hash').on(table.accessTokenHash),
    index('idx_sessions_refresh_token_hash').on(table.refreshTokenHash),
    index('idx_sessions_user').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
