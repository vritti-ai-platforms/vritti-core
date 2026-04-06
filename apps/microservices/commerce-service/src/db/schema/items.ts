import { boolean, decimal, index, integer, jsonb, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { catalogItemTypeEnum } from './enums';
import { coreSchema } from './core-schema';

export const items = coreSchema.table(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull(),
    categoryId: uuid('category_id'),
    type: catalogItemTypeEnum('type').notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    basePrice: decimal('base_price', { precision: 12, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
    taxGroupId: uuid('tax_group_id'),
    hsnSacCode: varchar('hsn_sac_code', { length: 8 }),
    isAvailable: boolean('is_available').notNull().default(true),
    isVisible: boolean('is_visible').notNull().default(true),
    trackInventory: boolean('track_inventory').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    attributes: jsonb('attributes').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_items_bu_code').on(table.businessUnitId, table.code),
    index('idx_items_bu').on(table.businessUnitId),
    index('idx_items_category').on(table.categoryId),
  ],
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const itemImages = coreSchema.table(
  'item_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull(),
    url: varchar('url').notNull(),
    altText: varchar('alt_text'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_item_images_item').on(table.itemId)],
);

export type ItemImage = typeof itemImages.$inferSelect;
export type NewItemImage = typeof itemImages.$inferInsert;
