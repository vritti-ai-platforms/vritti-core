import { boolean, text, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { userRoleEnum, userStatusEnum } from './enums';
import { nexusSchema } from './nexus-schema';
import { organizations } from './organizations';

export const users = nexusSchema.table('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
                    .notNull()
                    .references(() => organizations.id, { onDelete: 'cascade' }),
  email:          varchar('email', { length: 255 }).unique().notNull(),
  passwordHash:   text('password_hash'),
  fullName:       varchar('full_name', { length: 255 }).notNull(),
  role:           userRoleEnum('role').notNull().default('SUPPORT'),
  status:         userStatusEnum('status').notNull().default('PENDING'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt:    timestamp('last_login_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
