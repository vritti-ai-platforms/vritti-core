import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  char,
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
import { taxRegimeEnum } from './enums';
import { organizations } from './organizations';

export const legalEntities = coreSchema.table(
  'legal_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    country: char('country', { length: 2 }).notNull(),
    currencyCode: char('currency_code', { length: 3 }).notNull(),
    taxRegime: taxRegimeEnum('tax_regime').notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    fiscalYearStart: integer('fiscal_year_start').notNull().default(4),
    parentId: uuid('parent_id').references((): AnyPgColumn => legalEntities.id),
    // Per-feature lock deny-list gating LE-scope features in this LE's context; null = inherit the full plan
    featureLocks: jsonb('feature_locks').$type<FeatureLocks>(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('legal_entities_organization_id_idx').on(table.organizationId),
    uniqueIndex('legal_entities_org_code_unique').on(table.organizationId, table.code),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`,
    }),
  ],
);

export type LegalEntity = typeof legalEntities.$inferSelect;
export type NewLegalEntity = typeof legalEntities.$inferInsert;
