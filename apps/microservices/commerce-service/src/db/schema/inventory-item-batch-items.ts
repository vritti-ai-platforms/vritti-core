import { decimal, index, pgPolicy, timestamp, unique, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { inventoryItemBatches } from './inventory-item-batches';
import { inventoryItems } from './inventory-items';

export const inventoryItemBatchItems = coreSchema.table(
  'inventory_item_batch_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    inventoryItemBatchId: uuid('inventory_item_batch_id')
      .notNull()
      .references(() => inventoryItemBatches.id, { onDelete: 'cascade' }),
    inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'restrict' }),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('uq_inventory_batch_items_batch_item').on(table.inventoryItemBatchId, table.inventoryItemId),
    index('idx_inventory_batch_items_batch').on(table.inventoryItemBatchId),
    index('idx_inventory_batch_items_item').on(table.inventoryItemId),
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

export type InventoryItemBatchItem = typeof inventoryItemBatchItems.$inferSelect;
export type NewInventoryItemBatchItem = typeof inventoryItemBatchItems.$inferInsert;
