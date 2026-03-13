import { text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sessionTypeEnum } from './enums';
import { nexusSchema } from './nexus-schema';
import { users } from './users';

export const sessions = nexusSchema.table('sessions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:             sessionTypeEnum('type').notNull().default('NEXUS'),
  accessTokenHash:  text('access_token_hash').notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  ipAddress:        varchar('ip_address', { length: 45 }),
  userAgent:        text('user_agent'),
  expiresAt:        timestamp('expires_at').notNull(),
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
