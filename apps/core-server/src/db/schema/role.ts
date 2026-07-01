import { boolean, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';
import { organizations } from './organizations';

export const roles = coreSchema.table(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    // Non-null when provisioned from a role template — its presence marks the role as a read-only default role
    code: varchar('code', { length: 255 }),
    // featureCode → { app: appCode, granted permission codes per platform } — the role's grants, app stamped
    features: jsonb('features')
      .$type<Record<string, { app?: string; web?: string[]; mobile?: string[] }>>()
      .notNull()
      .default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('roles_org_name_unique').on(table.organizationId, table.name),
    uniqueIndex('roles_org_code_unique').on(table.organizationId, table.code),
  ],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
