import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgPolicy,
  primaryKey,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { offerings } from './offerings';
import { variantOptions, variantOptionValues } from './variant-options';

export const offeringOptions = coreSchema.table(
  'offering_options',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    variantOptionId: uuid('variant_option_id')
      .notNull()
      .references(() => variantOptions.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.offeringId, table.variantOptionId] }),
    index('idx_offering_options_offering').on(table.offeringId),
  ],
);

export type OfferingOption = typeof offeringOptions.$inferSelect;
export type NewOfferingOption = typeof offeringOptions.$inferInsert;

export const offeringVariants = coreSchema.table(
  'offering_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    offeringId: uuid('offering_id').notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    price: bigint('price', { mode: 'bigint' }).notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offering_variants_offering_sku').on(table.offeringId, table.sku),
    index('idx_offering_variants_offering').on(table.offeringId),
  ],
);

export type OfferingVariant = typeof offeringVariants.$inferSelect;
export type NewOfferingVariant = typeof offeringVariants.$inferInsert;

export const offeringVariantOptionValues = coreSchema.table(
  'offering_variant_option_values',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    offeringVariantId: uuid('offering_variant_id').notNull(),
    variantOptionValueId: uuid('variant_option_value_id')
      .notNull()
      .references(() => variantOptionValues.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.offeringVariantId, table.variantOptionValueId] }),
    index('idx_offering_variant_option_values_value').on(table.variantOptionValueId),
  ],
);

export type OfferingVariantOptionValue = typeof offeringVariantOptionValues.$inferSelect;
export type NewOfferingVariantOptionValue = typeof offeringVariantOptionValues.$inferInsert;

export const offeringVariantComponents = coreSchema.table(
  'offering_variant_components',
  {
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    offeringVariantId: uuid('offering_variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.offeringVariantId, table.inventoryItemId] }),
    index('idx_offering_variant_components_item').on(table.inventoryItemId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
  ],
);

export type OfferingVariantComponent = typeof offeringVariantComponents.$inferSelect;
export type NewOfferingVariantComponent = typeof offeringVariantComponents.$inferInsert;
