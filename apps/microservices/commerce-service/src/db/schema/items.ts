import { boolean, decimal, index, integer, jsonb, pgPolicy, text, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { catalogItemTypeEnum } from './enums';
import { coreSchema } from './core-schema';

export const items = coreSchema.table(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    categoryId: uuid('category_id'),
    type: catalogItemTypeEnum('type').notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    basePrice: decimal('base_price', { precision: 12, scale: 2 }).notNull(),
    taxGroupId: uuid('tax_group_id'),
    isAvailable: boolean('is_available').notNull().default(true),
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
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = current_setting('app.bu_id', true)::uuid`,
    }),
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
