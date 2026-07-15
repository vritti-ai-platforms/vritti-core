import type { FeatureUnlocks, RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { boolean, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';
import { scopeTypeEnum, siteTypeEnum } from './enums';
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
    code: varchar('code', { length: 255 }).notNull(),
    scope: scopeTypeEnum('scope').notNull().default('ORG'),
    siteType: siteTypeEnum('site_type'),
    features: jsonb('features').$type<FeatureUnlocks>().notNull().default({}),
    revoked: jsonb('revoked').$type<RevokedGrants>(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('roles_org_name_unique').on(table.organizationId, table.name)],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
