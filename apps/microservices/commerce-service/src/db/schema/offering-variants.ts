import { type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  boolean,
  codeCheck,
  decimal,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';

import { commerceSchema } from './commerce-schema';
import { fulfilmentTypeEnum } from './enums';
import { inventoryItems } from './inventory-items';
import { offeringAttributes, offeringAttributeValues } from './offering-attributes';
import { offeringDimensions, offeringDimensionValues } from './offering-dimensions';
import { offerings } from './offerings';
import { taxClasses } from './tax-classes';
import { uom } from './uom';
import { organizationIdColumn, scopeFromOwnerPolicies } from './workspace-scope';

export interface VariantFacet {
  code: string;
  label: string;
  values: { code: string; value: string }[];
}

export const offeringVariants = commerceSchema.table(
  'offering_variants',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => offerings.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 200 }).notNull(),
    externalSku: varchar('external_sku', { length: 100 }),
    dimensions: jsonb('dimensions').$type<VariantFacet[]>().notNull().default([]),
    attributes: jsonb('attributes').$type<VariantFacet[]>().notNull().default([]),
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
    isOfferingActive: boolean('is_offering_active').notNull().default(false),
    combinationKey: text('combination_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_offering_variants_org_code').on(table.organizationId, table.code),
    codeCheck('offering_variants_code_chk', table.code),
    unique('uq_offering_variants_offering_combination').on(table.offeringId, table.combinationKey),
    unique('uq_offering_variants_org_external_sku').on(table.organizationId, table.externalSku),
    index('idx_offering_variants_offering').on(table.offeringId, table.code),
    ...scopeFromOwnerPolicies({ owner: offerings, fk: table.offeringId }),
  ],
);

export type OfferingVariant = typeof offeringVariants.$inferSelect;
export type NewOfferingVariant = typeof offeringVariants.$inferInsert;

export const offeringVariantValues = commerceSchema.table(
  'offering_variant_values',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
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

export const offeringVariantAttributeValues = commerceSchema.table(
  'offering_variant_attribute_values',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => offeringVariants.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => offeringAttributes.id, { onDelete: 'restrict' }),
    valueId: uuid('value_id')
      .notNull()
      .references(() => offeringAttributeValues.id, { onDelete: 'restrict' }),
  },
  (table) => [
    unique('uq_offering_variant_attribute_values_variant_value').on(table.variantId, table.valueId),
    index('idx_offering_variant_attribute_values_value').on(table.valueId),
    index('idx_offering_variant_attribute_values_attribute').on(table.attributeId),
    ...scopeFromOwnerPolicies({
      owner: offerings,
      fk: table.variantId,
      through: [{ table: offeringVariants, fk: (parent) => parent.offeringId }],
    }),
  ],
);

export type OfferingVariantAttributeValue = typeof offeringVariantAttributeValues.$inferSelect;
export type NewOfferingVariantAttributeValue = typeof offeringVariantAttributeValues.$inferInsert;

export const offeringBom = commerceSchema.table(
  'offering_bom',
  {
    id: uuid('id').primaryKey().default(sql`uuidv7()`),
    organizationId: organizationIdColumn(),
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

// Renders the dimension junction as the cached column holds it, correlated for an UPDATE over the variants
export function dimensionsFacetSql(): SQL {
  return sql`(
    select coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) order by f.sort_order),
      '[]'::jsonb
    )
    from (
      select ${offeringDimensions.code} as code,
             ${offeringDimensions.name} as label,
             ${offeringDimensions.sortOrder} as sort_order,
             jsonb_agg(
               jsonb_build_object('code', ${offeringDimensionValues.code}, 'value', ${offeringDimensionValues.value})
               order by ${offeringDimensionValues.sortOrder}
             ) as values
      from ${offeringVariantValues}
      join ${offeringDimensions} on ${offeringDimensions.id} = ${offeringVariantValues.dimensionId}
      join ${offeringDimensionValues} on ${offeringDimensionValues.id} = ${offeringVariantValues.valueId}
      where ${offeringVariantValues.variantId} = ${offeringVariants.id}
      group by ${offeringDimensions.id}, ${offeringDimensions.code}, ${offeringDimensions.name}, ${offeringDimensions.sortOrder}
    ) f
  )`;
}

// Renders the attribute junction as the cached column holds it, correlated for an UPDATE over the variants
export function attributesFacetSql(): SQL {
  return sql`(
    select coalesce(
      jsonb_agg(jsonb_build_object('code', f.code, 'label', f.label, 'values', f.values) order by f.sort_order),
      '[]'::jsonb
    )
    from (
      select ${offeringAttributes.code} as code,
             ${offeringAttributes.name} as label,
             ${offeringAttributes.sortOrder} as sort_order,
             jsonb_agg(
               jsonb_build_object('code', ${offeringAttributeValues.code}, 'value', ${offeringAttributeValues.value})
               order by ${offeringAttributeValues.sortOrder}
             ) as values
      from ${offeringVariantAttributeValues}
      join ${offeringAttributes} on ${offeringAttributes.id} = ${offeringVariantAttributeValues.attributeId}
      join ${offeringAttributeValues} on ${offeringAttributeValues.id} = ${offeringVariantAttributeValues.valueId}
      where ${offeringVariantAttributeValues.variantId} = ${offeringVariants.id}
      group by ${offeringAttributes.id}, ${offeringAttributes.code}, ${offeringAttributes.name}, ${offeringAttributes.sortOrder}
    ) f
  )`;
}

const VARIANT_LABEL_SEPARATOR = ' · ';

// Flattens an offering's name and a variant's facets into the one string an order line snapshots
export function variantLabel(offeringName: string, dimensions: VariantFacet[] = [], max = 500): string {
  const values = dimensions.flatMap((facet) => facet.values.map((entry) => entry.value));
  return [offeringName, ...values].join(VARIANT_LABEL_SEPARATOR).slice(0, max);
}
