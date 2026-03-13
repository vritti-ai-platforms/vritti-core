import { boolean, integer, text, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { nexusSchema } from './nexus-schema';
import { users } from './users';

export const verifications = nexusSchema.table('verifications', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  otpHash:    text('otp_hash').notNull(),
  attempts:   integer('attempts').notNull().default(0),
  isVerified: boolean('is_verified').notNull().default(false),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at'),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
