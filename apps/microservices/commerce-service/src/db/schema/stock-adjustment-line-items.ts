import { decimal, index, pgPolicy, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItems } from './inventory-items';
import { stockAdjustmentLines } from './stock-adjustment-lines';

export const stockAdjustmentLineItems = coreSchema.table(
  'stock_adjustment_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    stockAdjustmentLineId: uuid('stock_adjustment_line_id')
      .notNull()
      .references(() => stockAdjustmentLines.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_sa_line_items_line').on(table.stockAdjustmentLineId),
    index('idx_sa_line_items_item').on(table.inventoryItemId),
    pgPolicy('org_isolation', {
      for: 'all',
      using: sql`organization_id = current_setting('app.org_id', true)::uuid`,
    }),
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

export type StockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferSelect;
export type NewStockAdjustmentLineItem = typeof stockAdjustmentLineItems.$inferInsert;
