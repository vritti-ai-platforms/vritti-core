import { sql } from '@vritti/api-sdk/drizzle-orm';
import { boolean, check, decimal, index, jsonb, pgPolicy, timestamp, uuid } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { inventoryItemQuants } from './inventory-item-quants';
import { stockAdjustmentLots } from './stock-adjustment-lots';
import { stockAdjustments } from './stock-adjustments';
import { storageLocations } from './storage-locations';

export const stockAdjustmentLines = coreSchema.table(
  'stock_adjustment_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    createdById: uuid('created_by_id').notNull(),
    // Register intent (OPENING_STOCK): exactly one of locationId / quantId must be set
    stockAdjustmentLotId: uuid('stock_adjustment_lot_id').references(() => stockAdjustmentLots.id, {
      onDelete: 'cascade',
    }),
    locationId: uuid('location_id').references(() => storageLocations.id),
    // Change intent (deduct + CORRECTION):
    quantId: uuid('quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    // Always set:
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    resolvedQuantId: uuid('resolved_quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    isBalanced: boolean('is_balanced').notNull().default(true),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_stock_adjustment_lines_adjustment').on(table.stockAdjustmentId),
    index('idx_stock_adjustment_lines_lot').on(table.stockAdjustmentLotId),
    index('idx_stock_adjustment_lines_quant').on(table.quantId),
    index('idx_stock_adjustment_lines_resolved').on(table.resolvedQuantId),
    check(
      'chk_line_intent',
      sql`(${table.locationId} IS NOT NULL AND ${table.quantId} IS NULL)
       OR (${table.locationId} IS NULL AND ${table.quantId} IS NOT NULL)`,
    ),
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

export type StockAdjustmentLine = typeof stockAdjustmentLines.$inferSelect;
export type NewStockAdjustmentLine = typeof stockAdjustmentLines.$inferInsert;
