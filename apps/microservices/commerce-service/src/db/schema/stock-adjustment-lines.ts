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

import { commerceSchema } from './commerce-schema';
import { inventoryItemQuants } from './inventory-item-quants';
import { locations } from './locations';
import { stockAdjustmentLots } from './stock-adjustment-lots';
import { stockAdjustments } from './stock-adjustments';
import { uom } from './uom';

export const stockAdjustmentLines = commerceSchema.table(
  'stock_adjustment_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull().default(sql.raw("cast(current_setting('app.org_id') as uuid)")),
    siteId: uuid('site_id').notNull().default(sql.raw("cast(current_setting('app.site_id') as uuid)")),
    stockAdjustmentId: uuid('stock_adjustment_id')
      .notNull()
      .references(() => stockAdjustments.id, { onDelete: 'cascade' }),
    stockAdjustmentLotId: uuid('stock_adjustment_lot_id').references(() => stockAdjustmentLots.id, {
      onDelete: 'cascade',
    }),
    locationId: uuid('location_id').references(() => locations.id),
    quantId: uuid('quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    uomId: uuid('uom_id')
      .notNull()
      .references(() => uom.id),
    uomQty: decimal('uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    primaryUomQty: decimal('primary_uom_qty', { precision: 12, scale: 3, mode: 'number' }).notNull(),
    resolvedQuantId: uuid('resolved_quant_id').references(() => inventoryItemQuants.id, { onDelete: 'set null' }),
    isBalanced: boolean('is_balanced').notNull().default(true),
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
    pgPolicy('site_read', {
      for: 'select',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_write', {
      for: 'insert',
      withCheck: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_update', {
      for: 'update',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
    pgPolicy('site_delete', {
      for: 'delete',
      using: sql`site_id = (select current_setting('app.site_id', true)::uuid)`,
    }),
  ],
);

export type StockAdjustmentLine = typeof stockAdjustmentLines.$inferSelect;
export type NewStockAdjustmentLine = typeof stockAdjustmentLines.$inferInsert;
