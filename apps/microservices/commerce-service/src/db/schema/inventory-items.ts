import { sql } from '@vritti/api-sdk/drizzle-orm';
import { index, jsonb, pgPolicy, timestamp, unique, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { categories } from './categories';
import { coreSchema } from './core-schema';
import { inventoryItemTypeEnum, inventoryPickStrategyEnum, inventoryTrackingEnum } from './enums';
import { taxGroups } from './tax-groups';
import { uom } from './uom';

export const inventoryItems = coreSchema.table(
  'inventory_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    type: inventoryItemTypeEnum('type').notNull(),
    tracking: inventoryTrackingEnum('tracking').notNull().default('lot'),
    pickStrategy: inventoryPickStrategyEnum('pick_strategy').notNull().default('none'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    description: varchar('description', { length: 500 }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    purchaseTaxGroupId: uuid('purchase_tax_group_id').references(() => taxGroups.id),
    hsnCode: varchar('hsn_code', { length: 20 }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_items_bu_code').on(table.businessUnitId, table.code),
    index('idx_inventory_items_bu').on(table.organizationId, table.businessUnitId),
    index('idx_inventory_items_category').on(table.categoryId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = (select current_setting('app.org_id', true)::uuid)`,
    }),
    pgPolicy('bu_ancestor_read', {
      for: 'select',
      using: sql`business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[])`,
    }),
    pgPolicy('bu_write', {
      for: 'insert',
      withCheck: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_update', {
      for: 'update',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
    pgPolicy('bu_delete', {
      for: 'delete',
      using: sql`business_unit_id = (select current_setting('app.bu_id', true)::uuid)`,
    }),
  ],
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
