import type { SiteFeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, index, integer, jsonb, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { pickStrategyEnum, siteTypeEnum } from './enums';
import { leTaxRegistrations } from './le-tax-registration';
import { legalEntities } from './legal-entity';
import { organizations } from './organizations';
import { siteGroups } from './site-group';

export interface SiteMetadata {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  phone?: string;
}

export const sites = coreSchema.table(
  'sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    type: siteTypeEnum('type').notNull(),
    groupId: uuid('group_id').references(() => siteGroups.id, { onDelete: 'restrict' }),
    appOverrides: jsonb('app_overrides').$type<Record<string, Record<string, unknown>>>(),
    inheritConfig: boolean('inherit_config').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    // Per-feature lock deny-list within the plan; null = inherit the full plan
    featureLocks: jsonb('feature_locks').$type<SiteFeatureLocks>(),
    timezone: varchar('timezone', { length: 50 }).notNull(),
    legalEntityId: uuid('legal_entity_id').references(() => legalEntities.id, { onDelete: 'restrict' }),
    registrationId: uuid('registration_id').references(() => leTaxRegistrations.id, { onDelete: 'restrict' }),
    pickStrategy: pickStrategyEnum('pick_strategy').notNull().default('FEFO'),
    metadata: jsonb('metadata').$type<SiteMetadata>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('sites_organization_id_idx').on(table.organizationId),
    index('sites_group_id_idx').on(table.groupId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
