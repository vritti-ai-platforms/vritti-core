import { boolean, date, decimal, index, pgPolicy, timestamp, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { sql } from '@vritti/api-sdk/drizzle-orm';
import { coreSchema } from './core-schema';
import { stockAdjustments } from './stock-adjustments';
import { inventoryItemBatches } from './inventory-item-batches';
import { storageLocations } from './storage-locations';

export const stockAdjustmentLines = coreSchema.table(
  'stock_adjustment_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql`current_setting('app.org_id')::uuid`),
    businessUnitId: uuid('business_unit_id').notNull().default(sql`current_setting('app.bu_id')::uuid`),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    createdById: uuid('created_by_id').notNull(),
    batchId: uuid('batch_id').references(() => inventoryItemBatches.id, { onDelete: 'set null' }),
    locationId: uuid('location_id').references(() => storageLocations.id),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    batchNumber: varchar('batch_number', { length: 100 }),
    isBalanced: boolean('is_balanced').notNull().default(false),
    manufacturingDate: date('manufacturing_date'),
    expiryDate: date('expiry_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_stock_adjustment_lines_adjustment').on(table.stockAdjustmentId),
    index('idx_stock_adjustment_lines_batch').on(table.batchId),
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

export type StockAdjustmentLine = typeof stockAdjustmentLines.$inferSelect;
export type NewStockAdjustmentLine = typeof stockAdjustmentLines.$inferInsert;
