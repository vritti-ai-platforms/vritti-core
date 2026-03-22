import { boolean, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { roleScopeEnum } from './enums';
import { organizations } from './organizations';

export const orgRoles = coreSchema.table(
  'org_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    scope: roleScopeEnum('scope').notNull(),
    sourceRoleId: uuid('source_role_id'),
    isLocked: boolean('is_locked').notNull().default(false),
    features: jsonb('features').$type<Record<string, string[]>>().notNull().default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('org_roles_org_name_unique').on(table.organizationId, table.name)],
);

export type OrgRole = typeof orgRoles.$inferSelect;
export type NewOrgRole = typeof orgRoles.$inferInsert;
