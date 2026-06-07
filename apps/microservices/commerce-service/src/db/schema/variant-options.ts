import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, integer, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogs } from './catalogs';
import { coreSchema } from './core-schema';

export const variantOptions = coreSchema.table(
  'variant_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    catalogId: uuid('catalog_id')
      .notNull()
      .references(() => catalogs.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_variant_options_catalog_name').on(table.catalogId, table.name),
    index('idx_variant_options_catalog').on(table.catalogId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type VariantOption = typeof variantOptions.$inferSelect;
export type NewVariantOption = typeof variantOptions.$inferInsert;

export const variantOptionValues = coreSchema.table(
  'variant_option_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    variantOptionId: uuid('variant_option_id')
      .notNull()
      .references(() => variantOptions.id, { onDelete: 'cascade' }),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    unique('uq_variant_option_values_option_value').on(table.variantOptionId, table.value),
    index('idx_variant_option_values_option').on(table.variantOptionId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type VariantOptionValue = typeof variantOptionValues.$inferSelect;
export type NewVariantOptionValue = typeof variantOptionValues.$inferInsert;
