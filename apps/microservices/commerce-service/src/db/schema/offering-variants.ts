import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';

import { commerceSchema } from './commerce-schema';
import { fulfilmentTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { offeringDimensions, offeringDimensionValues } from './offering-dimensions';
import { offerings } from './offerings';
import { taxClasses } from './tax-classes';
import { uom } from './uom';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export const offeringVariants = commerceSchema.table(
  'offering_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 200 }).notNull(),
    externalSku: varchar('external_sku', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    salesUomId: uuid('sales_uom_id')
      .notNull()
      .references(() => uom.id),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id),
    isTaxClassOverridden: boolean('is_tax_class_overridden').notNull().default(false),
    fulfilmentType: fulfilmentTypeEnum('fulfilment_type').notNull(),
    isFulfilmentOverridden: boolean('is_fulfilment_overridden').notNull().default(false),
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
    unique('uq_offering_variants_org_sku').on(table.organizationId, table.sku),
    unique('uq_offering_variants_org_external_sku').on(table.organizationId, table.externalSku),
    index('idx_offering_variants_offering').on(table.offeringId, table.sortOrder),
    ...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),
  ],
);

export type OfferingVariant = typeof offeringVariants.$inferSelect;
export type NewOfferingVariant = typeof offeringVariants.$inferInsert;

export const offeringVariantValues = commerceSchema.table(
  'offering_variant_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
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
    unique('uq_offering_variant_values_variant_dimension').on(table.variantId, table.dimensionId),
    index('idx_offering_variant_values_value').on(table.valueId),
    index('idx_offering_variant_values_dimension').on(table.dimensionId),
    ...scopeFromOwnerPolicies({
      owner: offerings,
      fk: table.variantId,
      through: [{ table: offeringVariants, fk: (parent) => parent.offeringId }],
    }),
  ],
);

export type OfferingVariantValue = typeof offeringVariantValues.$inferSelect;
export type NewOfferingVariantValue = typeof offeringVariantValues.$inferInsert;

export const offeringBom = commerceSchema.table(
  'offering_bom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: organizationIdColumn,
    variantId: uuid('variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id')
      .notNull()
      .references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3, mode: 'number' }).notNull().default(1),
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
    ...scopeFromOwnerPolicies({
      owner: offerings,
      fk: table.variantId,
      through: [{ table: offeringVariants, fk: (parent) => parent.offeringId }],
    }),
  ],
);

export type OfferingBomLine = typeof offeringBom.$inferSelect;
export type NewOfferingBomLine = typeof offeringBom.$inferInsert;
