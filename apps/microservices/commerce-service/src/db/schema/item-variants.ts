import { boolean, decimal, index, integer, jsonb, primaryKey, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';

export const itemOptions = coreSchema.table(
  'item_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [unique('uq_item_options_item_name').on(table.itemId, table.name)],
);

export type ItemOption = typeof itemOptions.$inferSelect;
export type NewItemOption = typeof itemOptions.$inferInsert;

export const itemOptionValues = coreSchema.table(
  'item_option_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    optionId: uuid('option_id').notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [unique('uq_item_option_values_option_value').on(table.optionId, table.value)],
);

export type ItemOptionValue = typeof itemOptionValues.$inferSelect;
export type NewItemOptionValue = typeof itemOptionValues.$inferInsert;

export const itemVariants = coreSchema.table(
  'item_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }),
    isAvailable: boolean('is_available').notNull().default(true),
    manageInventory: boolean('manage_inventory').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_item_variants_item_sku').on(table.itemId, table.sku),
    index('idx_item_variants_item').on(table.itemId),
  ],
);

export type ItemVariant = typeof itemVariants.$inferSelect;
export type NewItemVariant = typeof itemVariants.$inferInsert;

export const itemVariantOptionValues = coreSchema.table(
  'item_variant_option_values',
  {
    variantId: uuid('variant_id').notNull(),
    optionValueId: uuid('option_value_id').notNull(),
  },
  (table) => [primaryKey({ columns: [table.variantId, table.optionValueId] })],
);

export type ItemVariantOptionValue = typeof itemVariantOptionValues.$inferSelect;
export type NewItemVariantOptionValue = typeof itemVariantOptionValues.$inferInsert;
