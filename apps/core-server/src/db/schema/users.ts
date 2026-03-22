import { boolean, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { userStatusEnum } from './enums';
import { organizations } from './organizations';

export const users = coreSchema.table(
  'users',
  {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  status: userStatusEnum('status').notNull().default('PENDING'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  },
  (table) => [uniqueIndex('users_email_org_unique').on(table.email, table.organizationId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
