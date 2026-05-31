import { sql } from '@vritti/api-sdk/drizzle-orm';
import {
  bigint,
  boolean,
  check,
  decimal,
  index,
  pgPolicy,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@vritti/api-sdk/drizzle-pg-core';

import { coreSchema } from './core-schema';
import { inventoryItemQuants } from './inventory-item-quants';
import { locations } from './locations';
import { stockAdjustmentLots } from './stock-adjustment-lots';
import { stockAdjustments } from './stock-adjustments';
import { uom } from './uom';

export const stockAdjustmentLines = coreSchema.table(
  'stock_adjustment_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("current_setting('app.org_id')::uuid")),
    businessUnitId: uuid('business_unit_id').notNull().default(sql.raw("current_setting('app.bu_id')::uuid")),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    // Register intent (OPENING_STOCK): exactly one of locationId / quantId must be set
    stockAdjustmentLotId: uuid('stock_adjustment_lot_id').references(() => stockAdjustmentLots.id, {
      onDelete: 'cascade',
    }),
    locationId: uuid('location_id').references(() => locations.id),
    // Change intent (deduct + CORRECTION):
    quantId: uuid('quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    // Always set:
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    // Line quantity expressed in the line's UOM (paired with primaryQty for the item's primary UOM).
    uomQty: decimal('uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    // Snapshot of the line quantity converted to the item's primary UOM at the time the line was
    // created/updated. Computed in the service via UomConversionsService (Decimal math); never derived
    // in SQL. Aggregates use SUM(primary_uom_qty) directly.
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    resolvedQuantId: uuid('resolved_quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    isBalanced: boolean('is_balanced').notNull().default(true),
    // Write-off snapshot for negative SAs (WASTE / DAMAGE / EXPIRED / THEFT / negative CORRECTION):
    // captures `source_quant.unit_cost × primary_uom_qty` at publish so loss reporting and
    // P&L don't have to rejoin to the quant history. Positive SAs (OPENING_STOCK, positive
    // CORRECTION) leave this at 0 — they go through Associate Cost instead. writeOffCurrency is
    // NULL during PR1 transition; Phase 4 (SA publish) always sets it. Tighten to NOT NULL later.
    writeOffAmount: bigint('write_off_amount', { mode: 'bigint' }).notNull().default(0n),
    writeOffCurrency: varchar('write_off_currency', { length: 3 }),
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
    index('idx_stock_adjustment_lines_uom').on(table.uomId),
    // OPENING_STOCK lines: a lot can't have two lines on the same bin in the same UOM.
    // Partial index on quant_id IS NULL scopes the rule to register-intent lines.
    // NULLS NOT DISTINCT makes (lot=NULL, location, uom) trios collide for tracking='quantity' opening stock.
    uniqueIndex('uq_stock_adjustment_lines_lot_location_uom')
      .on(table.stockAdjustmentId, table.stockAdjustmentLotId, table.locationId, table.uomId)
      .where(sql`${table.quantId} IS NULL`),
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
