import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { organizations } from './organizations';

export const siteGroups = coreSchema.table(
  'site_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .default(sql.raw("cast(current_setting('app.org_id') as uuid)"))
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    color: varchar('color', { length: 20 }),
    parentId: uuid('parent_id').references((): AnyPgColumn => siteGroups.id),
    // Per-feature lock deny-list gating GROUP-scope features in this group's context; null = inherit the full plan
    featureLocks: jsonb('feature_locks').$type<FeatureLocks>(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('site_groups_organization_id_idx').on(table.organizationId),
    uniqueIndex('site_groups_org_code_unique').on(table.organizationId, table.code),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type SiteGroup = typeof siteGroups.$inferSelect;
export type NewSiteGroup = typeof siteGroups.$inferInsert;
