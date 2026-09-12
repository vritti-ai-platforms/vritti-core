import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgPolicy,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';

import { commerceSchema } from './commerce-schema';
import { inventoryItems } from './inventory-items';
import { offeringDimensions, offeringDimensionValues } from './offering-dimensions';
import { offeringReachPolicies, offerings } from './offerings';
import { taxClasses } from './tax-classes';
import { uom } from './uom';

export const offeringVariants = commerceSchema.table(
  'offering_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    // Derived: offering code + one value code per dimension, in dimension sort order. Stored rather
    // than computed so a lookup is an index hit, and regenerated when a dimension is appended.
    sku: varchar('sku', { length: 200 }).notNull(),
    // The stable identifier — a manufacturer part number or GTIN. Nothing rewrites this, unlike sku.
    externalSku: varchar('external_sku', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    // Chosen per generation batch, so one offering may carry variants in different units
    salesUomId: uuid('sales_uom_id')
      .notNull()
      .references(() => uom.id),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    isTaxClassOverridden: boolean('is_tax_class_overridden').notNull().default(false),
    // Off until the bill of materials the offering's fulfilment type requires is in place
    isActive: boolean('is_active').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Org-wide, not per offering: the sku already embeds the offering code, so two offerings could
    // otherwise both claim the same one.
    unique('uq_offering_variants_org_sku').on(table.organizationId, table.sku),
    unique('uq_offering_variants_org_external_sku').on(table.organizationId, table.externalSku),
    index('idx_offering_variants_offering').on(table.offeringId, table.sortOrder),
    ...offeringReachPolicies('offering_id'),
  ],
);

export type OfferingVariant = typeof offeringVariants.$inferSelect;
export type NewOfferingVariant = typeof offeringVariants.$inferInsert;

export const offeringVariantValues = commerceSchema.table(
  'offering_variant_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    dimensionId: uuid('dimension_id')
      .notNull()
      .references(() => offeringDimensions.id, { onDelete: 'restrict' }),
    valueId: uuid('value_id')
      .notNull()
      .references(() => offeringDimensionValues.id, { onDelete: 'restrict' }),
  },
  (table) => [
    // One value per dimension per variant. Presence of a row for every dimension is enforced in the
    // service — a constraint cannot express "as many rows as the offering has dimensions".
    unique('uq_offering_variant_values_variant_dimension').on(table.variantId, table.dimensionId),
    index('idx_offering_variant_values_value').on(table.valueId),
    index('idx_offering_variant_values_dimension').on(table.dimensionId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('offering_reach', {
      as: 'restrictive',
      for: 'all',
      using: sql.raw('exists (select 1 from commerce.offering_variants v where v.id = variant_id)'),
    }),
  ],
);

export type OfferingVariantValue = typeof offeringVariantValues.$inferSelect;
export type NewOfferingVariantValue = typeof offeringVariantValues.$inferInsert;

// The SALES bill of materials — which stock a variant draws on when it sells. Manufacturing BOMs
// (an item produced from other items) belong to inventory items and are owned by that module.
export const offeringBom = commerceSchema.table(
  'offering_bom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(1),
    // May differ from how the item is stocked — 1.4 Metre of fabric held in Rolls. Resolved through
    // inventory_item_uom_conversions; a line with no conversion path is rejected when it is saved.
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offering_bom_variant_item_uom').on(table.variantId, table.inventoryItemId, table.uomId),
    index('idx_offering_bom_variant').on(table.variantId, table.sortOrder),
    index('idx_offering_bom_item').on(table.inventoryItemId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('offering_reach', {
      as: 'restrictive',
      for: 'all',
      using: sql.raw('exists (select 1 from commerce.offering_variants v where v.id = variant_id)'),
    }),
  ],
);

export type OfferingBomLine = typeof offeringBom.$inferSelect;
export type NewOfferingBomLine = typeof offeringBom.$inferInsert;
